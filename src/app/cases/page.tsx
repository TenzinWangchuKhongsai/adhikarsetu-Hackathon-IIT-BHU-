'use client';

import { useState } from 'react';
import { useAllCases } from '@/hooks/useCase';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import { Case } from '@/lib/types';

const JOURNEY_ICONS: Record<string, string> = {
  LEGAL_HEIR_IEPF: '👨‍👩‍👧',
  IEPF_ONLY: '🏦',
  SCORES_COMPLAINT: '⚖️',
  NOMINEE_REGISTRATION: '📋',
};

const JOURNEY_LABELS: Record<string, { en: string; hi: string }> = {
  LEGAL_HEIR_IEPF: { en: 'Legal Heir & IEPF', hi: 'कानूनी वारिस और IEPF' },
  IEPF_ONLY: { en: 'IEPF Claim', hi: 'IEPF दावा' },
  SCORES_COMPLAINT: { en: 'SCORES Complaint', hi: 'SCORES शिकायत' },
  NOMINEE_REGISTRATION: { en: 'Nominee Registration', hi: 'नामांकन' },
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'var(--color-text-secondary)',
  DOCUMENTS_UPLOADED: 'var(--color-accent)',
  CHECKLIST_COMPLETE: 'var(--color-primary)',
  NEEDS_ATTENTION: '#B45309',
  NOT_READY: 'var(--color-danger)',
  READY: 'var(--color-success)',
};

function CaseCard({ c, lang, onDelete }: { c: Case; lang: 'en' | 'hi'; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const icon = JOURNEY_ICONS[c.journeyType] ?? '📁';
  const journeyLabel = JOURNEY_LABELS[c.journeyType];
  const statusColor = STATUS_COLORS[c.status] ?? 'var(--color-text-secondary)';
  const statusLabel = lang === 'hi'
    ? ({
        DRAFT: 'मसौदा',
        DOCUMENTS_UPLOADED: 'दस्तावेज़ अपलोड',
        CHECKLIST_COMPLETE: 'चेकलिस्ट पूर्ण',
        NEEDS_ATTENTION: 'ध्यान दें',
        NOT_READY: 'तैयारी अधूरी',
        READY: 'तैयार',
      }[c.status] ?? c.status)
    : ({
        DRAFT: 'Draft',
        DOCUMENTS_UPLOADED: 'Docs Uploaded',
        CHECKLIST_COMPLETE: 'Checklist Done',
        NEEDS_ATTENTION: 'Needs Attention',
        NOT_READY: 'Not Ready',
        READY: 'Ready for Review',
      }[c.status] ?? c.status);


  return (
    <div className="card animate-fadeInUp" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '28px', flexShrink: 0, width: 46, height: 46, background: 'var(--color-muted)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 2px' }}>
                {c.claimantName}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {lang === 'hi' ? journeyLabel?.hi : journeyLabel?.en}
                {c.companyName && ` · ${c.companyName}`}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor }}>
                ● {statusLabel}
              </span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: c.readinessScore >= 80 ? 'var(--color-success)' : c.readinessScore >= 40 ? 'var(--color-accent)' : 'var(--color-danger)', lineHeight: 1.2 }}>
                {c.readinessScore}%
              </div>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <div className="progress-track" style={{ height: '6px' }}>
              <div className="progress-fill" style={{ width: `${c.readinessScore}%` }} />
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '6px 0 0', fontFamily: 'monospace' }}>
            {c.id} · {new Date(c.updatedAt).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <Link href={`/case/${c.id}/documents`} className="btn btn-outline btn-sm" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
          {lang === 'hi' ? 'दस्तावेज़' : 'Documents'}
        </Link>
        <Link href={`/case/${c.id}/checklist`} className="btn btn-outline btn-sm" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
          {lang === 'hi' ? 'चेकलिस्ट' : 'Checklist'}
        </Link>
        <Link href={`/case/${c.id}/summary`} className="btn btn-primary btn-sm" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
          {lang === 'hi' ? 'सारांश' : 'Summary'}
        </Link>
        {confirming ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(220,38,38,0.08)',
            padding: '2px 8px',
            borderRadius: '8px',
            border: '1.5px solid rgba(220,38,38,0.3)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-danger)' }}>
              {lang === 'hi' ? 'हटाएं?' : 'Delete?'}
            </span>
            <button
              type="button"
              onClick={() => {
                onDelete(c.id);
                setConfirming(false);
              }}
              className="btn btn-danger btn-sm"
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, minHeight: '28px' }}
              id={`confirm-delete-${c.id}-btn`}
            >
              {lang === 'hi' ? 'हाँ' : 'Yes'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '3px 8px', fontSize: '11px', minHeight: '28px' }}
              id={`cancel-delete-${c.id}-btn`}
            >
              {lang === 'hi' ? 'रद्द' : 'No'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '8px', minWidth: '40px', color: 'var(--color-danger)', borderColor: 'transparent' }}
            aria-label={`Delete case ${c.claimantName}`}
            title={lang === 'hi' ? 'मामला हटाएं' : 'Delete case'}
            id={`delete-case-${c.id}-btn`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CasesPage() {
  const { lang } = useLanguage();
  const { cases, loading, deleteCase } = useAllCases();

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar showBack backHref="/" />
      <div className="container-app" style={{ paddingTop: '32px', paddingBottom: '60px', maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
              {t('myCases', lang)}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {cases.length > 0
                ? (lang === 'hi' ? `${cases.length} सक्रिय मामले` : `${cases.length} active case${cases.length > 1 ? 's' : ''}`)
                : (lang === 'hi' ? 'कोई मामला नहीं' : 'No cases yet')}
            </p>
          </div>
          <Link href="/" className="btn btn-primary btn-sm" id="new-case-from-cases-btn">
            + {t('newCase', lang)}
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }} aria-hidden="true">📭</div>
            <h2 style={{ fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              {t('noCases', lang)}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              {lang === 'hi' ? 'होम पर जाएं और अपनी समस्या चुनें।' : 'Go to home and select your problem to start.'}
            </p>
            <Link href="/" className="btn btn-primary">
              {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} lang={lang} onDelete={deleteCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
