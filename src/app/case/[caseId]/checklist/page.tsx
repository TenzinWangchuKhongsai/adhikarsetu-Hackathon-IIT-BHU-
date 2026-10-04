'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCase } from '@/hooks/useCase';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import Navbar from '@/components/shared/Navbar';
import StepIndicator from '@/components/case/StepIndicator';
import ReadinessScore from '@/components/case/ReadinessScore';
import ChecklistItemCard from '@/components/checklist/ChecklistItemCard';
import { evaluateCaseReadiness } from '@/lib/rules-engine';

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const caseId = params.caseId as string;
  const { caseData, loading, toggleChecklistItem } = useCase(caseId);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  if (!caseData) return null;

  const evalResult = evaluateCaseReadiness(
    caseData.checklist,
    caseData.documents,
    caseData.nameMismatches
  );

  const required = caseData.checklist.filter((i) => i.required);
  const optional = caseData.checklist.filter((i) => !i.required);

  const verifiedRequired = required.filter((i) => i.evidenceStatus === 'VERIFIED').length;
  const isFullyReady = evalResult.status === 'READY';

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar showBack backHref={`/case/${caseId}/documents`} />
      <div className="container-app" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '720px' }}>
        <StepIndicator currentStep={3} />

        {/* Score + Progress header */}
        <div className="card animate-fadeInUp" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <ReadinessScore score={caseData.readinessScore} size="md" />
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                  {t('checklist', lang)}
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: isFullyReady ? 'rgba(22,163,74,0.15)' : evalResult.status === 'NEEDS_ATTENTION' ? '#FEF3C7' : 'rgba(0,0,0,0.06)',
                  color: isFullyReady ? '#15803D' : evalResult.status === 'NEEDS_ATTENTION' ? '#B45309' : 'var(--color-text-secondary)',
                }}>
                  {isFullyReady
                    ? (lang === 'hi' ? 'अंतिम समीक्षा के लिए तैयार' : 'READY FOR FINAL REVIEW')
                    : evalResult.status === 'NEEDS_ATTENTION'
                    ? (lang === 'hi' ? 'मुद्दों पर ध्यान दें' : 'NEEDS ATTENTION')
                    : (lang === 'hi' ? 'तैयारी अधूरी' : 'NOT READY')}
                </span>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                {lang === 'hi'
                  ? `${verifiedRequired} / ${required.length} आवश्यक दस्तावेज़ों के प्रकार की जाँच पूरी`
                  : `${verifiedRequired} of ${required.length} required documents passed type checks`}
              </p>

              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                {lang === 'hi'
                  ? 'अधिकारसेतु दस्तावेज़ साक्ष्य और तैयारी की तत्परता की जाँच करता है। यह दस्तावेज़ों को प्रमाणित नहीं करता है।'
                  : 'AdhikarSetu checks document evidence and preparation readiness. It does not authenticate documents or determine final legal eligibility.'}
              </p>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${caseData.readinessScore}%`,
                    background: caseData.readinessScore >= 80 ? 'var(--color-success)' : caseData.readinessScore >= 40 ? 'var(--color-accent)' : 'var(--color-danger)',
                  }}
                />
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                ℹ️ {lang === 'hi' ? evalResult.explanationHi : evalResult.explanation}
              </p>
            </div>
          </div>

          {/* Active Blockers List if any */}
          {evalResult.blockers.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#92400E' }}>
                ⚠️ {lang === 'hi' ? 'पूर्ण तैयारी से पहले इन मुद्दों को हल करें:' : 'Issues blocking 100% readiness:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#78350F' }}>
                {(lang === 'hi' ? evalResult.blockersHi : evalResult.blockers).map((b, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success state */}
          {isFullyReady && (
            <div className="alert alert-success animate-fadeIn" style={{ marginTop: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>
                🎉 {lang === 'hi' ? 'सभी आवश्यक दस्तावेज़ों के प्रकार की जाँच पूरी! दावा पैकेट की अंतिम समीक्षा के लिए तैयार।' : 'All required documents passed type checks! Ready for final claim packet review.'}
              </p>
            </div>
          )}
        </div>

        {/* Required items */}
        <div className="animate-fadeInUp delay-100" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            {lang === 'hi' ? `● आवश्यक दस्तावेज़ (${required.length})` : `● Required Documents (${required.length})`}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {required.map((item) => (
              <ChecklistItemCard
                key={item.id}
                item={item}
                onToggle={toggleChecklistItem}
                onUploadClick={() => router.push(`/case/${caseId}/documents`)}
              />
            ))}
          </div>
        </div>

        {/* Optional items */}
        {optional.length > 0 && (
          <div className="animate-fadeInUp delay-200">
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              {lang === 'hi' ? `○ वैकल्पिक दस्तावेज़ (${optional.length})` : `○ Optional Documents (${optional.length})`}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {optional.map((item) => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  onToggle={toggleChecklistItem}
                  onUploadClick={() => router.push(`/case/${caseId}/documents`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={() => router.push(`/case/${caseId}/documents`)}
            className="btn btn-ghost"
            style={{ flex: '0 0 auto' }}
          >
            ← {lang === 'hi' ? 'दस्तावेज़' : 'Documents'}
          </button>
          <button
            onClick={() => router.push(`/case/${caseId}/summary`)}
            className={`btn ${isFullyReady ? 'btn-accent' : 'btn-primary'}`}
            style={{ flex: 1 }}
            id="go-to-summary-btn"
          >
            {lang === 'hi' ? 'सारांश और डाउनलोड' : 'Review & Download'} →
          </button>
        </div>
      </div>
    </div>
  );
}
