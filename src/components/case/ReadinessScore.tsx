'use client';

import { useLanguage } from '@/hooks/useLanguage';

interface ReadinessScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function ReadinessScore({ score, size = 'md' }: ReadinessScoreProps) {
  const { lang } = useLanguage();
  const color = getScoreColor(score);
  const dimensions = { sm: 84, md: 128, lg: 160 }[size];
  const strokeWidth = { sm: 7, md: 9, lg: 11 }[size];
  const fontSize = { sm: '1.25rem', md: '1.9rem', lg: '2.35rem' }[size];
  const radius = (dimensions - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="readiness-score">
      <div
        className="score-ring"
        style={{ width: dimensions, height: dimensions }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${lang === 'hi' ? 'तैयारी' : 'Preparation readiness'}: ${score}%`}
      >
        <svg
          width={dimensions}
          height={dimensions}
          style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="#eee6e2"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="score-arc"
          />
        </svg>
        <span className="score-value" style={{ fontSize, color }}>
          {score}%
        </span>
      </div>
      <div className="score-caption">
        <strong>{lang === 'hi' ? 'तैयारी की स्थिति' : 'Preparation readiness'}</strong>
        <span>{lang === 'hi' ? 'दस्तावेज़ जाँच के आधार पर' : 'Based on document checks'}</span>
      </div>
    </div>
  );
}
