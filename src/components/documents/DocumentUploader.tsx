'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, ScanLine, Sparkles } from 'lucide-react';
import { DocumentType, UploadedDocument } from '@/lib/types';
import { extractOcrData } from '@/lib/ocr-extractor';
import { validateDocument, DocumentValidation, CaseContext } from '@/lib/document-validator';
import { useLanguage } from '@/hooks/useLanguage';
import { t, labels } from '@/lib/i18n';

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

const DEMO_FIXTURES: { label: string; file: string; type: DocumentType }[] = [
  { label: 'Death Certificate (Valid)', file: 'death_certificate_valid.png', type: 'DEATH_CERTIFICATE' },
  { label: 'Random Laptop (Invalid)', file: 'laptop_random.png', type: 'DEATH_CERTIFICATE' },
  { label: 'PAN Card (Valid)', file: 'pan_card_valid.png', type: 'PAN_CARD' },
  { label: 'Share Certificate (Valid)', file: 'share_cert_valid.png', type: 'SHARE_CERTIFICATE' },
];

function generateDocId() {
  return `DOC-${Date.now().toString(36).toUpperCase()}`;
}

interface DocumentUploaderProps {
  onDocumentAdded: (doc: UploadedDocument) => void;
  targetType?: DocumentType | null;
  onCancelTarget?: () => void;
  caseContext?: CaseContext;
}

