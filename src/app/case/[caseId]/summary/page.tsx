'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCase } from '@/hooks/useCase';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import Navbar from '@/components/shared/Navbar';
import StepIndicator from '@/components/case/StepIndicator';
import ReadinessScore from '@/components/case/ReadinessScore';
import MismatchAlert from '@/components/documents/MismatchAlert';
import { evaluateCaseReadiness } from '@/lib/rules-engine';

const JOURNEY_LABELS = {
  LEGAL_HEIR_IEPF: { en: 'Legal Heir & IEPF Claim', hi: 'कानूनी वारिस और IEPF दावा' },
  IEPF_ONLY: { en: 'IEPF Unclaimed Dividend Claim', hi: 'IEPF लावारिस लाभांश दावा' },
  SCORES_COMPLAINT: { en: 'SEBI SCORES Complaint', hi: 'SEBI SCORES शिकायत' },
  NOMINEE_REGISTRATION: { en: 'Nominee Registration', hi: 'नामांकन पंजीकरण' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const caseId = params.caseId as string;
  const { caseData, loading } = useCase(caseId);
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const downloadPdf = (inline: boolean = false) => {
    if (!caseData) return;
    setGenerating(true);
    setPdfError(null);

    try {
      let targetName = '_blank';
      if (!inline) {
        let iframe = document.getElementById('pdf-download-iframe') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'pdf-download-iframe';
          iframe.name = 'pdf-download-iframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
        targetName = 'pdf-download-iframe';
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/api/download-pdf${inline ? '?inline=1' : ''}`;
      form.target = targetName;
      form.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'caseData';
      input.value = JSON.stringify(caseData);
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
        setGenerating(false);
      }, 1200);
    } catch (err) {
      console.error('[PDF Download Error]', err);
      const detail = err instanceof Error ? err.message : String(err);
      setPdfError(
        lang === 'hi'
          ? `PDF बनाने में त्रुटि: ${detail}`
          : `PDF generation failed: ${detail}`
      );
      setGenerating(false);
    }
  };

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

  const journeyLabel = JOURNEY_LABELS[caseData.journeyType];
  const requiredItems = caseData.checklist.filter((i) => i.required);
  const verifiedCount = requiredItems.filter((i) => i.evidenceStatus === 'VERIFIED').length;
  const invalidItems = requiredItems.filter((i) => i.evidenceStatus === 'INVALID');
  const reviewItems = requiredItems.filter((i) => i.evidenceStatus === 'NEEDS_REVIEW');
  const missingItems = requiredItems.filter((i) => i.evidenceStatus === 'MISSING');
  const isReadyToFile = evalResult.status === 'READY';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar showBack backHref={`/case/${caseId}/checklist`} />
      <div className="container-app" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '720px' }}>
        <StepIndicator currentStep={4} />

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }} className="animate-fadeInUp">
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
            {t('caseSummary', lang)}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            {lang === 'hi'
              ? 'दावा तैयारी रिपोर्ट और साक्ष्य स्थिति की समीक्षा करें।'
              : 'Review your claim preparation report and evidence status.'}
          </p>
        </div>

        {/* Truthful Case Status Hero */}
        <div className="card animate-fadeInUp delay-100" style={{
          padding: '28px 24px',
          marginBottom: '20px',
          background: isReadyToFile
            ? 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.02))'
            : evalResult.status === 'NEEDS_ATTENTION'
            ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))'
            : 'linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))',
          textAlign: 'center',
        }}>
          <ReadinessScore score={caseData.readinessScore} size="lg" />

          <div style={{ marginTop: '16px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '99px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: isReadyToFile ? 'rgba(22,163,74,0.15)' : evalResult.status === 'NEEDS_ATTENTION' ? '#FEF3C7' : '#FEE2E2',
              color: isReadyToFile ? '#15803D' : evalResult.status === 'NEEDS_ATTENTION' ? '#B45309' : '#B91C1C',
            }}>
              {isReadyToFile
                ? (lang === 'hi' ? '✓ अंतिम समीक्षा के लिए तैयार' : '✓ READY FOR FINAL REVIEW')
                : evalResult.status === 'NEEDS_ATTENTION'
                ? (lang === 'hi' ? '⚠️ ध्यान देने योग्य मुद्दे' : '⚠️ ACTION REQUIRED BEFORE SUBMISSION')
                : (lang === 'hi' ? '● साक्ष्य अपूर्ण — अभी तैयार नहीं' : '● INCOMPLETE EVIDENCE — NOT READY')}
            </span>

            <p style={{ fontSize: '14px', color: 'var(--color-text)', marginTop: '12px', fontWeight: 600 }}>
              {lang === 'hi' ? evalResult.explanationHi : evalResult.explanation}
            </p>

            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '620px', margin: '8px auto 0', lineHeight: 1.4 }}>
              ℹ️ {lang === 'hi'
                ? 'अधिकारसेतु दस्तावेज़ साक्ष्य और तैयारी की तत्परता की जाँच करता है। यह दस्तावेज़ों को प्रमाणित नहीं करता है और न ही अंतिम कानूनी पात्रता निर्धारित करता है।'
                : 'AdhikarSetu checks document evidence and preparation readiness. It does not authenticate documents or determine final legal eligibility.'}
            </p>
          </div>
        </div>

        {/* Active Blockers Notice if any */}
        {evalResult.blockers.length > 0 && (
          <div className="card animate-fadeInUp delay-150" style={{
            padding: '18px',
            marginBottom: '16px',
            background: '#FFFBEB',
            border: '1.5px solid #F59E0B',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }} aria-hidden="true">⚠️</span>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#92400E' }}>
                  {lang === 'hi' ? 'सक्रिय रुकावटें (दावा जमा करने से पहले ठीक करें):' : 'Active Blockers (Must resolve before submission):'}
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#78350F' }}>
                  {(lang === 'hi' ? evalResult.blockersHi : evalResult.blockers).map((b, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Case details */}
        <div className="card animate-fadeInUp delay-200" style={{ padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            {lang === 'hi' ? 'मामला विवरण' : 'Case Details'}
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              { label: lang === 'hi' ? 'मामला ID' : 'Case ID', value: caseData.id, mono: true },
              { label: lang === 'hi' ? 'यात्रा प्रकार' : 'Journey Type', value: lang === 'hi' ? journeyLabel?.hi : journeyLabel?.en },
              { label: lang === 'hi' ? 'दावेदार' : 'Claimant', value: caseData.claimantName },
              caseData.deceasedName && { label: lang === 'hi' ? 'मृतक' : 'Deceased Holder', value: caseData.deceasedName },
              caseData.companyName && { label: lang === 'hi' ? 'कंपनी' : 'Company', value: caseData.companyName },
              caseData.folioNumber && { label: lang === 'hi' ? 'फोलियो / DP ID' : 'Folio / DP ID', value: caseData.folioNumber },
              { label: lang === 'hi' ? 'बनाया गया' : 'Created', value: formatDate(caseData.createdAt) },
            ].filter(Boolean).map((row) => (
              row && (
                <div key={row.label} style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600, minWidth: '130px', flexShrink: 0 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', fontFamily: row.mono ? 'monospace' : 'inherit' }}>
                    {row.value}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Evidence Status Table */}
        <div className="card animate-fadeInUp delay-250" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              {lang === 'hi' ? 'दस्तावेज़ साक्ष्य स्थिति' : 'Document Evidence Status'}
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {verifiedCount} / {requiredItems.length} {lang === 'hi' ? 'दस्तावेज़ प्रकार सही' : 'Type Checks Passed'}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
            🛡️ {lang === 'hi'
              ? 'दस्तावेज़ जाँच निकाले गए पाठ और नियतात्मक नियमों पर आधारित हैं। वे दस्तावेज़ों को प्रमाणित नहीं करते हैं और न ही दावे की पात्रता की गारंटी देते हैं।'
              : 'Document checks are based on extracted text and deterministic rules. They do not authenticate documents or guarantee claim eligibility.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {caseData.checklist.map((item) => {
              const isVer = item.evidenceStatus === 'VERIFIED';
              const isInv = item.evidenceStatus === 'INVALID';
              const isRev = item.evidenceStatus === 'NEEDS_REVIEW';
              const isUC = item.evidenceStatus === 'USER_CONFIRMED';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isVer
                      ? 'rgba(22,163,74,0.06)'
                      : isInv
                      ? 'rgba(220,38,38,0.06)'
                      : isRev
                      ? 'rgba(245,158,11,0.08)'
                      : isUC
                      ? 'rgba(79,70,229,0.05)'
                      : 'var(--color-muted)',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {lang === 'hi' ? item.labelHi : item.label}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {isVer
                        ? (lang === 'hi' ? 'दस्तावेज़ प्रकार जाँच सफल (पाठ संकेत मिले)' : 'Document type check passed via text signals')
                        : isInv
                        ? (lang === 'hi' ? 'अस्वीकृत — गलत या अस्पष्ट दस्तावेज़' : 'Rejected — wrong or unclear document')
                        : isRev
                        ? (lang === 'hi' ? 'समीक्षा आवश्यक — आंशिक संकेत मिले' : 'Needs review — partial signals detected')
                        : isUC
                        ? (lang === 'hi' ? 'उपयोगकर्ता द्वारा पुष्टीकृत — कोई दस्तावेज़ प्रमाण नहीं' : 'User confirmed — no document proof')
                        : (lang === 'hi' ? 'कोई दस्तावेज़ अपलोड नहीं हुआ' : 'Missing — no document uploaded')}
                    </p>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: isVer ? 'rgba(22,163,74,0.15)' : isInv ? '#FEE2E2' : isRev ? '#FEF3C7' : isUC ? '#E0E7FF' : 'rgba(0,0,0,0.08)',
                    color: isVer ? '#15803D' : isInv ? '#B91C1C' : isRev ? '#B45309' : isUC ? '#3730A3' : 'var(--color-text-secondary)',
                  }}>
                    {isVer
                      ? (lang === 'hi' ? '✓ दस्तावेज़ प्रकार सही' : '✓ DOCUMENT CHECK PASSED')
                      : isInv
                      ? (lang === 'hi' ? '✗ अस्वीकृत' : '✗ REJECTED')
                      : isRev
                      ? (lang === 'hi' ? '⚠️ समीक्षा आवश्यक' : '⚠️ NEEDS REVIEW')
                      : isUC
                      ? (lang === 'hi' ? 'पुष्टीकृत (प्रमाण नहीं)' : 'USER CONFIRMED — NO DOCUMENT PROOF')
                      : (lang === 'hi' ? '● अनुपलब्ध' : '● MISSING')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Name mismatches */}
        {caseData.nameMismatches.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <MismatchAlert mismatches={caseData.nameMismatches} />
          </div>
        )}

        {/* Action Plan */}
        <div className="card animate-fadeInUp delay-280" style={{ padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            {lang === 'hi' ? 'आपकी कार्य योजना (Next Steps)' : 'Action Plan'}
          </h2>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {invalidItems.length > 0 && (
              <li>
                <strong style={{ color: 'var(--color-danger)' }}>
                  {lang === 'hi' ? 'अस्वीकृत दस्तावेज़ बदलें:' : 'Replace Rejected Documents:'}
                </strong>{' '}
                {lang === 'hi'
                  ? 'अमान्य दस्तावेज़ों की जगह स्पष्ट मूल या प्रमाणित प्रति अपलोड करें।'
                  : 'Upload an authentic scan of the certificate to replace rejected files.'}
              </li>
            )}
            {caseData.nameMismatches.length > 0 && (
              <li>
                <strong style={{ color: '#B45309' }}>
                  {lang === 'hi' ? 'नोटरीकृत शपथ पत्र प्राप्त करें:' : 'Obtain Notarized Same-Person Affidavit:'}
                </strong>{' '}
                {lang === 'hi'
                  ? 'दस्तावेज़ों में नाम के अंतर को सत्यापित करने के लिए ₹100-500 के स्टांप पेपर पर शपथ पत्र बनवाएं।'
                  : 'Visit an advocate or notary to draft a Same-Person Affidavit confirming both names refer to the same individual.'}
              </li>
            )}
            {missingItems.length > 0 && (
              <li>
                <strong>
                  {lang === 'hi' ? 'बाकी दस्तावेज़ एकत्र करें:' : 'Gather Missing Documents:'}
                </strong>{' '}
                {missingItems.map((m) => (lang === 'hi' ? m.labelHi : m.label)).join(', ')}.
              </li>
            )}
            <li>
              <strong>
                {lang === 'hi' ? 'आधिकारिक प्रक्रिया से जमा करें:' : 'Official Submission Channel:'}
              </strong>{' '}
              {caseData.journeyType === 'LEGAL_HEIR_IEPF'
                ? (lang === 'hi' ? 'कंपनी के RTA को पंजीकृत डाक द्वारा भेजें और IEPF-5 पोर्टल पर दाखिल करें।' : 'Send physical copies to company RTA by Registered Post and file Form IEPF-5 on iepf.gov.in.')
                : (lang === 'hi' ? 'आधिकारिक पोर्टल के माध्यम से प्रक्रिया पूरी करें।' : 'Complete submission through the designated official government or DP portal.')}
            </li>
          </ol>
        </div>

        {/* PDF Download CTA */}
        <div className="card animate-fadeInUp delay-300" style={{ padding: '28px', textAlign: 'center', background: 'linear-gradient(135deg, #0F2D5C, #1C4FA1)', border: 'none' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }} aria-hidden="true">📄</div>
          <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
            {lang === 'hi' ? 'अधिकारसेतु दावा तैयारी पैकेट' : 'AdhikarSetu Claim Preparation Packet'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginBottom: '22px', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto 22px' }}>
            {lang === 'hi'
              ? 'दस्तावेज़ जाँच स्थिति, नाम विसंगति विश्लेषण, कार्य योजना और मसौदा शपथ पत्र सहित संपूर्ण PDF पैकेट।'
              : 'Complete claim preparation packet containing document check audit tables, name mismatch analysis, prioritized action plan, and draft affidavit.'}
          </p>

          {pdfError && (
            <p style={{ color: '#FCA5A5', fontSize: '13px', marginBottom: '12px' }} role="alert">{pdfError}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
            <button
              onClick={() => downloadPdf(false)}
              disabled={generating}
              className="btn btn-accent btn-lg"
              style={{ width: '100%' }}
              id="download-pdf-btn"
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  {lang === 'hi' ? 'PDF तैयार हो रहा है...' : 'Preparing PDF...'}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {lang === 'hi' ? 'दावा पैकेट डाउनलोड करें (.pdf)' : 'Download Claim Packet (.pdf)'}
                </>
              )}
            </button>

            <button
              onClick={() => downloadPdf(true)}
              disabled={generating}
              className="btn"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              id="preview-pdf-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {lang === 'hi' ? 'PDF खोलें / प्रिंट करें (New Tab)' : 'Preview & Print PDF (New Tab)'}
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '14px' }}>
            {lang === 'hi'
              ? 'यह दावा तैयारी रिपोर्ट है — आधिकारिक सरकारी फॉर्म आधिकारिक पोर्टल से ही भरें।'
              : 'This is a claim preparation report — submit official forms via authorized government/RTA portals.'}
          </p>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => router.push(`/case/${caseId}/checklist`)}
            className="btn btn-ghost"
            style={{ flex: '0 0 auto' }}
          >
            ← {lang === 'hi' ? 'चेकलिस्ट' : 'Checklist'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            {lang === 'hi' ? 'होम पर जाएं' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
