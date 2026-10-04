'use client';

import { useState, useRef, useCallback } from 'react';
import { DocumentType, UploadedDocument } from '@/lib/types';
import { extractOcrData } from '@/lib/ocr-extractor';
import { validateDocument, DocumentValidation } from '@/lib/document-validator';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { labels } from '@/lib/i18n';

const DOCUMENT_TYPES: DocumentType[] = [
  'DEATH_CERTIFICATE',
  'PAN_CARD',
  'AADHAAR',
  'BANK_PASSBOOK',
  'SHARE_CERTIFICATE',
  'AFFIDAVIT',
  'INDEMNITY_BOND',
  'LEGAL_HEIR_CERTIFICATE',
  'DIVIDEND_WARRANT',
  'TRANSMISSION_FORM',
  'BROKER_STATEMENT',
  'CANCELLED_CHEQUE',
  'NOMINEE_FORM',
];

function generateDocId() {
  return `DOC-${Date.now().toString(36).toUpperCase()}`;
}

interface DocumentUploaderProps {
  onDocumentAdded: (doc: UploadedDocument) => void;
  targetType?: DocumentType | null; // Optional pre-selected type from checklist replacement CTA
  onCancelTarget?: () => void;
}

export default function DocumentUploader({
  onDocumentAdded,
  targetType,
  onCancelTarget,
}: DocumentUploaderProps) {
  const { lang } = useLanguage();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(targetType || null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<{
    validation: DocumentValidation;
    docName: string;
    docType: DocumentType;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync if targetType changes from parent
  if (targetType && selectedType !== targetType && !processing) {
    setSelectedType(targetType);
  }

  const docTypeLabel = (type: DocumentType) =>
    lang === 'hi' ? (labels[type]?.hi ?? type) : (labels[type]?.en ?? type);

  const processFile = useCallback(async (file: File, type: DocumentType) => {
    setProcessing(true);
    setError(null);
    setLastValidation(null);
    setOcrProgress(5);
    setProcessingStep(lang === 'hi' ? 'दस्तावेज़ की जांच हो रही है...' : 'Checking document...');

    const baseDoc: UploadedDocument = {
      id: generateDocId(),
      type,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      ocrStatus: 'PROCESSING',
      verified: false,
    };

    try {
      setProcessingStep(lang === 'hi' ? 'टेक्स्ट निकाला जा रहा है (OCR)...' : 'Extracting text with OCR...');
      const ocrData = await extractOcrData(file, (p) => {
        setOcrProgress(p);
        if (p > 50) {
          setProcessingStep(
            lang === 'hi' ? 'प्रमाण संकेतों का विश्लेषण हो रहा है...' : 'Checking document type & evidence signals...'
          );
        }
      });

      setOcrProgress(92);
      setProcessingStep(
        lang === 'hi' ? 'आवश्यक जानकारी की पुष्टि हो रही है...' : 'Verifying required information...'
      );

      // Deterministic validation step
      const validation = validateDocument(type, ocrData);

      const finalDoc: UploadedDocument = {
        ...baseDoc,
        ocrData,
        ocrStatus: 'DONE',
        validation,
        verified: validation.isValid,
      };

      setLastValidation({
        validation,
        docName: file.name,
        docType: type,
      });

      onDocumentAdded(finalDoc);

      if (!validation.isValid && validation.status === 'INVALID') {
        setError(lang === 'hi' ? validation.reasonHi : validation.reason);
      }
    } catch {
      const validation: DocumentValidation = {
        status: 'INVALID',
        isValid: false,
        confidence: 'NONE',
        confidenceScore: 0,
        matchedSignals: [],
        missingSignals: [],
        contradictorySignals: [],
        reason: 'Could not read text from this file. Please upload a clear photo or scan.',
        reasonHi: 'इस फ़ाइल से टेक्स्ट नहीं पढ़ा जा सका। कृपया स्पष्ट फ़ोटो अपलोड करें।',
        suggestedAction: 'Take a new photo in good lighting.',
        suggestedActionHi: 'अच्छी रोशनी में नई फ़ोटो लें।',
      };

      const failedDoc: UploadedDocument = {
        ...baseDoc,
        ocrStatus: 'ERROR',
        validation,
        verified: false,
      };

      onDocumentAdded(failedDoc);
      setError(t('ocrError', lang));
    } finally {
      setProcessing(false);
      setOcrProgress(0);
      setProcessingStep('');
      // If was targeted replacement, notify parent
      if (onCancelTarget) onCancelTarget();
    }
  }, [onDocumentAdded, lang, onCancelTarget]);

  const handleFile = useCallback((file: File) => {
    if (!selectedType) return;
    processFile(file, selectedType);
  }, [selectedType, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Step 1: Select document type */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: 0 }}>
            {lang === 'hi' ? 'चरण 1: दस्तावेज़ प्रकार चुनें' : 'Step 1: Select document type'}
          </p>
          {targetType && (
            <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {lang === 'hi' ? 'दस्तावेज़ बदलने के लिए चुना गया' : 'Targeted for replacement'}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type}
              className={`doc-type-card ${selectedType === type ? 'selected' : ''}`}
              onClick={() => {
                setSelectedType(type === selectedType ? null : type);
                setError(null);
                setLastValidation(null);
              }}
              aria-pressed={selectedType === type}
              style={{
                textAlign: 'left',
                font: 'inherit',
                width: '100%',
                border: selectedType === type ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedType === type ? 'rgba(28,79,161,0.06)' : 'var(--color-surface)',
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: selectedType === type ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {docTypeLabel(type)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Upload Zone */}
      {selectedType && (
        <div className="animate-fadeInUp">
          <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px', color: 'var(--color-text)' }}>
            {lang === 'hi' ? `चरण 2: ${docTypeLabel(selectedType)} अपलोड करें` : `Step 2: Upload ${docTypeLabel(selectedType)}`}
          </p>

          {processing ? (
            <div style={{
              border: '2px solid var(--color-primary-light)',
              borderRadius: '12px',
              padding: '36px 24px',
              textAlign: 'center',
              background: 'rgba(37,99,235,0.04)',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }} aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '16px', marginBottom: '6px' }}>
                  {processingStep || t('scanningDocument', lang)}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                  {lang === 'hi' ? 'दस्तावेज़ की प्रामाणिकता और संकेतों की जांच हो रही है...' : 'Verifying document authenticity & text signals...'}
                </p>
                <div className="progress-track" style={{ maxWidth: 340, margin: '0 auto' }}>
                  <div className="progress-fill" style={{ width: `${ocrProgress}%` }} />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', fontWeight: 600 }}>
                  {ocrProgress}%
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label={`Upload ${docTypeLabel(selectedType)}`}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-primary-light)',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }} aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-primary)', marginBottom: '6px' }}>
                {lang === 'hi' ? `${docTypeLabel(selectedType)} यहाँ खींचें या अपलोड करें` : `Upload or drag ${docTypeLabel(selectedType)} here`}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                {lang === 'hi' ? 'कैमरे से फ़ोटो लें या फ़ाइल चुनें (JPG, PNG, PDF)' : 'Take a photo or choose a file (JPG, PNG, or PDF)'}
              </p>

              {/* Primary Mobile Camera CTA + Secondary File CTA */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-primary"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ gap: '8px', minHeight: '46px', padding: '0 22px', fontSize: '15px' }}
                  aria-label="Take photo with camera"
                  id="take-photo-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  {lang === 'hi' ? 'कैमरे से फ़ोटो लें' : 'Take Photo (Camera)'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ gap: '8px', minHeight: '46px', padding: '0 20px', fontSize: '15px' }}
                  aria-label="Upload from files"
                  id="choose-file-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {lang === 'hi' ? 'फ़ाइल चुनें' : 'Choose from Device'}
                </button>
              </div>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileInput}
            aria-hidden="true"
            id="file-upload-input"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileInput}
            aria-hidden="true"
            id="camera-upload-input"
          />
        </div>
      )}

      {/* Immediate post-upload validation status banner */}
      {lastValidation && (
        <div
          className="card animate-fadeInUp"
          style={{
            padding: '16px',
            borderLeft: `5px solid ${
              lastValidation.validation.status === 'VALID'
                ? 'var(--color-success)'
                : lastValidation.validation.status === 'NEEDS_REVIEW'
                ? 'var(--color-accent)'
                : 'var(--color-danger)'
            }`,
            background:
              lastValidation.validation.status === 'VALID'
                ? 'rgba(22,163,74,0.06)'
                : lastValidation.validation.status === 'NEEDS_REVIEW'
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(220,38,38,0.08)',
          }}
          role="status"
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }} aria-hidden="true">
              {lastValidation.validation.status === 'VALID'
                ? '✓'
                : lastValidation.validation.status === 'NEEDS_REVIEW'
                ? '⚠️'
                : '❌'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontWeight: 800,
                fontSize: '15px',
                color:
                  lastValidation.validation.status === 'VALID'
                    ? 'var(--color-success)'
                    : lastValidation.validation.status === 'NEEDS_REVIEW'
                    ? '#B45309'
                    : 'var(--color-danger)',
                margin: '0 0 4px',
              }}>
                {lastValidation.validation.status === 'VALID'
                  ? (lang === 'hi' ? `${docTypeLabel(lastValidation.docType)} मान्य प्रतीत होता है` : `${docTypeLabel(lastValidation.docType)} verified with evidence`)
                  : lastValidation.validation.status === 'NEEDS_REVIEW'
                  ? (lang === 'hi' ? 'दस्तावेज़ की समीक्षा आवश्यक है' : 'Document needs review')
                  : (lang === 'hi' ? `यह ${docTypeLabel(lastValidation.docType)} प्रतीत नहीं होता` : `This does not appear to be a ${docTypeLabel(lastValidation.docType)}`)}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.4 }}>
                {lang === 'hi' ? lastValidation.validation.reasonHi : lastValidation.validation.reason}
              </p>

              {lastValidation.validation.matchedSignals.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {lastValidation.validation.matchedSignals.map((sig) => (
                    <span key={sig} style={{ fontSize: '11px', background: 'rgba(22,163,74,0.15)', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      ✓ {sig}
                    </span>
                  ))}
                </div>
              )}

              {lastValidation.validation.status === 'INVALID' && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setSelectedType(lastValidation.docType);
                      fileInputRef.current?.click();
                    }}
                    style={{ gap: '6px', fontWeight: 700 }}
                    id="replace-doc-immediate-btn"
                  >
                    🔄 {lang === 'hi' ? 'दस्तावेज़ बदलें (स्पष्ट प्रति अपलोड करें)' : 'Replace Document (Upload Clear Photo)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && !lastValidation && (
        <div className="alert alert-danger animate-fadeIn" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: '14px', color: 'var(--color-danger)' }}>{error}</span>
        </div>
      )}
    </div>
  );
}
