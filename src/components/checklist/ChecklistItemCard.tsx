'use client';

import { ChecklistItem as ChecklistItemType } from '@/lib/types';
import { useLanguage } from '@/hooks/useLanguage';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onUploadClick?: () => void;
}

export default function ChecklistItemCard({ item, onToggle, onUploadClick }: ChecklistItemProps) {
  const { lang } = useLanguage();
  const label = lang === 'hi' ? item.labelHi : item.label;
  const description = lang === 'hi' ? item.descriptionHi : item.description;
  const helpText = lang === 'hi' ? item.helpTextHi : item.helpText;

  const isVerified = item.evidenceStatus === 'VERIFIED';
  const isUserConfirmed = item.evidenceStatus === 'USER_CONFIRMED';
  const isInvalid = item.evidenceStatus === 'INVALID';
  const isReview = item.evidenceStatus === 'NEEDS_REVIEW';
  const isMissing = item.evidenceStatus === 'MISSING';

  const badgeConfig = {
    VERIFIED: {
      bg: 'rgba(22,163,74,0.15)',
      color: '#15803D',
      border: 'rgba(22,163,74,0.3)',
      textEn: '✓ DOCUMENT CHECK PASSED',
      textHi: '✓ दस्तावेज़ प्रकार सही',
    },
    USER_CONFIRMED: {
      bg: '#E0E7FF',
      color: '#3730A3',
      border: '#C7D2FE',
      textEn: 'USER CONFIRMED — NO DOCUMENT PROOF',
      textHi: 'उपयोगकर्ता द्वारा पुष्टीकृत — कोई दस्तावेज़ प्रमाण नहीं',
    },
    NEEDS_REVIEW: {
      bg: '#FEF3C7',
      color: '#B45309',
      border: '#FDE68A',
      textEn: '⚠️ NEEDS REVIEW',
      textHi: '⚠️ समीक्षा आवश्यक',
    },
    INVALID: {
      bg: '#FEE2E2',
      color: '#B91C1C',
      border: '#FCA5A5',
      textEn: '✗ INVALID DOCUMENT',
      textHi: '✗ अमान्य दस्तावेज़',
    },
    MISSING: {
      bg: 'rgba(0,0,0,0.06)',
      color: 'var(--color-text-secondary)',
      border: 'rgba(0,0,0,0.1)',
      textEn: item.required ? '● MISSING' : '○ OPTIONAL',
      textHi: item.required ? '● आवश्यक' : '○ वैकल्पिक',
    },
  }[item.evidenceStatus];

  return (
    <div
      className={`checklist-item animate-fadeInUp ${
        isVerified ? 'completed' : isInvalid ? 'missing-required' : ''
      }`}
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        border: isInvalid
          ? '2px solid rgba(220,38,38,0.3)'
          : isVerified
          ? '2px solid rgba(22,163,74,0.3)'
          : '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '16px',
        background: isInvalid
          ? 'rgba(254,242,242,0.5)'
          : isVerified
          ? 'rgba(240,253,244,0.4)'
          : 'var(--color-surface)',
      }}
    >
      {/* Checkbox button */}
      <button
        onClick={() => onToggle(item.id)}
        aria-pressed={item.completed}
        aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${label}`}
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 8,
          border: `2.5px solid ${
            isVerified
              ? 'var(--color-success)'
              : isUserConfirmed
              ? '#4F46E5'
              : isInvalid
              ? 'var(--color-danger)'
              : 'var(--color-border)'
          }`,
          background: isVerified
            ? 'var(--color-success)'
            : isUserConfirmed
            ? '#4F46E5'
            : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          marginTop: 2,
        }}
      >
        {isVerified && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        {isUserConfirmed && !isVerified && (
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 800 }}>✓</span>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{
            fontWeight: 700,
            fontSize: '15px',
            color: isVerified ? 'var(--color-success)' : 'var(--color-text)',
            textDecoration: isVerified ? 'line-through' : 'none',
            opacity: isVerified ? 0.85 : 1,
          }}>
            {label}
          </span>

          {/* Truthful Evidence Status Badge */}
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '4px',
            letterSpacing: '0.04em',
            background: badgeConfig.bg,
            color: badgeConfig.color,
            border: `1px solid ${badgeConfig.border}`,
          }}>
            {lang === 'hi' ? badgeConfig.textHi : badgeConfig.textEn}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>
          {description}
        </p>

        {/* Clear Truthful Explanations */}
        {isInvalid && (
          <div style={{
            padding: '8px 12px',
            background: '#FEE2E2',
            borderRadius: '6px',
            marginTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <p style={{ fontSize: '12px', color: '#991B1B', fontWeight: 600, margin: 0 }}>
              ❌ {lang === 'hi' ? 'अपलोड की गई फ़ाइल अमान्य है। प्रमाण सत्यापित नहीं हुआ।' : 'Uploaded file was rejected. Checkmark does not verify without an authentic certificate.'}
            </p>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="btn btn-danger btn-sm"
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
              >
                🔄 {lang === 'hi' ? 'दस्तावेज़ बदलें' : 'Replace Document'}
              </button>
            )}
          </div>
        )}

        {isUserConfirmed && (
          <div style={{
            padding: '6px 10px',
            background: 'rgba(79, 70, 229, 0.08)',
            borderRadius: '6px',
            marginTop: '6px',
          }}>
            <p style={{ fontSize: '11px', color: '#4338CA', fontWeight: 600, margin: 0 }}>
              ℹ️ {lang === 'hi'
                ? 'यह चेकबॉक्स आपकी दी गई जानकारी दर्ज करता है। यह दस्तावेज़ प्रमाण नहीं है।'
                : 'This checkbox records what you told us. It is not document evidence.'}
            </p>
          </div>
        )}

        {helpText && !isVerified && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(37,99,235,0.06)',
            borderRadius: '6px',
            borderLeft: '3px solid var(--color-primary-light)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--color-primary)', margin: 0, lineHeight: 1.4 }}>
              💡 {helpText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
