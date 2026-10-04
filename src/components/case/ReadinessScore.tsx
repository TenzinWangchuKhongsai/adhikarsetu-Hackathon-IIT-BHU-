'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

interface ReadinessScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-accent)';
  return 'var(--color-danger)';
}

function getScoreLabel(score: number, lang: 'en' | 'hi'): string {
  if (score >= 80) return t('ready', lang);
  if (score >= 50) return t('almostReady', lang);
  return t('notReady', lang);
}

export default function ReadinessScore({ score, size = 'md' }: ReadinessScoreProps) {
  const { lang } = useLanguage();
  const color = getScoreColor(score);
  const label = getScoreLabel(score, lang);

  const dims = { sm: 80, md: 120, lg: 160 }[size];
  const strokeWidth = { sm: 7, md: 10, lg: 12 }[size];
  const fontSize = { sm: '1.2rem', md: '1.8rem', lg: '2.4rem' }[size];

  const radius = (dims - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div
        className="score-ring"
        style={{ width: dims, height: dims }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${t('readinessScore', lang)}: ${score}%`}
      >
        <svg width={dims} height={dims} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease' }}
          />
        </svg>
        {/* Score text */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize, color, lineHeight: 1 }}>{score}%</div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: size === 'sm' ? '12px' : '14px', color }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {t('readinessScore', lang)}
        </div>
      </div>
    </div>
  );
}
