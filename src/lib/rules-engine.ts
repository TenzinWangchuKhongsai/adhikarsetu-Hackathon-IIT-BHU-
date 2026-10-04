// Truthful Deterministic Rules Engine for AdhikarSetu
// Core Principle: "Uploaded" != "Valid" and "User checked checkbox" != "Evidence verified"

import {
  JourneyType,
  ChecklistItem,
  DocumentType,
  Case,
  CaseStatus,
  NameMismatch,
  UploadedDocument,
} from './types';
import { labels } from './i18n';

// ─── Journey Checklists ───────────────────────────────────────────────────────

const LEGAL_HEIR_IEPF_CHECKLIST: ChecklistItem[] = [
  {
    id: 'lh_death_cert',
    label: 'Death Certificate of the shareholder',
    labelHi: 'शेयरधारक का मृत्यु प्रमाण पत्र',
    description: 'Original or certified copy of death certificate from municipality/panchayat.',
    descriptionHi: 'नगर पालिका/पंचायत से मूल या प्रमाणित मृत्यु प्रमाण पत्र।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'DEATH_CERTIFICATE',
    helpText: 'Issued by local registrar of births and deaths. Must show registration number and date of death.',
    helpTextHi: 'जन्म और मृत्यु के स्थानीय पंजीयक द्वारा जारी। पंजीकरण संख्या और मृत्यु तिथि दिखनी चाहिए।',
  },
  {
    id: 'lh_legal_heir_cert',
    label: 'Legal Heir / Succession Certificate',
    labelHi: 'कानूनी वारिस / उत्तराधिकार प्रमाण पत्र',
    description: 'Issued by a civil court or revenue authority (Tehsildar).',
    descriptionHi: 'न्यायालय या राजस्व प्राधिकरण (तहसीलदार) द्वारा जारी।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'LEGAL_HEIR_CERTIFICATE',
    helpText: 'Apply at your local revenue office (Tehsildar) or district civil court.',
    helpTextHi: 'अपने स्थानीय राजस्व कार्यालय या जिला सिविल कोर्ट में आवेदन करें।',
  },
  {
    id: 'lh_pan_claimant',
    label: 'Your PAN Card (Claimant)',
    labelHi: 'आपका पैन कार्ड (दावेदार)',
    description: 'PAN card of the person making the claim (legal heir).',
    descriptionHi: 'दावा करने वाले व्यक्ति (कानूनी वारिस) का पैन कार्ड।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'PAN_CARD',
    helpText: 'Must contain a valid 10-character PAN number matching Income Tax records.',
    helpTextHi: 'आयकर रिकॉर्ड से मेल खाने वाला वैध 10-अक्षरीय पैन नंबर होना चाहिए।',
  },
  {
    id: 'lh_aadhaar_claimant',
    label: 'Your Aadhaar Card (Claimant)',
    labelHi: 'आपका आधार कार्ड (दावेदार)',
    description: 'Aadhaar of the claimant for identity and address verification.',
    descriptionHi: 'पहचान और पता सत्यापन के लिए दावेदार का आधार।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'AADHAAR',
  },
  {
    id: 'lh_bank_details',
    label: 'Cancelled Cheque or Bank Passbook',
    labelHi: 'रद्द किया गया चेक या बैंक पासबुक',
    description: 'Bank account where the refund or shares should be credited.',
    descriptionHi: 'वह बैंक खाता जहां धनराशि/शेयर जमा होने चाहिए।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'CANCELLED_CHEQUE',
    helpText: 'Must show your name, account number, and bank IFSC code clearly.',
    helpTextHi: 'आपका नाम, खाता संख्या और बैंक IFSC कोड स्पष्ट दिखना चाहिए।',
  },
  {
    id: 'lh_share_cert',
    label: 'Share Certificate or Demat Statement',
    labelHi: 'शेयर प्रमाण पत्र या डीमैट स्टेटमेंट',
    description: 'Original physical share certificate or latest demat holding statement.',
    descriptionHi: 'मूल शेयर प्रमाण पत्र या नवीनतम डीमैट खाता विवरण।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'SHARE_CERTIFICATE',
  },
  {
    id: 'lh_transmission_form',
    label: 'Transmission Request Form (SH-15)',
    labelHi: 'ट्रांसमिशन अनुरोध फॉर्म (SH-15)',
    description: 'Form SH-15 provided by company RTA for transmission of shares.',
    descriptionHi: 'कंपनी के RTA द्वारा प्रदान किया गया फॉर्म SH-15।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'TRANSMISSION_FORM',
    helpText: 'Download the official Form SH-15 from the company RTA website.',
    helpTextHi: 'कंपनी RTA की वेबसाइट से आधिकारिक फॉर्म SH-15 डाउनलोड करें।',
  },
  {
    id: 'lh_affidavit',
    label: 'Affidavit (Notarized)',
    labelHi: 'शपथ पत्र (नोटरीकृत)',
    description: 'Notarized affidavit on stamp paper confirming you are the rightful legal heir.',
    descriptionHi: 'स्टांप पेपर पर नोटरीकृत शपथ पत्र कि आप वैध कानूनी वारिस हैं।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'AFFIDAVIT',
    helpText: 'An advocate or notary can draft this. Also required if name spellings differ.',
    helpTextHi: 'अधिवक्ता या नोटरी इसे तैयार कर सकते हैं। नाम में अंतर होने पर भी आवश्यक है।',
  },
  {
    id: 'lh_indemnity',
    label: 'Indemnity Bond (Notarized)',
    labelHi: 'क्षतिपूर्ति बंध पत्र (नोटरीकृत)',
    description: 'Required by RTAs for share transmission without probate of will.',
    descriptionHi: 'बिना प्रोबेट के शेयर ट्रांसमिशन के लिए RTA द्वारा आवश्यक।',
    required: false,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'INDEMNITY_BOND',
    helpText: 'Ask your RTA if they require stamp paper of specific denomination (usually ₹100-500).',
    helpTextHi: 'RTA से पूछें कि किस मूल्य के स्टांप पेपर की आवश्यकता है।',
  },
];

