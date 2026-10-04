'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Landmark,
  Scale,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import Navbar from '@/components/shared/Navbar';
import { ProblemOption, JourneyType } from '@/lib/types';

const JOURNEY_ICONS: Record<JourneyType, typeof Landmark> = {
  LEGAL_HEIR_IEPF: UserRound,
  IEPF_ONLY: Landmark,
  SCORES_COMPLAINT: Scale,
  NOMINEE_REGISTRATION: ClipboardCheck,
};

const PROBLEMS: ProblemOption[] = [
  {
    id: 'LEGAL_HEIR_IEPF',
    title: 'Claim shares or money of a deceased family member',
    titleHi: 'मृत परिजन के शेयर या पैसे का दावा करें',
    description: 'Prepare a claim for shares, fixed deposits, or dividends left in a family member’s name.',
    descriptionHi: 'परिजन के नाम पर छूटे शेयर, FD या लाभांश के दावे की तैयारी करें।',
    icon: 'family',
    examples: ['Shares', 'Unclaimed dividends', 'Fixed deposits'],
    estimatedTime: '45–90 days',
  },
  {
    id: 'IEPF_ONLY',
    title: 'Reclaim unclaimed dividends or shares from IEPF',
    titleHi: 'IEPF से अपना लावारिस लाभांश या शेयर वापस लें',
    description: 'Prepare to reclaim dividends or shares transferred to the Investor Education and Protection Fund.',
    descriptionHi: 'निवेशक शिक्षा और संरक्षण कोष में भेजे गए लाभांश या शेयर वापस पाने की तैयारी करें।',
    icon: 'fund',
    examples: ['Old dividends', 'IEPF shares', 'Bonus shares'],
    estimatedTime: '60–120 days',
  },
  {
    id: 'SCORES_COMPLAINT',
    title: 'Prepare a complaint about a broker or company',
    titleHi: 'दलाल या कंपनी के खिलाफ शिकायत तैयार करें',
    description: 'Organize your evidence before filing a complaint through SEBI SCORES.',
    descriptionHi: 'SEBI SCORES में शिकायत दर्ज करने से पहले अपने दस्तावेज़ व्यवस्थित करें।',
    icon: 'scales',
    examples: ['Shares not transferred', 'Dividend not received', 'Broker issue'],
    estimatedTime: '30–60 days',
  },
  {
    id: 'NOMINEE_REGISTRATION',
    title: 'Add or update a nominee for your shares',
    titleHi: 'अपने शेयरों में नामांकित व्यक्ति जोड़ें या बदलें',
    description: 'Prepare the documents needed to add or update a nominee for an account or shares.',
    descriptionHi: 'खाते या शेयरों के लिए नामांकित व्यक्ति जोड़ने या बदलने के दस्तावेज़ तैयार करें।',
    icon: 'nominee',
    examples: ['Demat account', 'Physical shares', 'Joint holders'],
    estimatedTime: '7–14 days',
  },
];

const FLOW_STEPS = [
  {
    number: '01',
    icon: FileText,
    title: 'Add your documents',
    titleHi: 'अपने दस्तावेज़ जोड़ें',
    note: 'Upload a photo or scan from your device.',
    noteHi: 'अपने डिवाइस से फ़ोटो या स्कैन अपलोड करें।',
  },
  {
    number: '02',
    icon: FileCheck2,
    title: 'Check what’s there',
    titleHi: 'दस्तावेज़ जाँचें',
    note: 'Text is read and checked against the document type.',
    noteHi: 'टेक्स्ट पढ़कर दस्तावेज़ के प्रकार से मिलाया जाता है।',
  },
  {
    number: '03',
    icon: Scale,
    title: 'Resolve differences',
    titleHi: 'अंतर दूर करें',
    note: 'See missing evidence and name differences clearly.',
    noteHi: 'छूटे हुए प्रमाण और नाम के अंतर स्पष्ट देखें।',
  },
  {
    number: '04',
    icon: ClipboardCheck,
    title: 'Know your next step',
    titleHi: 'अपना अगला कदम जानें',
    note: 'Review an action plan and prepare a claim packet.',
    noteHi: 'कार्य योजना देखें और दावा तैयारी पैकेट बनाएँ।',
  },
];

