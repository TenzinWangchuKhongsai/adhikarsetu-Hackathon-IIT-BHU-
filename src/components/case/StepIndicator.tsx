'use client';

import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const STEPS = [
  { id: 'case', label: 'Case', labelHi: 'मामला' },
  { id: 'documents', label: 'Documents', labelHi: 'दस्तावेज़' },
  { id: 'checklist', label: 'Checklist', labelHi: 'चेकलिस्ट' },
  { id: 'review', label: 'Review', labelHi: 'समीक्षा' },
];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { lang } = useLanguage();
  const currentLabel = lang === 'hi' ? STEPS[currentStep - 1]?.labelHi : STEPS[currentStep - 1]?.label;

  return (
    <nav className="stepper" aria-label={lang === 'hi' ? 'मामला तैयार करने के चरण' : 'Case preparation steps'}>
      <ol className="stepper-list">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          return (
            <li
              key={step.id}
              className={`stepper-item${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="stepper-marker" aria-hidden="true">
                {isDone ? <Check /> : `0${stepNumber}`}
              </span>
              <span className="stepper-label">{lang === 'hi' ? step.labelHi : step.label}</span>
              {index < STEPS.length - 1 && <span className="stepper-connector" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      <div className="stepper-mobile" aria-live="polite">
        <span>{lang === 'hi' ? `चरण ${currentStep} / ${STEPS.length}` : `Step ${currentStep} of ${STEPS.length}`}</span>
        <strong>{currentLabel}</strong>
        <span className="stepper-mobile-track" aria-hidden="true">
          <span style={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
        </span>
      </div>
    </nav>
  );
}