export default function DocumentUploader({
  onDocumentAdded,
  targetType,
  onCancelTarget,
  caseContext,
}: DocumentUploaderProps) {
  const { lang } = useLanguage();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(targetType || null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<{
    validation: DocumentValidation;
    docName: string;
    docType: DocumentType;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (targetType && selectedType !== targetType && !processing) {
    setSelectedType(targetType);
  }

  const docTypeLabel = (type: DocumentType) =>
    lang === 'hi' ? (labels[type]?.hi ?? type) : (labels[type]?.en ?? type);

  const processFile = useCallback(async (file: File, type: DocumentType) => {
    setProcessing(true);
    setError(null);
    setLastValidation(null);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setOcrProgress(0);
    setProcessingStep(lang === 'hi' ? 'दस्तावेज़ की जाँच हो रही है…' : 'Checking your document…');

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
      setProcessingStep(lang === 'hi' ? 'टेक्स्ट पढ़ा जा रहा है…' : 'Reading the text…');
      const ocrData = await extractOcrData(file, (p) => {
        setOcrProgress(p);
        setProcessingStep(lang === 'hi' ? 'टेक्स्ट पढ़ा जा रहा है…' : 'Reading the text…');
      });

      setOcrProgress(100);
      setProcessingStep(
        lang === 'hi' ? 'दस्तावेज़ के प्रकार की जाँच हो रही है…' : 'Checking whether this is the document you need…'
      );

      // Deterministic validation step using actual rules and case name comparison
      const validation = validateDocument(type, ocrData, caseContext);

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

      setProcessingStep(lang === 'hi' ? 'मामले के अन्य दस्तावेज़ों से मिलान हो रहा है…' : 'Comparing with the other evidence in this case…');
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
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
      setPreviewUrl(null);
      if (onCancelTarget) onCancelTarget();
    }
  }, [onDocumentAdded, lang, onCancelTarget, caseContext]);

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

  const handleLoadFixture = async (fixtureFileName: string, targetTypeForFixture?: DocumentType) => {
    const docType = targetTypeForFixture || selectedType || 'DEATH_CERTIFICATE';
    setSelectedType(docType);
    try {
      const response = await fetch(`/fixtures/${fixtureFileName}`);
      if (!response.ok) throw new Error('Failed to load demo fixture');
      const blob = await response.blob();
      const file = new File([blob], fixtureFileName, { type: 'image/png' });
      processFile(file, docType);
    } catch (err) {
      console.error(err);
      setError('Could not load test fixture file.');
    }
  };

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
                background: selectedType === type ? 'rgba(92, 10, 26, 0.08)' : 'var(--color-surface)',
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: 'pointer',
              }}
              id={`select-doc-type-${type.toLowerCase()}`}
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
            <div className="ocr-processing" role="status" aria-live="polite">
              <div className="ocr-scan-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt={lang === 'hi' ? 'अपलोड किया गया दस्तावेज़' : 'Uploaded document'} />
                ) : (
                  <div className="ocr-file-preview">
                    <FileText aria-hidden="true" />
                    <span>{lang === 'hi' ? 'दस्तावेज़' : 'Document'}</span>
                  </div>
                )}
                <span className="ocr-scan-frame" aria-hidden="true" />
                <span className="ocr-scan-beam" aria-hidden="true" />
                <span className="ocr-scan-badge">
                  <ScanLine aria-hidden="true" />
                  {lang === 'hi' ? 'पढ़ा जा रहा है' : 'Reading'}
                </span>
              </div>
              <div className="ocr-processing-copy">
                <p className="ocr-processing-eyebrow">{lang === 'hi' ? 'दस्तावेज़ जाँच' : 'DOCUMENT CHECK'}</p>
                <h3>{processingStep || t('scanningDocument', lang)}</h3>
                <p>{lang === 'hi' ? 'टेक्स्ट आपके ब्राउज़र में पढ़ा जा रहा है। यह जाँच दस्तावेज़ की प्रामाणिकता प्रमाणित नहीं करती।' : 'Text is being read in your browser. This check does not prove a document is authentic.'}</p>
                <div className="ocr-progress-label">
                  <span>{lang === 'hi' ? 'टेक्स्ट पढ़ने की प्रगति' : 'Text reading progress'}</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div
                  className="progress-track ocr-progress-track"
                  role="progressbar"
                  aria-label={lang === 'hi' ? 'टेक्स्ट पढ़ने की प्रगति' : 'Text reading progress'}
                  aria-valuenow={ocrProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="progress-fill" style={{ width: `${ocrProgress}%` }} />
                </div>
                <div className="ocr-stage-list" aria-hidden="true">
                  <span className={ocrProgress === 100 ? 'is-complete' : 'is-current'}>
                    {lang === 'hi' ? 'टेक्स्ट पढ़ें' : 'Read text'}
                  </span>
                  <span className={ocrProgress === 100 ? 'is-current' : ''}>
                    {lang === 'hi' ? 'दस्तावेज़ प्रकार जाँचें' : 'Check document type'}
                  </span>
                  <span>{lang === 'hi' ? 'अन्य प्रमाण से मिलाएँ' : 'Compare case evidence'}</span>
                </div>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              style={{
                border: '2px dashed var(--color-primary-light)',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--color-surface)',
                cursor: 'pointer',
              }}
              id="upload-dropzone"
            >
              <div style={{ marginBottom: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }} aria-hidden="true">
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

              {/* Quick Demo Test Fixtures Bar */}
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={14} />
                  {lang === 'hi' ? 'त्वरित डेमो परीक्षण फ़ाइलें:' : 'Quick Demo Test Samples (Runs Real OCR):'}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {DEMO_FIXTURES.map((fix) => (
                    <button
                      key={fix.file}
                      type="button"
                      onClick={() => handleLoadFixture(fix.file, fix.type)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '12px', padding: '4px 10px', height: '34px', minHeight: '34px', background: 'var(--color-muted)' }}
                      id={`demo-fixture-${fix.file.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      title={`Run real OCR on ${fix.file}`}
                    >
                      {fix.label}
                    </button>
                  ))}
                </div>
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
                ? '!'
                : '×'}
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
                  ? (lang === 'hi' ? `${docTypeLabel(lastValidation.docType)} के प्रकार की जाँच सफल` : `${docTypeLabel(lastValidation.docType)} document type check passed`)
                  : lastValidation.validation.status === 'NEEDS_REVIEW'
                  ? (lang === 'hi' ? 'दस्तावेज़ की समीक्षा आवश्यक है' : 'Document needs review')
                  : (lang === 'hi' ? `यह ${docTypeLabel(lastValidation.docType)} प्रतीत नहीं होता` : `This does not appear to be a ${docTypeLabel(lastValidation.docType)}`)}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.5 }}>
                {lastValidation.validation.status === 'VALID'
                  ? (lang === 'hi' ? 'निकाले गए टेक्स्ट में इस दस्तावेज़ प्रकार से मेल खाने वाले संकेत मिले। यह प्रामाणिकता सिद्ध नहीं करता।' : 'The extracted text contains signals matching this document type. This does not prove authenticity.')
                  : (lang === 'hi' ? lastValidation.validation.reasonHi : lastValidation.validation.reason)}
              </p>

              {lastValidation.validation.matchedSignals.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: lastValidation.validation.isValid ? '#15803D' : '#92400E', marginBottom: '4px' }}>
                    {lastValidation.validation.isValid
                      ? (lang === 'hi' ? 'पहचाने गए मजबूत दस्तावेज़ संकेत:' : 'Strong document signals detected:')
                      : (lang === 'hi' ? 'पहचाने गए संकेत:' : 'Document signals detected:')}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {lastValidation.validation.matchedSignals.map((sig) => (
                      <span key={sig} style={{ fontSize: '11px', background: 'rgba(22,163,74,0.15)', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        • {sig}
                      </span>
                    ))}
                  </div>
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
                    {lang === 'hi' ? 'दस्तावेज़ बदलें (स्पष्ट प्रति अपलोड करें)' : 'Replace document with a clearer copy'}
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
