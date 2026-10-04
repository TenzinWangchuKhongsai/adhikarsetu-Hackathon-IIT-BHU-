'use client';

import { Suspense, useState } from 'react';
import { ClipboardCheck, Landmark, Scale, UserRound } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { JourneyType } from '@/lib/types';
import { storage } from '@/lib/storage';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import Navbar from '@/components/shared/Navbar';
import StepIndicator from '@/components/case/StepIndicator';

const JOURNEY_CONFIG: Record<JourneyType, {
  title: string; titleHi: string;
  icon: typeof UserRound;
  showDeceased: boolean;
  showCompany: boolean;
  showFolio: boolean;
}> = {
  LEGAL_HEIR_IEPF: {
    title: 'Claim Shares of a Deceased Family Member',
    titleHi: 'मृत परिजन के शेयर का दावा करें',
    icon: UserRound,
    showDeceased: true, showCompany: true, showFolio: true,
  },
  IEPF_ONLY: {
    title: 'Reclaim Unclaimed Dividends / Shares from IEPF',
    titleHi: 'IEPF से लावारिस लाभांश / शेयर वापस लें',
    icon: Landmark,
    showDeceased: false, showCompany: true, showFolio: true,
  },
  SCORES_COMPLAINT: {
    title: 'File a SEBI SCORES Complaint',
    titleHi: 'SEBI SCORES शिकायत दर्ज करें',
    icon: Scale,
    showDeceased: false, showCompany: true, showFolio: false,
  },
  NOMINEE_REGISTRATION: {
    title: 'Add / Update Nominee',
    titleHi: 'नामांकित व्यक्ति जोड़ें / अपडेट करें',
    icon: ClipboardCheck,
    showDeceased: false, showCompany: false, showFolio: true,
  },
};

const schema = z.object({
  claimantName: z.string().min(2, 'Please enter your full name'),
  deceasedName: z.string().optional(),
  companyName: z.string().optional(),
  folioNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NewCaseInner() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const journey = (searchParams.get('journey') as JourneyType) || 'LEGAL_HEIR_IEPF';
  const config = JOURNEY_CONFIG[journey] || JOURNEY_CONFIG.LEGAL_HEIR_IEPF;
  const JourneyIcon = config.icon;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    const newCase = storage.createCase(
      journey,
      data.claimantName,
      data.deceasedName,
      data.companyName,
      data.folioNumber
    );
    router.push(`/case/${newCase.id}/documents`);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar showBack backHref="/" />
      <div id="main-content" role="main" tabIndex={-1} className="container-app" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '640px' }}>
        <StepIndicator currentStep={1} />

        {/* Journey header */}
        <div className="card animate-fadeInUp" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <div className="case-form-icon" aria-hidden="true"><JourneyIcon /></div>
          <h1 style={{ fontSize: 'clamp(1.65rem, 4vw, 2rem)', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
            {lang === 'hi' ? config.titleHi : config.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {lang === 'hi' ? 'शुरू करने के लिए बुनियादी जानकारी दर्ज करें।' : 'Enter basic details to start your case.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card animate-fadeInUp delay-100" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Claimant Name */}
            <div>
              <label className="label" htmlFor="claimantName">
                {t('yourName', lang)} <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="claimantName"
                className="input"
                type="text"
                placeholder={lang === 'hi' ? 'जैसे: राज कुमार शर्मा' : 'e.g. Raj Kumar Sharma'}
                autoComplete="name"
                {...register('claimantName')}
                aria-invalid={!!errors.claimantName}
                aria-describedby={errors.claimantName ? 'claimantName-error' : undefined}
              />
              {errors.claimantName && (
                <p id="claimantName-error" style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '4px' }} role="alert">
                  {errors.claimantName.message}
                </p>
              )}
            </div>

            {/* Deceased Name */}
            {config.showDeceased && (
              <div>
                <label className="label" htmlFor="deceasedName">
                  {t('deceasedName', lang)}
                </label>
                <input
                  id="deceasedName"
                  className="input"
                  type="text"
                  placeholder={lang === 'hi' ? 'मृत परिजन का पूरा नाम' : 'Full name of the deceased person'}
                  {...register('deceasedName')}
                />
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '5px' }}>
                  {lang === 'hi' ? 'जैसा शेयर प्रमाण पत्र पर है' : 'As it appears on share certificates'}
                </p>
              </div>
            )}

            {/* Company Name */}
            {config.showCompany && (
              <div>
                <label className="label" htmlFor="companyName">
                  {t('companyName', lang)}
                </label>
                <input
                  id="companyName"
                  className="input"
                  type="text"
                  placeholder={lang === 'hi' ? 'जैसे: टाटा मोटर्स लिमिटेड' : 'e.g. Tata Motors Limited'}
                  {...register('companyName')}
                />
              </div>
            )}

            {/* Folio Number */}
            {config.showFolio && (
              <div>
                <label className="label" htmlFor="folioNumber">
                  {t('folioNumber', lang)}
                </label>
                <input
                  id="folioNumber"
                  className="input"
                  type="text"
                  placeholder={lang === 'hi' ? 'जैसे: TM/104928' : 'e.g. TM/104928'}
                  {...register('folioNumber')}
                />
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '5px' }}>
                  {lang === 'hi' ? 'शेयर प्रमाण पत्र के पीछे मिलेगा' : 'Found on the back of your share certificate'}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
              id="start-case-btn"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  {lang === 'hi' ? 'शुरू हो रहा है...' : 'Starting...'}
                </>
              ) : (
                <>
                  {lang === 'hi' ? 'दस्तावेज़ अपलोड करने जाएं' : 'Continue to Upload Documents'} →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <NewCaseInner />
    </Suspense>
  );
}
