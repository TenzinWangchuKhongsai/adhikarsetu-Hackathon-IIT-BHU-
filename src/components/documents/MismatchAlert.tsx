'use client';

import { ArrowDown, FileText, TriangleAlert } from 'lucide-react';
import { NameMismatch } from '@/lib/types';
import { useLanguage } from '@/hooks/useLanguage';
import { labels } from '@/lib/i18n';

interface MismatchAlertProps {
  mismatches: NameMismatch[];
}

export default function MismatchAlert({ mismatches }: MismatchAlertProps) {
  const { lang } = useLanguage();
  if (mismatches.length === 0) return null;

  const documentLabel = (type: string) => (lang === 'hi' ? (labels[type]?.hi ?? type) : (labels[type]?.en ?? type));

  return (
    <section className="mismatch-panel" aria-labelledby="mismatch-title" aria-live="polite">
      <div className="mismatch-heading">
        <span className="mismatch-icon">
          <TriangleAlert aria-hidden="true" />
        </span>
        <div>
          <p className="mismatch-kicker">{lang === 'hi' ? 'दस्तावेज़ों की संगति' : 'DOCUMENT CONSISTENCY'}</p>
          <h2 id="mismatch-title">{lang === 'hi' ? 'नामों में अंतर मिला' : 'A name difference needs review'}</h2>
          <p>
            {lang === 'hi'
              ? 'इन नामों का मिलान नहीं हुआ। मूल दस्तावेज़ों की जाँच करें और यदि अंतर सही है तो सहायक प्रमाण दें।'
              : 'These names do not match exactly. Review the original documents and provide supporting proof if the difference is genuine.'}
          </p>
        </div>
      </div>
      <div className="mismatch-comparisons">
        {mismatches.map((mismatch, index) => (
          <div className="mismatch-comparison" key={`${mismatch.doc1Type}-${mismatch.doc2Type}-${index}`}>
            <div className="mismatch-document">
              <span className="mismatch-document-icon">
                <FileText aria-hidden="true" />
              </span>
              <span className="mismatch-document-copy">
                <span>{documentLabel(mismatch.doc1Type)}</span>
                <strong>{mismatch.doc1Name}</strong>
              </span>
            </div>
            <span className="mismatch-link" aria-hidden="true">
              <ArrowDown />
            </span>
            <div className="mismatch-document">
              <span className="mismatch-document-icon">
                <FileText aria-hidden="true" />
              </span>
              <span className="mismatch-document-copy">
                <span>{documentLabel(mismatch.doc2Type)}</span>
                <strong>{mismatch.doc2Name}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mismatch-next-step">
        <strong>{lang === 'hi' ? 'अगला कदम' : 'What to do next'}</strong>
        <span>
          {lang === 'hi'
            ? 'मूल दस्तावेज़ों की समीक्षा करें। नाम का अंतर वास्तविक हो तो उसे समझाने वाला सहायक प्रमाण जुटाएँ।'
            : 'Review the original documents. If the difference is genuine, gather supporting proof that explains it.'}
        </span>
      </div>
    </section>
  );
}
