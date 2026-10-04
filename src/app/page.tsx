'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import Navbar from '@/components/shared/Navbar';
import { ProblemOption } from '@/lib/types';

const PROBLEMS: ProblemOption[] = [
  {
    id: 'LEGAL_HEIR_IEPF',
    title: 'Claim shares or money of a deceased family member',
    titleHi: 'मृत परिजन के शेयर या पैसे का दावा करें',
    description: 'A parent, spouse, or relative has passed away and left behind shares, FDs, or unclaimed dividends in their name.',
    descriptionHi: 'माता-पिता, जीवनसाथी या रिश्तेदार के निधन के बाद उनके नाम पर शेयर, FD, या लावारिस लाभांश छूट गया है।',
    icon: '👨‍👩‍👧',
    examples: ['Shares in physical form or demat', 'Unclaimed dividends', 'Fixed deposits'],
    estimatedTime: '45–90 days',
  },
  {
    id: 'IEPF_ONLY',
    title: 'Reclaim unclaimed dividends or shares from IEPF',
    titleHi: 'IEPF से अपना लावारिस लाभांश या शेयर वापस लें',
    description: 'Dividends not collected for 7+ years have been transferred to the IEPF government fund. You can still reclaim them.',
    descriptionHi: '7+ वर्षों से न लिया गया लाभांश सरकारी IEPF कोष में चला गया है। आप अभी भी इसे वापस पा सकते हैं।',
    icon: '🏦',
    examples: ['Old dividend cheques', 'Shares transferred to IEPF', 'Unclaimed bonus shares'],
    estimatedTime: '60–120 days',
  },
  {
    id: 'SCORES_COMPLAINT',
    title: 'File a complaint against a broker or company',
    titleHi: 'दलाल या कंपनी के खिलाफ शिकायत दर्ज करें',
    description: 'A broker, company, or mutual fund has not resolved your issue. File a formal complaint with SEBI SCORES.',
    descriptionHi: 'किसी दलाल, कंपनी, या म्यूचुअल फंड ने आपकी समस्या हल नहीं की। SEBI SCORES में औपचारिक शिकायत दर्ज करें।',
    icon: '⚖️',
    examples: ['Shares not transferred', 'Dividend not received', 'Broker misbehaviour'],
    estimatedTime: '30–60 days',
  },
  {
    id: 'NOMINEE_REGISTRATION',
    title: 'Add or update a nominee to your shares',
    titleHi: 'अपने शेयरों में नामांकित व्यक्ति जोड़ें या बदलें',
    description: 'Protect your family by registering or updating a nominee for your demat account or physical shares.',
    descriptionHi: 'अपने डीमैट खाते या भौतिक शेयरों के लिए नामांकन करके परिवार को सुरक्षित करें।',
    icon: '📋',
    examples: ['Demat account nominee', 'Physical share nominee', 'Joint holder nomination'],
    estimatedTime: '7–14 days',
  },
];

export default function HomePage() {
  const { lang, toggle } = useLanguage();

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Hero Section */}
      <div className="hero-gradient" style={{ padding: '60px 20px 80px' }}>
        <div className="container-app" style={{ textAlign: 'center' }}>
          {/* Language toggle prominent on hero */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <button
              onClick={toggle}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '99px',
                padding: '8px 18px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
              aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              <span>{lang === 'en' ? '🇮🇳 हिंदी में पढ़ें' : '🇬🇧 Read in English'}</span>
            </button>
          </div>

          <div className="animate-fadeInUp">
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', marginBottom: '16px', fontWeight: 900, lineHeight: 1.15 }}>
              {t('landingHeadline', lang)}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              {t('landingSubtitle', lang)}
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {[
                { icon: '🔒', text: lang === 'hi' ? 'डेटा आपके फ़ोन पर' : 'Data stays on your device' },
                { icon: '📋', text: lang === 'hi' ? 'कोई पंजीकरण नहीं' : 'No registration needed' },
                { icon: '🆓', text: lang === 'hi' ? 'बिल्कुल मुफ़्त' : 'Completely free' },
              ].map((badge) => (
                <span
                  key={badge.text}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '99px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    color: '#fff',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {badge.icon} {badge.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Cards */}
      <div className="container-app" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {lang === 'hi' ? 'अपनी समस्या चुनें' : 'Select your situation'}
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          {PROBLEMS.map((problem, index) => (
            <Link
              key={problem.id}
              href={`/case/new?journey=${problem.id}`}
              style={{ textDecoration: 'none' }}
              id={`problem-${problem.id.toLowerCase()}`}
            >
              <div
                className={`card card-interactive animate-fadeInUp delay-${(index + 1) * 100}`}
                style={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{
                    fontSize: '36px',
                    lineHeight: 1,
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    background: 'var(--color-muted)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }} aria-hidden="true">
                    {problem.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '8px', lineHeight: 1.3 }}>
                      {lang === 'hi' ? problem.titleHi : problem.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                      {lang === 'hi' ? problem.descriptionHi : problem.description}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {lang === 'hi' ? 'उदाहरण:' : 'Examples:'}
                      </span>
                      {problem.examples.map((ex) => (
                        <span key={ex} className="badge badge-primary" style={{ fontSize: '11px' }}>
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ flexShrink: 0, color: 'var(--color-primary)', opacity: 0.5, marginTop: 4 }} aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Estimated time footer */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    ⏱ {lang === 'hi' ? 'अनुमानित समय' : 'Estimated time'}: <strong>{problem.estimatedTime}</strong>
                  </span>
                  <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
                    {t('startJourney', lang)} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* My Cases CTA */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/cases" className="btn btn-outline" id="view-cases-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            {t('myCases', lang)}
          </Link>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '48px', padding: '20px', background: 'var(--color-muted)', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.7 }}>
            ⚠ <strong>{lang === 'hi' ? 'महत्वपूर्ण:' : 'Important:'}</strong>{' '}
            {lang === 'hi'
              ? 'AdhikarSetu एक प्रोटोटाइप सहायक है। यह कानूनी सलाह नहीं है। दाखिल करने से पहले किसी योग्य पेशेवर से सत्यापित करें।'
              : 'AdhikarSetu is a prototype assistant tool. It does not provide legal advice. Please verify all requirements with a qualified professional before filing.'}
          </p>
        </div>
      </div>
    </div>
  );
}