const IEPF_ONLY_CHECKLIST: ChecklistItem[] = [
  {
    id: 'iepf_pan',
    label: 'PAN Card',
    labelHi: 'पैन कार्ड',
    description: 'Your PAN card for identity verification.',
    descriptionHi: 'पहचान सत्यापन के लिए आपका पैन कार्ड।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'PAN_CARD',
  },
  {
    id: 'iepf_aadhaar',
    label: 'Aadhaar Card',
    labelHi: 'आधार कार्ड',
    description: 'Aadhaar for identity and address proof.',
    descriptionHi: 'पहचान और पता प्रमाण के लिए आधार।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'AADHAAR',
  },
  {
    id: 'iepf_bank',
    label: 'Cancelled Cheque or Bank Passbook',
    labelHi: 'रद्द किया गया चेक या बैंक पासबुक',
    description: 'Bank account to receive the refund.',
    descriptionHi: 'धनराशि प्राप्त करने के लिए बैंक खाता।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'CANCELLED_CHEQUE',
  },
  {
    id: 'iepf_share_cert',
    label: 'Share Certificate or Demat Account Proof',
    labelHi: 'शेयर प्रमाण पत्र या डीमैट खाता प्रमाण',
    description: 'Proof that you hold shares in the company.',
    descriptionHi: 'प्रमाण कि आपके पास कंपनी में शेयर हैं।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'SHARE_CERTIFICATE',
  },
  {
    id: 'iepf_div_warrant',
    label: 'Dividend Warrant (if available)',
    labelHi: 'लाभांश वारंट (यदि उपलब्ध हो)',
    description: 'Old dividend warrants showing unclaimed amounts.',
    descriptionHi: 'पुराने लाभांश वारंट जो लावारिस राशि दर्शाते हैं।',
    required: false,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'DIVIDEND_WARRANT',
  },
  {
    id: 'iepf_form_1',
    label: 'IEPF-5 Form Filing (on MCA portal)',
    labelHi: 'IEPF-5 फॉर्म दाखिल (MCA पोर्टल पर)',
    description: 'Official Form IEPF-5 to be filed on iepf.gov.in portal.',
    descriptionHi: 'iepf.gov.in पोर्टल पर भरा जाने वाला आधिकारिक फॉर्म IEPF-5।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    helpText: 'File online at https://iepf.gov.in. Upload physical copy acknowledgement afterwards.',
    helpTextHi: 'https://iepf.gov.in पर ऑनलाइन भरें।',
  },
];

