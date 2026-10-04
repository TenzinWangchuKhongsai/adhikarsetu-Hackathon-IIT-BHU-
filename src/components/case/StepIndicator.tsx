'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

interface Step {
  id: string;
  label: string;
  labelHi: string;
}

const STEPS: Step[] = [
  { id: 'problem', label: 'Problem', labelHi: 'समस्या' },
  { id: 'documents', label: 'Documents', labelHi: 'दस्तावेज़' },
  { id: 'checklist', label: 'Checklist', labelHi: 'चेकलिस्ट' },
  { id: 'summary', label: 'Summary', labelHi: 'सारांश' },
];

interface StepIndicatorProps {
  currentStep: number; // 1-indexed
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { lang } = useLanguage();

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}
      role="navigation"
      aria-label="Progress steps"
    >
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isPending = stepNum > currentStep;

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Connector line */}
            {index > 0 && (
              <div style={{
                width: '40px',
                height: '3px',
                borderRadius: '99px',
                background: isDone || isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                transition: 'background 0.3s ease',
                flexShrink: 0,
              }} aria-hidden="true" />
            )}

            {/* Step */}
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className={`step-dot ${isActive ? 'active' : isDone ? 'done' : 'pending'}`}
                aria-label={`${t('step', lang)} ${stepNum}: ${lang === 'hi' ? step.labelHi : step.label} — ${isDone ? 'completed' : isActive ? 'current' : 'upcoming'}`}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
              }}>
                {lang === 'hi' ? step.labelHi : step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
