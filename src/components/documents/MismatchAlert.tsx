'use client';

import { NameMismatch } from '@/lib/types';
import { useLanguage } from '@/hooks/useLanguage';
import { labels } from '@/lib/i18n';

interface MismatchAlertProps {
  mismatches: NameMismatch[];
}

export default function MismatchAlert({ mismatches }: MismatchAlertProps) {
  const { lang } = useLanguage();

  if (mismatches.length === 0) return null;

  const docLabel = (type: string) =>
    lang === 'hi' ? (labels[type]?.hi ?? type) : (labels[type]?.en ?? type);

  return (
    <div className="alert alert-danger animate-fadeInUp" role="alert" aria-live="polite">
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m10.29 3.86-8.17 14.16A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.71-3l-8.17-14.14a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-danger)', margin: '0 0 6px' }}>
          ⚠ {lang === 'hi' ? 'नाम में अंतर पाया गया' : 'Name Mismatch Detected'}
        </p>
        <p style={{ fontSize: '13px', color: '#7F1D1D', margin: '0 0 12px', lineHeight: 1.5 }}>
          {lang === 'hi'
            ? 'आपके दस्तावेज़ों में नाम एक-दूसरे से मेल नहीं खाते। इससे आपके दावे में देरी हो सकती है। नोटरीकृत शपथ पत्र से इसे ठीक किया जा सकता है।'
            : 'The names on your documents do not match. This may delay your claim. An affidavit explaining the difference can resolve this.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mismatches.map((mm, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(220,38,38,0.06)',
                borderRadius: '8px',
                padding: '10px 14px',
                borderLeft: '3px solid var(--color-danger)',
              }}
            >
              <div style={{ fontSize: '12px', color: '#7F1D1D', marginBottom: '4px', fontWeight: 600 }}>
                {Math.round(mm.similarity * 100)}% {lang === 'hi' ? 'समानता' : 'match'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px' }}>
                <span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                    {docLabel(mm.doc1Type)}:
                  </span>{' '}
                  <span style={{ fontWeight: 700, color: '#DC2626' }}>&ldquo;{mm.doc1Name}&rdquo;</span>
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>vs</span>
                <span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                    {docLabel(mm.doc2Type)}:
                  </span>{' '}
                  <span style={{ fontWeight: 700, color: '#DC2626' }}>&ldquo;{mm.doc2Name}&rdquo;</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '10px', marginBottom: 0 }}>
          💡 {lang === 'hi'
            ? 'सुझाव: एक नोटरीकृत शपथ पत्र लें जो बताए कि ये एक ही व्यक्ति हैं।'
            : 'Tip: Get a notarized affidavit confirming both names refer to the same person.'}
        </p>
      </div>
    </div>
  );
}