const SCORES_CHECKLIST: ChecklistItem[] = [
  {
    id: 'scores_pan',
    label: 'Your PAN Card',
    labelHi: 'आपका पैन कार्ड',
    description: 'Required to register on SEBI SCORES portal.',
    descriptionHi: 'SEBI SCORES पोर्टल पर पंजीकरण के लिए आवश्यक।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'PAN_CARD',
  },
  {
    id: 'scores_broker_stmt',
    label: 'Broker / Demat Statement showing the issue',
    labelHi: 'समस्या दर्शाने वाला ब्रोकर/डीमैट विवरण',
    description: 'Document showing transaction, unauthorized trade, or non-receipt of shares.',
    descriptionHi: 'लेनदेन या शेयर न मिलने की समस्या दर्शाने वाला दस्तावेज़।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'BROKER_STATEMENT',
  },
  {
    id: 'scores_prev_complaint',
    label: 'Previous grievance correspondence with entity',
    labelHi: 'संस्था के साथ पिछली शिकायत पत्राचार',
    description: 'Emails or formal letters sent to the intermediary prior to escalating.',
    descriptionHi: 'SEBI में जाने से पहले संस्था को भेजे गए ईमेल या पत्र।',
    required: false,
    completed: false,
    evidenceStatus: 'MISSING',
  },
  {
    id: 'scores_submit',
    label: 'File complaint on SEBI SCORES portal',
    labelHi: 'SEBI SCORES पोर्टल पर शिकायत दर्ज करें',
    description: 'Online filing at scores.sebi.gov.in with supporting proofs.',
    descriptionHi: 'scores.sebi.gov.in पर ऑनलाइन दाखिल करें।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    helpText: 'Register at https://scores.sebi.gov.in/ with your PAN and mobile number.',
    helpTextHi: 'अपने पैन और मोबाइल नंबर के साथ scores.sebi.gov.in पर पंजीकरण करें।',
  },
];

const NOMINEE_CHECKLIST: ChecklistItem[] = [
  {
    id: 'nom_pan',
    label: 'Your PAN Card (Shareholder)',
    labelHi: 'आपका पैन कार्ड (शेयरधारक)',
    description: 'PAN of the account holder registering the nominee.',
    descriptionHi: 'नामांकन पंजीकृत करने वाले खाताधारक का पैन।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'PAN_CARD',
  },
  {
    id: 'nom_nominee_id',
    label: "Nominee's Identity Proof",
    labelHi: 'नामांकित व्यक्ति का पहचान प्रमाण',
    description: "Aadhaar or PAN of the nominee.",
    descriptionHi: 'नामांकित व्यक्ति का आधार या पैन।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'AADHAAR',
  },
  {
    id: 'nom_form',
    label: 'Nominee Registration Form (SH-13)',
    labelHi: 'नामांकन पंजीकरण फॉर्म (SH-13)',
    description: 'Form SH-13 to be submitted to RTA or DP.',
    descriptionHi: 'RTA या DP को प्रस्तुत किया जाने वाला फॉर्म SH-13।',
    required: true,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'NOMINEE_FORM',
    helpText: 'Available through broker portal (Profile > Nominee) or RTA downloads.',
    helpTextHi: 'ब्रोकर पोर्टल या RTA डाउनलोड में उपलब्ध।',
  },
  {
    id: 'nom_demat',
    label: 'Demat Account Statement',
    labelHi: 'डीमैट खाता विवरण',
    description: 'To verify your demat account number and holdings.',
    descriptionHi: 'आपके डीमैट खाता नंबर और होल्डिंग्स की जांच के लिए।',
    required: false,
    completed: false,
    evidenceStatus: 'MISSING',
    documentType: 'BROKER_STATEMENT',
  },
];

