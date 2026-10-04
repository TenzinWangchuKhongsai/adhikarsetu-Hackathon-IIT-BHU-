'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useCase } from '@/hooks/useCase';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { UploadedDocument, DocumentType } from '@/lib/types';
import Navbar from '@/components/shared/Navbar';
import StepIndicator from '@/components/case/StepIndicator';
import DocumentUploader from '@/components/documents/DocumentUploader';
import OcrResultCard from '@/components/documents/OcrResultCard';
import MismatchAlert from '@/components/documents/MismatchAlert';
import { syncChecklistWithDocuments } from '@/lib/rules-engine';

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const caseId = params.caseId as string;
  const { caseData, loading, updateCase, confirmReviewDocument } = useCase(caseId);
  const [targetReplaceType, setTargetReplaceType] = useState<DocumentType | null>(null);

  const handleDocumentAdded = useCallback((doc: UploadedDocument) => {
    if (!caseData) return;
    // If replacing an existing document of same type, replace it
    const existingIndex = caseData.documents.findIndex((d) => d.type === doc.type);
    let updatedDocs = [...caseData.documents];
    if (existingIndex >= 0) {
      updatedDocs[existingIndex] = doc;
    } else {
      updatedDocs.push(doc);
    }

    const updated = {
      ...caseData,
      documents: updatedDocs,
    };
    const synced = syncChecklistWithDocuments(updated);
    updateCase(synced);
    setTargetReplaceType(null);
  }, [caseData, updateCase]);

  const handleRemoveDocument = useCallback((docId: string) => {
    if (!caseData) return;
    const updated = {
      ...caseData,
      documents: caseData.documents.filter((d) => d.id !== docId),
    };
    const synced = syncChecklistWithDocuments(updated);
    updateCase(synced);
  }, [caseData, updateCase]);

  const handleTriggerReplace = useCallback((type: DocumentType) => {
    setTargetReplaceType(type);
    // Smooth scroll to uploader
    const uploaderEl = document.getElementById('uploader-card');
    if (uploaderEl) {
      uploaderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }} aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('loading', lang)}</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--color-danger)', fontSize: '18px', marginBottom: 16 }}>Case not found</p>
          <a href="/" className="btn btn-primary">Go Home</a>
        </div>
      </div>
    );
  }

  const requiredItems = caseData.checklist.filter((i) => i.required);
  const verifiedCount = caseData.documents.filter((d) => d.verified).length;
  const invalidDocs = caseData.documents.filter((d) => d.validation?.status === 'INVALID');
  const reviewDocs = caseData.documents.filter((d) => d.validation?.status === 'NEEDS_REVIEW' && !d.validation?.userConfirmed);
  const missingCount = requiredItems.filter((i) => i.evidenceStatus === 'MISSING').length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar showBack backHref="/" />
      <div className="container-app" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '720px' }}>
        <StepIndicator currentStep={2} />

        {/* Case info & Truthful Readiness Header */}
        <div className="card animate-fadeInUp" style={{ padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>
                {lang === 'hi' ? 'मामला ID' : 'Case ID'}: <strong style={{ fontFamily: 'monospace' }}>{caseData.id}</strong>
              </p>
              <p style={{ fontWeight: 800, fontSize: '17px', color: 'var(--color-primary-dark)', margin: 0 }}>
                {caseData.claimantName}
                {caseData.deceasedName && (
                  <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                    {' '}{lang === 'hi' ? 'के लिए' : 'for'} {caseData.deceasedName}
                  </span>
                )}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.04em' }}>
                {lang === 'hi' ? 'तैयारी स्कोर' : 'Evidence Readiness'}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 900,
                color: caseData.readinessScore >= 80 ? 'var(--color-success)' : caseData.readinessScore >= 40 ? 'var(--color-accent)' : 'var(--color-danger)'
              }}>
                {caseData.readinessScore}%
              </div>
            </div>
          </div>

          {/* Metric Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '12px', background: 'rgba(22,163,74,0.1)', color: '#15803D', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
              ✓ {verifiedCount} {lang === 'hi' ? 'सत्यापित दस्तावेज़' : 'Verified'}
            </span>
            {invalidDocs.length > 0 && (
              <span style={{ fontSize: '12px', background: 'rgba(220,38,38,0.12)', color: '#B91C1C', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                ✗ {invalidDocs.length} {lang === 'hi' ? 'अस्वीकृत (बदलें)' : 'Rejected (Replace)'}
              </span>
            )}
            {reviewDocs.length > 0 && (
              <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                ⚠️ {reviewDocs.length} {lang === 'hi' ? 'समीक्षा आवश्यक' : 'Needs Review'}
              </span>
            )}
            <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.05)', color: 'var(--color-text-secondary)', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
              ● {missingCount} {lang === 'hi' ? 'आवश्यक बाकी' : 'Required Missing'}
            </span>
          </div>

          {/* Explanation if not ready */}
          {caseData.readinessExplanation && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '10px 0 0', lineHeight: 1.4 }}>
              ℹ️ {caseData.readinessExplanation}
            </p>
          )}
        </div>

        {/* Active Blockers Alert (Name mismatches) */}
        {caseData.nameMismatches.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '10px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '18px' }} aria-hidden="true">⚠️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#991B1B' }}>
                  {lang === 'hi' ? 'सक्रिय रुकावट: नाम में विसंगति पाई गई' : 'Active Blocker: Name Mismatch Detected'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#B91C1C' }}>
                  {lang === 'hi'
                    ? 'दस्तावेज़ों में नाम अलग हैं। दावा अस्वीकृत होने से बचाने के लिए नोटरीकृत शपथ पत्र आवश्यक है।'
                    : 'Names differ across documents. This must be resolved with an affidavit before filing.'}
                </p>
              </div>
            </div>
            <MismatchAlert mismatches={caseData.nameMismatches} />
          </div>
        )}

        {/* Invalid Documents Blocker Banner */}
        {invalidDocs.length > 0 && (
          <div className="alert alert-danger animate-fadeIn" style={{ marginBottom: '20px' }} role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#991B1B' }}>
                {lang === 'hi' ? 'अस्वीकृत दस्तावेज़ मिला: चेकलिस्ट सत्यापित नहीं हुई' : 'Invalid Document Uploaded: Not Counted Towards Checklist'}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#7F1D1D' }}>
                {lang === 'hi'
                  ? 'अपलोड किए गए दस्तावेज़ में आवश्यक पहचान प्रमाण नहीं मिला (जैसे रैंडम फ़ोटो या अस्पष्ट स्कैन)। कृपया नीचे दिए गए "दस्तावेज़ बदलें" बटन पर क्लिक करके स्पष्ट प्रति अपलोड करें।'
                  : 'The uploaded file lacked the required certificate indicators (e.g. random image or wrong document). Click "Replace Document" below to upload an authentic certificate.'}
              </p>
            </div>
          </div>
        )}

        {/* Uploader Card */}
        <div id="uploader-card" className="card animate-fadeInUp delay-100" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--color-primary-dark)' }}>
            📎 {t('uploadDocuments', lang)}
          </h2>
          <DocumentUploader
            onDocumentAdded={handleDocumentAdded}
            targetType={targetReplaceType}
            onCancelTarget={() => setTargetReplaceType(null)}
          />
        </div>

        {/* Uploaded documents list */}
        {caseData.documents.length > 0 && (
          <div className="animate-fadeInUp delay-200">
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: 'var(--color-text)' }}>
              {lang === 'hi' ? `${caseData.documents.length} दस्तावेज़ अपलोड किए गए` : `${caseData.documents.length} document${caseData.documents.length > 1 ? 's' : ''} uploaded`}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {caseData.documents.map((doc) => (
                <OcrResultCard
                  key={doc.id}
                  doc={doc}
                  onRemove={handleRemoveDocument}
                  onConfirmReview={confirmReviewDocument}
                  onReplace={handleTriggerReplace}
                />
              ))}
            </div>
          </div>
        )}

        {/* Next navigation CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
          <button
            onClick={() => router.push(`/case/${caseId}/checklist`)}
            className="btn btn-primary btn-lg"
            id="proceed-to-checklist-btn"
          >
            {lang === 'hi' ? 'चेकलिस्ट देखें' : 'View Checklist'} →
          </button>
        </div>
      </div>
    </div>
  );
}
