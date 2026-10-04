'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

interface NavbarProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
}

export default function Navbar({ showBack, backHref = '/', title }: NavbarProps) {
  const { lang, toggle } = useLanguage();

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container-app">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          {/* Left: back or brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {showBack && (
              <Link
                href={backHref}
                className="btn btn-ghost btn-sm"
                aria-label={t('back', lang)}
                style={{ padding: '8px 14px', minHeight: '40px', gap: '6px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span style={{ display: 'none' }}>{t('back', lang)}</span>
              </Link>
            )}
            <Link
              href="/"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
              aria-label="AdhikarSetu home"
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1C4FA1, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--color-primary-dark)', lineHeight: 1.1 }}>
                  {title || t('appName', lang)}
                </div>
                {!title && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {lang === 'hi' ? 'आपके अधिकारों का सेतु' : 'Your Rights Bridge'}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Right: language toggle + cases */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/cases"
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px 14px', minHeight: '40px', fontSize: '14px' }}
              aria-label={t('myCases', lang)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              {t('myCases', lang)}
            </Link>

            <button
              onClick={toggle}
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px 14px', minHeight: '40px', fontSize: '14px', fontWeight: 700 }}
              aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            >
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