export function getChecklistForJourney(journeyType: JourneyType): ChecklistItem[] {
  const map: Record<JourneyType, ChecklistItem[]> = {
    LEGAL_HEIR_IEPF: LEGAL_HEIR_IEPF_CHECKLIST,
    IEPF_ONLY: IEPF_ONLY_CHECKLIST,
    SCORES_COMPLAINT: SCORES_CHECKLIST,
    NOMINEE_REGISTRATION: NOMINEE_CHECKLIST,
  };
  return JSON.parse(JSON.stringify(map[journeyType]));
}

// ─── Truthful Case Readiness Evaluation ───────────────────────────────────────

export interface ReadinessEvaluation {
  score: number;
  status: CaseStatus;
  explanation: string;
  explanationHi: string;
  blockers: string[];
  blockersHi: string[];
  verifiedRequiredCount: number;
  totalRequiredCount: number;
  missingRequiredCount: number;
  invalidRequiredCount: number;
  needsReviewRequiredCount: number;
  userConfirmedCount: number;
}

export function evaluateCaseReadiness(
  checklist: ChecklistItem[],
  documents: UploadedDocument[] = [],
  nameMismatches: NameMismatch[] = []
): ReadinessEvaluation {
  const required = checklist.filter((i) => i.required);
  const optional = checklist.filter((i) => !i.required);

  const verifiedRequired = required.filter((i) => i.evidenceStatus === 'VERIFIED');
  const userConfirmedRequired = required.filter((i) => i.evidenceStatus === 'USER_CONFIRMED');
  const needsReviewRequired = required.filter((i) => i.evidenceStatus === 'NEEDS_REVIEW');
  const invalidRequired = required.filter((i) => i.evidenceStatus === 'INVALID');
  const missingRequired = required.filter((i) => i.evidenceStatus === 'MISSING');

  const verifiedOptional = optional.filter((i) => i.evidenceStatus === 'VERIFIED');
  const userConfirmedOptional = optional.filter((i) => i.evidenceStatus === 'USER_CONFIRMED');

  const verifiedDocsCount = documents.filter((d) => d.verified).length;
  const blockers: string[] = [];
  const blockersHi: string[] = [];

  // 1. HARD RULE: Zero verified uploaded documents => readiness cannot exceed 15%
  if (verifiedDocsCount === 0) {
    blockers.push('No required documents have been verified with evidence.');
    blockersHi.push('प्रमाण के साथ किसी भी आवश्यक दस्तावेज़ का सत्यापन नहीं हुआ है।');

    // If user clicked checkmarks, they get minor procedural credit only
    const proceduralCredit = Math.min(15, userConfirmedRequired.length * 3);

    return {
      score: proceduralCredit,
      status: 'NOT_READY',
      explanation: 'No documents uploaded yet. Readiness requires uploaded and verified document evidence.',
      explanationHi: 'अभी कोई दस्तावेज़ अपलोड नहीं किया गया। तैयारी के लिए सत्यापित दस्तावेज़ आवश्यक हैं।',
      blockers,
      blockersHi,
      verifiedRequiredCount: 0,
      totalRequiredCount: required.length,
      missingRequiredCount: missingRequired.length + invalidRequired.length + needsReviewRequired.length,
      invalidRequiredCount: invalidRequired.length,
      needsReviewRequiredCount: needsReviewRequired.length,
      userConfirmedCount: userConfirmedRequired.length,
    };
  }

  // 2. Base score calculation
  // Verified required items: 70% of total
  // User confirmed required items: max 15% (provisional, half-credit)
  // Optional items: 15% of total
  const reqTotal = required.length || 1;
  const verifiedScore = (verifiedRequired.length / reqTotal) * 70;
  const userConfirmedScore = Math.min(15, (userConfirmedRequired.length / reqTotal) * 35);

  const optTotal = optional.length || 1;
  const optScore = optional.length > 0
    ? (verifiedOptional.length / optTotal) * 12 + (userConfirmedOptional.length / optTotal) * 3
    : 15;

  let rawScore = Math.round(verifiedScore + userConfirmedScore + optScore);

  // 3. Evaluate Blockers
  // A. Unresolved name mismatches
  if (nameMismatches.length > 0) {
    blockers.push(
      `Name mismatch detected between ${nameMismatches.length} document(s). A notarized affidavit is required before submission.`
    );
    blockersHi.push(
      `दस्तावेज़ों के बीच नाम में अंतर पाया गया है। जमा करने से पहले नोटरीकृत शपथ पत्र आवश्यक है।`
    );
    rawScore = Math.min(rawScore - 15, 70); // capped at 70%
  }

  // B. Invalid required documents
  if (invalidRequired.length > 0) {
    const invalidNames = invalidRequired.map((i) => i.label).join(', ');
    blockers.push(`Invalid or unrecognized document uploaded for: ${invalidNames}. Replace with a clear photo.`);
    blockersHi.push(`अमान्य दस्तावेज़ अपलोड: ${invalidNames}। कृपया सही दस्तावेज़ अपलोड करें।`);
    rawScore = Math.min(rawScore - (invalidRequired.length * 15), 65); // penalized and capped
  }

  // C. Documents needing review
  if (needsReviewRequired.length > 0) {
    const reviewNames = needsReviewRequired.map((i) => i.label).join(', ');
    blockers.push(`Document requires review or confirmation: ${reviewNames}.`);
    blockersHi.push(`दस्तावेज़ की समीक्षा आवश्यक है: ${reviewNames}।`);
    rawScore = Math.min(rawScore, 75);
  }

  // D. Missing required documents
  if (missingRequired.length > 0) {
    blockers.push(`${missingRequired.length} required document(s) still missing.`);
    blockersHi.push(`${missingRequired.length} आवश्यक दस्तावेज़ अभी बाकी हैं।`);
    rawScore = Math.min(rawScore, 75);
  }

  // Clamped score
  const finalScore = Math.max(5, Math.min(100, rawScore));

  // 4. Determine Case Status
  let status: CaseStatus = 'NOT_READY';
  let explanation = '';
  let explanationHi = '';

  if (blockers.length === 0 && verifiedRequired.length === required.length) {
    status = 'READY';
    explanation = 'All required documents passed type checks. Ready for final review before submission.';
    explanationHi = 'सभी आवश्यक दस्तावेज़ों के प्रकार की जाँच पूरी। जमा करने से पहले अंतिम समीक्षा के लिए तैयार।';
  } else if (invalidRequired.length > 0 || nameMismatches.length > 0 || needsReviewRequired.length > 0) {
    status = 'NEEDS_ATTENTION';
    explanation = `${blockers.length} issue(s) need attention before final review: ${blockers[0]}`;
    explanationHi = `${blockers.length} मुद्दों पर ध्यान देने की आवश्यकता है: ${blockersHi[0]}`;
  } else {
    status = 'NOT_READY';
    explanation = `${missingRequired.length} required document(s) still need to be uploaded and checked.`;
    explanationHi = `${missingRequired.length} आवश्यक दस्तावेज़ अभी अपलोड और जाँचे जाने बाकी हैं।`;
  }

  return {
    score: finalScore,
    status,
    explanation,
    explanationHi,
    blockers,
    blockersHi,
    verifiedRequiredCount: verifiedRequired.length,
    totalRequiredCount: required.length,
    missingRequiredCount: missingRequired.length,
    invalidRequiredCount: invalidRequired.length,
    needsReviewRequiredCount: needsReviewRequired.length,
    userConfirmedCount: userConfirmedRequired.length,
  };
}

