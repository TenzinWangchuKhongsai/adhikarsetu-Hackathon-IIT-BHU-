'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Landmark, Menu, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

interface NavbarProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
}

export default function Navbar({ showBack, backHref = '/', title }: NavbarProps) {
  const { lang, toggle } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isHindi = lang === 'hi';

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        {isHindi ? 'मुख्य सामग्री पर जाएँ' : 'Skip to main content'}
      </a>
      <header className="site-header">
        <div className="nav-inner">
          <div className="nav-brand-group">
            {showBack && (
              <Link href={backHref} className="nav-back" aria-label={isHindi ? 'वापस जाएँ' : 'Go back'}>
                <ArrowLeft aria-hidden="true" />
              </Link>
            )}
            <Link href="/" className="brand" aria-label="AdhikarSetu home">
              <span className="brand-mark">
                <Landmark aria-hidden="true" />
              </span>
              <span className="brand-type">
                <span className="brand-name">{title || 'AdhikarSetu'}</span>
                <span className="brand-tagline">{isHindi ? 'उलझन से दावे तक' : 'From confusion to claim'}</span>
              </span>
            </Link>
          </div>

          <nav
            id="site-navigation"
            className={`primary-nav${menuOpen ? ' is-open' : ''}`}
            aria-label={isHindi ? 'मुख्य नेविगेशन' : 'Main navigation'}
          >
            <Link href="/cases" onClick={() => setMenuOpen(false)}>
              {t('myCases', lang)}
            </Link>
            <Link href="/#how-it-works" onClick={() => setMenuOpen(false)}>
              {isHindi ? 'कैसे काम करता है' : 'How it works'}
            </Link>
            <Link href="/#help" onClick={() => setMenuOpen(false)}>
              {isHindi ? 'जानकारी' : 'Help'}
            </Link>
            <div className="nav-mobile-actions">
              <button
                type="button"
                className="language-button"
                onClick={toggle}
                aria-label={isHindi ? 'Switch to English' : 'Switch to Hindi'}
              >
                {isHindi ? 'EN' : 'हिंदी'}
              </button>
              <Link href="/case/new" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                {isHindi ? 'नया मामला' : 'New case'} <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </nav>

          <div className={`nav-actions${menuOpen ? ' menu-open' : ''}`}>
            <button
              type="button"
              className="language-button"
              onClick={toggle}
              aria-label={isHindi ? 'Switch to English' : 'Switch to Hindi'}
            >
              {isHindi ? 'EN' : 'हिंदी'}
            </button>
            <Link href="/case/new" className="btn btn-primary nav-cta">
              {isHindi ? 'नया मामला' : 'New case'} <ArrowRight aria-hidden="true" />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className="nav-menu-button"
              aria-label={menuOpen ? (isHindi ? 'मेनू बंद करें' : 'Close menu') : (isHindi ? 'मेनू खोलें' : 'Open menu')}
              aria-expanded={menuOpen}
              aria-controls="site-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
