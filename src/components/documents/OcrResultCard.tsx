'use client';

import { UploadedDocument, DocumentType } from '@/lib/types';
import { useLanguage } from '@/hooks/useLanguage';
import { labels } from '@/lib/i18n';

interface OcrResultCardProps {
  doc: UploadedDocument;
  onRemove: (id: string) => void;
  onConfirmReview?: (id: string) => void;
  onReplace?: (type: DocumentType) => void;
}

export default function OcrResultCard({
  doc,
  onRemove,
  onConfirmReview,
  onReplace,
}: OcrResultCardProps) {
  const { lang } = useLanguage();

  const docLabel = lang === 'hi'
    ? (labels[doc.type]?.hi ?? doc.type)
    : (labels[doc.type]?.en ?? doc.type);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validation = doc.validation;
  const isInvalid = validation?.status === 'INVALID' || doc.ocrStatus === 'ERROR';
  const isReview = validation?.status === 'NEEDS_REVIEW' && !validation?.userConfirmed;
  const isUserConfirmed = Boolean(validation?.userConfirmed);
  const isValid = !isUserConfirmed && (doc.verified || validation?.status === 'VALID');

  const cardBorder = isValid
    ? '1px solid #c5dbcb'
    : isUserConfirmed
    ? '1px solid #cbb8b2'
    : isReview
    ? '1px solid #e9d6ac'
    : '1px solid #e8c6c4';

  const cardBg = isValid
    ? '#f5f9f6'
    : isUserConfirmed
    ? '#f8f4f2'
    : isReview
    ? '#fbf7ef'
    : '#fbf4f3';

  return (
    <div
      className="card animate-fadeInUp"
      style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: cardBorder,
        background: cardBg,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        {/* Status icon */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: isValid ? '#e8f1eb' : isUserConfirmed ? '#f2e9e5' : isReview ? '#faf0dc' : '#f8e9e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '20px',
        }} aria-hidden="true">
          {isValid ? '✓' : isUserConfirmed ? 'i' : isReview ? '!' : '×'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text)', margin: 0 }}>
                {docLabel}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                {doc.fileName} • {formatSize(doc.fileSize)}
              </p>
            </div>

            {/* Validation Badge & Signal Strength */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
              {validation && validation.confidence && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.03em',
                  background: validation.confidence === 'HIGH' ? 'rgba(22,163,74,0.1)' : validation.confidence === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.06)',
                  color: validation.confidence === 'HIGH' ? '#166534' : validation.confidence === 'MEDIUM' ? '#92400E' : 'var(--color-text-secondary)',
                }}>
                  {validation.confidence === 'HIGH'
                    ? (lang === 'hi' ? 'मजबूत दस्तावेज़ संकेत' : 'STRONG DOCUMENT SIGNALS')
                    : validation.confidence === 'MEDIUM'
                    ? (lang === 'hi' ? 'आंशिक संकेत' : 'PARTIAL SIGNALS')
                    : (lang === 'hi' ? 'कमज़ोर संकेत' : 'WEAK / NO SIGNALS')}
                </span>
              )}

              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: isValid ? '#e8f1eb' : isUserConfirmed ? '#f2e9e5' : isReview ? '#faf0dc' : '#f8e9e8',
                color: isValid ? '#20563e' : isUserConfirmed ? '#604b45' : isReview ? '#76500d' : '#8c272d',
                border: `1px solid ${isValid ? '#c5dbcb' : isUserConfirmed ? '#d9c9c2' : isReview ? '#e9d6ac' : '#e8c6c4'}`,
              }}>
                {isValid
                  ? (lang === 'hi' ? '✓ दस्तावेज़ प्रकार की जाँच सफल' : '✓ DOCUMENT TYPE CHECK PASSED')
                  : isUserConfirmed
                  ? (lang === 'hi' ? 'उपयोगकर्ता ने पुष्टि की — दस्तावेज़ प्रमाण नहीं' : 'USER CONFIRMED — NO DOCUMENT PROOF')
                  : isReview
                  ? (lang === 'hi' ? 'समीक्षा आवश्यक' : 'NEEDS REVIEW')
                  : (lang === 'hi' ? 'अस्वीकृत — गलत या अस्पष्ट दस्तावेज़' : 'REJECTED — WRONG OR UNCLEAR DOCUMENT')}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(doc.id);
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', minHeight: '32px', fontSize: '12px', color: 'var(--color-danger)', borderColor: 'transparent' }}
                aria-label={`Remove ${docLabel}`}
                title="Remove this document"
                id={`remove-doc-${doc.id}-btn`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Validation explanation banner */}
          <div style={{ marginTop: '8px' }}>
            <p style={{
              fontSize: '13px',
              margin: '0 0 6px',
              color: isValid ? '#20563e' : isUserConfirmed ? '#604b45' : isReview ? '#76500d' : '#8c272d',
              fontWeight: 600,
              lineHeight: 1.4,
            }}>
              {isValid
                ? (lang === 'hi'
                    ? 'निकाले गए पाठ में अनुरोधित दस्तावेज़ प्रकार से मेल खाने वाले संकेत हैं। यह प्रामाणिकता सिद्ध नहीं करता है।'
                    : 'The extracted text contains signals matching the requested document type. This does not prove authenticity.')
                : isUserConfirmed
                ? (lang === 'hi'
                    ? 'आपकी पुष्टि दर्ज है, लेकिन यह दस्तावेज़ के प्रकार की जाँच या दस्तावेज़ प्रमाण के बराबर नहीं है।'
                    : 'Your confirmation is recorded, but it is not the same as a document type check or document evidence.')
                : isReview
                ? (lang === 'hi'
                    ? 'दस्तावेज़ प्रासंगिक हो सकता है, लेकिन निकाला गया पाठ दस्तावेज़ प्रकार की पुष्टि करने के लिए पर्याप्त नहीं है। कृपया समीक्षा करें या बदलें।'
                    : 'The document may be relevant, but the extracted text is not sufficient to confirm the document type. Please review or replace it.')
                : (lang === 'hi'
                    ? 'इस दस्तावेज़ में अनुरोधित प्रकार से मेल खाने वाली पर्याप्त जानकारी नहीं है। इसे प्रमाण के रूप में नहीं गिना गया है।'
                    : 'This document does not contain enough information matching the requested document type. It has not been counted as evidence.')}
            </p>

            {validation && validation.reason && !isValid && (
              <p style={{ fontSize: '14px', margin: '0 0 6px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                {lang === 'hi' ? validation.reasonHi : validation.reason}
              </p>
            )}

            {/* Matched evidence chips */}
            {validation && validation.matchedSignals.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isValid ? '#15803D' : '#92400E',
                  marginBottom: '4px',
                }}>
                  {isValid
                    ? (lang === 'hi' ? 'पहचाने गए मजबूत दस्तावेज़ संकेत:' : 'Strong document signals detected:')
                    : (lang === 'hi' ? 'पहचाने गए संकेत:' : 'Document signals detected:')}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {validation.matchedSignals.map((sig) => (
                    <span
                      key={sig}
                      style={{
                        fontSize: '12px',
                        background: isValid ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.15)',
                        color: isValid ? '#15803D' : '#92400E',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      • {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA for INVALID uploads */}
      {isInvalid && (
        <div style={{
          background: 'rgba(220,38,38,0.06)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)', margin: 0 }}>
              {lang === 'hi' ? 'यह दस्तावेज़ साक्ष्य के रूप में नहीं गिना गया है' : 'This document has not been counted as evidence'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              {validation?.suggestedAction || 'Please upload a legible photograph of the official certificate.'}
            </p>
          </div>
          {onReplace && (
            <button
              onClick={() => onReplace(doc.type)}
              className="btn btn-danger btn-sm"
              style={{ fontWeight: 700 }}
              id={`replace-${doc.type}-btn`}
            >
              {lang === 'hi' ? 'दस्तावेज़ बदलें' : 'Replace document'}
            </button>
          )}
        </div>
      )}

      {/* Action CTA for NEEDS_REVIEW uploads */}
      {isReview && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: '12px', color: '#92400E', margin: 0, flex: 1, minWidth: '220px' }}>
            {lang === 'hi'
              ? 'यदि यह पुराना या क्षेत्रीय प्रारूप है, तो आप इसकी पुष्टि कर सकते हैं (USER CONFIRMED)।'
              : 'If this is an older or regional format certificate, you can confirm it manually.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onConfirmReview && (
              <button
                onClick={() => onConfirmReview(doc.id)}
                className="btn btn-sm"
                style={{ background: '#D97706', color: '#fff', fontWeight: 700 }}
                id={`confirm-${doc.id}-btn`}
              >
                ✓ {lang === 'hi' ? 'मैंने समीक्षा की' : 'Confirm I’ve reviewed this'}
              </button>
            )}
            {onReplace && (
              <button
                onClick={() => onReplace(doc.type)}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '12px' }}
              >
                {lang === 'hi' ? 'बदलें' : 'Replace'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Extracted fields */}
      {doc.ocrStatus === 'DONE' && doc.ocrData && (doc.ocrData.name || doc.ocrData.pan || doc.ocrData.folioNumber || doc.ocrData.dob) && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '6px',
        }}>
          {doc.ocrData.name && (
            <OcrField label={lang === 'hi' ? 'निकाला गया नाम' : 'Extracted Name'} value={doc.ocrData.name} />
          )}
          {doc.ocrData.pan && (
            <OcrField label="PAN" value={doc.ocrData.pan} />
          )}
          {doc.ocrData.folioNumber && (
            <OcrField label={lang === 'hi' ? 'फोलियो / DP ID' : 'Folio / DP ID'} value={doc.ocrData.folioNumber} />
          )}
          {doc.ocrData.dob && (
            <OcrField label={lang === 'hi' ? 'जन्म तिथि' : 'DOB'} value={doc.ocrData.dob} />
          )}
        </div>
      )}
    </div>
  );
}

function OcrField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'var(--color-muted)',
      borderRadius: '6px',
      padding: '6px 10px',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: 0, wordBreak: 'break-all' }}>
        {value}
      </p>
    </div>
  );
}