export function calculateReadinessScore(
  checklist: ChecklistItem[],
  documents: UploadedDocument[] = [],
  nameMismatches: NameMismatch[] = []
): number {
  return evaluateCaseReadiness(checklist, documents, nameMismatches).score;
}

// ─── Name Similarity & Mismatch Detection ─────────────────────────────────────

export function isValidPan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(shri|sh\.|smt\.|mr\.|mrs\.|ms\.|dr\.)\s+/i, '') // strip honorifics
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

export function nameSimilarity(name1: string, name2: string): number {
  const a = normalizeName(name1);
  const b = normalizeName(name2);
  if (a === b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

export function detectNameMismatches(documents: UploadedDocument[]): NameMismatch[] {
  // Only check documents that were actually recognized / not completely invalid
  const docsWithNames = documents.filter(
    (d) => d.ocrData?.name && d.ocrStatus === 'DONE' && d.validation?.status !== 'INVALID'
  );
  const mismatches: NameMismatch[] = [];

  for (let i = 0; i < docsWithNames.length; i++) {
    for (let j = i + 1; j < docsWithNames.length; j++) {
      const d1 = docsWithNames[i];
      const d2 = docsWithNames[j];
      const norm1 = normalizeName(d1.ocrData!.name!);
      const norm2 = normalizeName(d2.ocrData!.name!);
      if (norm1 !== norm2) {
        const sim = nameSimilarity(d1.ocrData!.name!, d2.ocrData!.name!);
        mismatches.push({
          doc1Type: d1.type,
          doc1Name: d1.ocrData!.name!,
          doc2Type: d2.type,
          doc2Name: d2.ocrData!.name!,
          similarity: Math.round(sim * 100) / 100,
        });
      }
    }
  }

  return mismatches;
}

// ─── Sync Checklist with Documents ─────────────────────────────────────────────

export function syncChecklistWithDocuments(caseData: Case): Case {
  // Map documents by type
  const docsByType = new Map<DocumentType, UploadedDocument[]>();
  for (const doc of caseData.documents) {
    const list = docsByType.get(doc.type) || [];
    list.push(doc);
    docsByType.set(doc.type, list);
  }

  const updatedChecklist = caseData.checklist.map((item) => {
    if (!item.documentType) {
      // Procedural item without document upload requirement
      return {
        ...item,
        evidenceStatus: item.completed ? ('USER_CONFIRMED' as const) : ('MISSING' as const),
      };
    }

    const uploaded = docsByType.get(item.documentType);
    if (!uploaded || uploaded.length === 0) {
      // No document uploaded
      if (item.completed && item.evidenceStatus === 'USER_CONFIRMED') {
        // User manually indicated they have it, but no document is verified
        return { ...item, evidenceStatus: 'USER_CONFIRMED' as const, completed: true };
      }
      return { ...item, evidenceStatus: 'MISSING' as const, completed: false, linkedDocId: undefined };
    }

    // Check if any uploaded doc of this type is validly verified
    const validDoc = uploaded.find((d) => d.verified || d.validation?.status === 'VALID');
    if (validDoc) {
      return {
        ...item,
        evidenceStatus: 'VERIFIED' as const,
        completed: true,
        linkedDocId: validDoc.id,
      };
    }

    // Check if any uploaded doc needs review
    const reviewDoc = uploaded.find((d) => d.validation?.status === 'NEEDS_REVIEW');
    if (reviewDoc) {
      if (reviewDoc.validation?.userConfirmed) {
        return {
          ...item,
          evidenceStatus: 'USER_CONFIRMED' as const,
          completed: true,
          linkedDocId: reviewDoc.id,
        };
      }
      return {
        ...item,
        evidenceStatus: 'NEEDS_REVIEW' as const,
        completed: false,
        linkedDocId: reviewDoc.id,
      };
    }

    // If all uploaded documents of this type are INVALID
    const invalidDoc = uploaded[uploaded.length - 1];
    return {
      ...item,
      evidenceStatus: 'INVALID' as const,
      completed: false,
      linkedDocId: invalidDoc.id,
    };
  });

  const nameMismatches = detectNameMismatches(caseData.documents);
  const evaluation = evaluateCaseReadiness(updatedChecklist, caseData.documents, nameMismatches);

  return {
    ...caseData,
    checklist: updatedChecklist,
    nameMismatches,
    readinessScore: evaluation.score,
    status: evaluation.status,
    readinessExplanation: evaluation.explanation,
    readinessBlockers: evaluation.blockers,
    updatedAt: new Date().toISOString(),
  };
}