export default function HomePage() {
  const { lang } = useLanguage();
  const isHindi = lang === 'hi';

  return (
    <div className="site-shell">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy animate-fadeInUp">
              <p className="eyebrow">
                <span className="eyebrow-mark" aria-hidden="true" />
                {isHindi ? 'निवेशक अधिकार  •  दावा तैयारी' : 'INVESTOR RIGHTS  •  CLAIM PREPARATION'}
              </p>
              <h1 id="hero-title">
                {isHindi ? 'जटिल दावे को एक स्पष्ट अगले कदम में बदलें।' : 'Turn a complicated claim into a clear next step.'}
              </h1>
              <p className="hero-lede">
                {isHindi
                  ? 'AdhikarSetu दस्तावेज़ जाँचकर, छूटे हुए प्रमाण और असंगतियों को सामने लाकर निवेशक दावों की तैयारी में आपकी मदद करता है।'
                  : 'AdhikarSetu helps you prepare investor claims by checking your documents, finding missing evidence, and spotting inconsistencies before submission.'}
              </p>
              <div className="hero-actions">
                <Link href="/case/new" className="btn btn-primary btn-lg" id="start-case-hero">
                  {isHindi ? 'मामला शुरू करें' : 'Start a Case'} <ArrowRight aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="btn btn-text btn-lg">
                  {isHindi ? 'कैसे काम करता है' : 'See How It Works'} <ArrowDown aria-hidden="true" />
                </a>
              </div>
              <p className="hero-trust">
                <ShieldCheck aria-hidden="true" />
                {isHindi
                  ? 'आपका मामला इस ब्राउज़र में सहेजा जाता है। दस्तावेज़ों की प्रामाणिकता या कानूनी पात्रता तय नहीं की जाती।'
                  : 'Your case is saved in this browser. Documents are not authenticated and legal eligibility is not determined.'}
              </p>
            </div>

            <div className="flow-visual" aria-label={isHindi ? 'दस्तावेज़ से अगले कदम तक की प्रक्रिया' : 'From document to your next step'}>
              <div className="flow-visual-header">
                <div>
                  <p className="flow-overline">{isHindi ? 'आपकी तैयारी की प्रक्रिया' : 'YOUR PREPARATION FLOW'}</p>
                  <h2>{isHindi ? 'एक समय में एक कदम' : 'One step at a time'}</h2>
                </div>
                <span className="flow-status">
                  <span />
                  {isHindi ? 'निर्देशित प्रक्रिया' : 'Guided process'}
                </span>
              </div>
              <ol className="flow-steps">
                {FLOW_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li className="flow-step" key={step.number}>
                      <span className="flow-step-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <div className="flow-step-copy">
                        <span className="flow-step-number">{step.number}</span>
                        <h3>{isHindi ? step.titleHi : step.title}</h3>
                        <p>{isHindi ? step.noteHi : step.note}</p>
                      </div>
                      {index < FLOW_STEPS.length - 1 && <span className="flow-connector" aria-hidden="true" />}
                      {index === FLOW_STEPS.length - 1 && (
                        <Check className="flow-check" aria-label={isHindi ? 'अगला कदम स्पष्ट' : 'Next step made clear'} />
                      )}
                    </li>
                  );
                })}
              </ol>
              <div className="flow-visual-footer">
                <span className="flow-footer-icon">
                  <ShieldCheck aria-hidden="true" />
                </span>
                <span>{isHindi ? 'आपके दस्तावेज़ और जानकारी निजी रहते हैं' : 'Your documents and information stay private'}</span>
                <span className="flow-footer-dots" aria-hidden="true">
                  •••
                </span>
              </div>
            </div>
          </div>
          <div className="hero-bottom-rule" aria-hidden="true" />
        </section>

        <section className="journeys-section" id="journeys" aria-labelledby="journeys-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{isHindi ? 'आपकी स्थिति' : 'START WITH YOUR SITUATION'}</p>
              <h2 id="journeys-title">{isHindi ? 'आप किस काम में मदद चाहते हैं?' : 'What are you trying to do?'}</h2>
              <p>{isHindi ? 'अपनी स्थिति चुनें। हम उसी के अनुसार तैयारी के कदम दिखाएँगे।' : 'Choose a situation to see the right preparation steps for you.'}</p>
            </div>
            <Link href="/cases" className="section-link">
              {t('myCases', lang)} <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="journey-grid">
            {PROBLEMS.map((problem) => {
              const Icon = JOURNEY_ICONS[problem.id];
              return (
                <Link
                  key={problem.id}
                  href={`/case/new?journey=${problem.id}`}
                  className="journey-option"
                  id={`problem-${problem.id.toLowerCase()}`}
                >
                  <span className="journey-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="journey-copy">
                    <span className="journey-title">{isHindi ? problem.titleHi : problem.title}</span>
                    <span className="journey-description">{isHindi ? problem.descriptionHi : problem.description}</span>
                  </span>
                  <ArrowUpRight className="journey-arrow" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="how-section" id="how-it-works" aria-labelledby="how-title">
          <div className="how-intro">
            <p className="eyebrow">{isHindi ? 'सरल, सुरक्षित, चरण-दर-चरण' : 'A CLEARER WAY FORWARD'}</p>
            <h2 id="how-title">{isHindi ? 'दस्तावेज़ों से अगले कदम तक।' : 'From documents to a confident next step.'}</h2>
            <p>
              {isHindi
                ? 'हर चरण आपको बताता है कि क्या जाँचा गया, क्या बाकी है और अब क्या करना है।'
                : 'At every stage, see what was checked, what is missing, and what to do next.'}
            </p>
          </div>
          <div className="how-steps">
            {FLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div className="how-step" key={step.number}>
                  <span className="how-number">{step.number}</span>
                  <Icon aria-hidden="true" />
                  <h3>{isHindi ? step.titleHi : step.title}</h3>
                  <p>{isHindi ? step.noteHi : step.note}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="help-strip" id="help" aria-label={isHindi ? 'महत्वपूर्ण जानकारी' : 'Important information'}>
          <div className="help-icon">
            <Landmark aria-hidden="true" />
          </div>
          <div>
            <h2>{isHindi ? 'तैयारी में मदद, कानूनी सलाह नहीं।' : 'Preparation support, not legal advice.'}</h2>
            <p>
              {isHindi
                ? 'AdhikarSetu दस्तावेज़ों में संकेत और तैयारी की स्थिति दिखाता है। यह दस्तावेज़ों को प्रमाणित नहीं करता और अंतिम पात्रता तय नहीं करता। जमा करने से पहले आधिकारिक आवश्यकताएँ जाँचें।'
                : 'AdhikarSetu checks document signals and preparation status. It does not authenticate documents or determine final eligibility. Verify official requirements before submitting.'}
            </p>
          </div>
          <Link href="/case/new" className="btn btn-outline">
            {isHindi ? 'मामला शुरू करें' : 'Start a case'} <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <Link href="/" className="footer-brand">
          AdhikarSetu
        </Link>
        <span>
          {isHindi ? 'आपके निवेशक अधिकारों की तैयारी का सेतु।' : 'A bridge to preparing for your investor rights.'}
        </span>
        <Link href="/cases">{t('myCases', lang)}</Link>
      </footer>
    </div>
  );
}
