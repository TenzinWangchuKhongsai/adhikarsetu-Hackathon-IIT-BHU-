// Deterministic Document Validator for AdhikarSetu
// Evaluates OCR text against positive, supporting, and contradictory signals.
// "Uploaded" != "Valid"
// "User checked checkbox" != "Evidence verified"

import { DocumentType, OcrData, ValidationStatus } from './types';

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface DocumentValidation {
  status: ValidationStatus;
  isValid: boolean;
  confidence: EvidenceConfidence;
  confidenceScore: number; // 0-100 deterministic signal score
  matchedSignals: string[];
  missingSignals: string[];
  contradictorySignals: string[];
  reason: string;
  reasonHi: string;
  suggestedAction?: string;
  suggestedActionHi?: string;
  userConfirmed?: boolean;
}

interface SignalRule {
  term: string | RegExp;
  label: string;
  weight: number;
}

interface DocValidationConfig {
  docType: DocumentType;
  titleEn: string;
  titleHi: string;
  minOcrChars: number;
  minValidScore: number;
  minReviewScore: number;
  strongSignals: SignalRule[];
  supportingSignals: SignalRule[];
  contradictorySignals: SignalRule[];
  requiredPatterns?: { regex: RegExp; label: string; failReason: string; failReasonHi: string }[];
}

// ─── Configuration for all document types ──────────────────────────────────────

const VALIDATION_CONFIGS: Record<DocumentType, DocValidationConfig> = {
  DEATH_CERTIFICATE: {
    docType: 'DEATH_CERTIFICATE',
    titleEn: 'Death Certificate',
    titleHi: 'मृत्यु प्रमाण पत्र',
    minOcrChars: 18,
    minValidScore: 45,
    minReviewScore: 22,
    strongSignals: [
      { term: /death\s*cert/i, label: 'Death Certificate title', weight: 35 },
      { term: /cert(?:ificate)?\s*of\s*death/i, label: 'Certificate of Death', weight: 35 },
      { term: /मृत्यु\s*प्रमाण\s*पत्र/i, label: 'Hindi Death Certificate title', weight: 35 },
      { term: /date\s*of\s*death/i, label: 'Date of Death', weight: 25 },
      { term: /date\s*of\s*demise/i, label: 'Date of Demise', weight: 25 },
      { term: /मृत्यु\s*तिथि/i, label: 'Date of Death (Hindi)', weight: 25 },
      { term: /(?:deceased|name\s*of\s*(?:the\s*)?deceased|मृतक)/i, label: 'Deceased name header', weight: 25 },
      { term: /(?:registration|reg(?:n)?)\s*(?:no|number|#|\.)/i, label: 'Registration Number', weight: 25 },
      { term: /registrar\s*(?:of\s*)?(?:birth(?:s)?\s*(?:and|&)\s*death(?:s)?)?/i, label: 'Registrar Authority', weight: 25 },
    ],
    supportingSignals: [
      { term: /birth(?:s)?\s*(?:and|&)\s*death(?:s)?/i, label: 'Births & Deaths registry', weight: 15 },
      { term: /vital\s*statistics/i, label: 'Vital Statistics', weight: 15 },
      { term: /(?:municipal\s*corporation|municipality|nagar\s*(?:nigam|palika)|gram\s*panchayat)/i, label: 'Municipal / Local Authority', weight: 15 },
      { term: /form\s*(?:no\.?)?\s*6/i, label: 'Form 6 (Death Report)', weight: 15 },
      { term: /place\s*of\s*death/i, label: 'Place of Death', weight: 15 },
      { term: /cause\s*of\s*death/i, label: 'Cause of Death', weight: 10 },
      { term: /date\s*of\s*registration/i, label: 'Date of Registration', weight: 12 },
      { term: /(?:male|female|age\s*:\s*\d+)/i, label: 'Demographic indicators (Age/Sex)', weight: 10 },
    ],
    contradictorySignals: [
      { term: /income\s*tax\s*department/i, label: 'Income Tax Department (PAN indicator)', weight: 45 },
      { term: /permanent\s*account\s*number/i, label: 'Permanent Account Number (PAN indicator)', weight: 45 },
      { term: /share\s*cert(?:ificate)?/i, label: 'Share Certificate indicator', weight: 40 },
      { term: /equity\s*shares/i, label: 'Equity shares indicator', weight: 35 },
      { term: /cheque\s*no|pay\s*against\s*this/i, label: 'Banking cheque indicator', weight: 40 },
      { term: /driving\s*licen[sc]e/i, label: 'Driving Licence indicator', weight: 40 },
    ],
  },

  PAN_CARD: {
    docType: 'PAN_CARD',
    titleEn: 'PAN Card',
    titleHi: 'पैन कार्ड',
    minOcrChars: 10,
    minValidScore: 50,
    minReviewScore: 25,
    requiredPatterns: [
      {
        regex: /[A-Z]{5}[0-9]{4}[A-Z]/,
        label: 'Valid PAN Format (AAABB1234C)',
        failReason: 'No valid 10-character PAN number (5 letters, 4 digits, 1 letter) was detected.',
        failReasonHi: 'दस्तावेज़ में कोई वैध 10-अक्षरीय पैन नंबर नहीं मिला।',
      },
    ],
    strongSignals: [
      { term: /income\s*tax\s*department/i, label: 'Income Tax Department', weight: 35 },
      { term: /permanent\s*account\s*number/i, label: 'Permanent Account Number', weight: 35 },
      { term: /आयकर\s*विभाग/i, label: 'Income Tax Dept (Hindi)', weight: 35 },
      { term: /govt(?:\.|\s*of)\s*india/i, label: 'Govt. of India', weight: 20 },
      { term: /father(?:'s)?\s*name/i, label: "Father's Name", weight: 20 },
    ],
    supportingSignals: [
      { term: /date\s*of\s*birth|dob/i, label: 'Date of Birth', weight: 15 },
      { term: /signature/i, label: 'Signature line', weight: 10 },
      { term: /taxpayer/i, label: 'Taxpayer indicator', weight: 10 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death certificate text', weight: 40 },
      { term: /share\s*cert/i, label: 'Share certificate text', weight: 40 },
    ],
  },

  AADHAAR: {
    docType: 'AADHAAR',
    titleEn: 'Aadhaar Card',
    titleHi: 'आधार कार्ड',
    minOcrChars: 12,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /unique\s*identification\s*authority/i, label: 'UIDAI Header', weight: 35 },
      { term: /uidai/i, label: 'UIDAI acronym', weight: 30 },
      { term: /aadhaar/i, label: 'Aadhaar keyword', weight: 30 },
      { term: /आधार/i, label: 'Aadhaar (Hindi)', weight: 30 },
      { term: /mera\s*aadhaar/i, label: 'Mera Aadhaar slogan', weight: 25 },
      { term: /\b\d{4}\s\d{4}\s\d{4}\b/, label: '12-Digit Aadhaar structure', weight: 25 },
      { term: /\b[X\*\d]{4}\s[X\*\d]{4}\s\d{4}\b/, label: 'Masked Aadhaar structure', weight: 25 },
    ],
    supportingSignals: [
      { term: /government\s*of\s*india|भारत\s*सरकार/i, label: 'Government of India', weight: 15 },
      { term: /enrollment\s*no|enrolment/i, label: 'Enrollment No.', weight: 15 },
      { term: /(?:male|female|dob\s*:|year\s*of\s*birth)/i, label: 'DOB / Gender header', weight: 15 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate wording', weight: 40 },
      { term: /share\s*cert/i, label: 'Share Certificate wording', weight: 40 },
    ],
  },

  SHARE_CERTIFICATE: {
    docType: 'SHARE_CERTIFICATE',
    titleEn: 'Share Certificate or Demat Statement',
    titleHi: 'शेयर प्रमाण पत्र या डीमैट स्टेटमेंट',
    minOcrChars: 15,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /share\s*cert(?:ificate)?/i, label: 'Share Certificate title', weight: 35 },
      { term: /equity\s*shares/i, label: 'Equity Shares', weight: 30 },
      { term: /certificate\s*(?:no|number)/i, label: 'Certificate Number', weight: 25 },
      { term: /folio\s*(?:no|number)/i, label: 'Folio Number', weight: 25 },
      { term: /distinctive\s*(?:no|numbers)/i, label: 'Distinctive Numbers', weight: 25 },
      { term: /demat\s*account|client\s*id|dp\s*id/i, label: 'Demat / DP Identifiers', weight: 30 },
      { term: /cdsl|nsdl/i, label: 'Depository (CDSL/NSDL)', weight: 25 },
    ],
    supportingSignals: [
      { term: /(?:company\s*limited|ltd\.|corporation)/i, label: 'Company entity name', weight: 15 },
      { term: /registered\s*office/i, label: 'Registered Office', weight: 15 },
      { term: /face\s*value/i, label: 'Face Value', weight: 15 },
      { term: /holding\s*statement|transaction\s*statement/i, label: 'Holding Statement', weight: 20 },
      { term: /securities/i, label: 'Securities', weight: 10 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate wording', weight: 45 },
      { term: /income\s*tax\s*department/i, label: 'Income Tax wording', weight: 40 },
    ],
  },

  CANCELLED_CHEQUE: {
    docType: 'CANCELLED_CHEQUE',
    titleEn: 'Cancelled Cheque or Bank Passbook',
    titleHi: 'रद्द किया गया चेक या बैंक पासबुक',
    minOcrChars: 12,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /[A-Z]{4}0[A-Z0-9]{6}/, label: 'Valid Bank IFSC Code format', weight: 35 },
      { term: /cancelled/i, label: 'Cancelled mark', weight: 30 },
      { term: /(?:account|a\/c)\s*(?:no|number)/i, label: 'Account Number header', weight: 25 },
      { term: /passbook/i, label: 'Passbook header', weight: 25 },
      { term: /savings\s*a\/c|current\s*a\/c/i, label: 'Account Type', weight: 20 },
    ],
    supportingSignals: [
      { term: /(?:state\s*bank|hdfc|icici|punjab\s*national|axis\s*bank|bank\s*of\s*baroda|canara|union\s*bank|kotak)/i, label: 'Major Bank Name', weight: 20 },
      { term: /ifsc/i, label: 'IFSC label', weight: 15 },
      { term: /branch/i, label: 'Branch identifier', weight: 10 },
      { term: /pay\s*(?:against|order)/i, label: 'Payee line', weight: 15 },
      { term: /rtgs|neft/i, label: 'RTGS / NEFT indicator', weight: 10 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate wording', weight: 45 },
      { term: /share\s*cert/i, label: 'Share Certificate wording', weight: 40 },
    ],
  },

  BANK_PASSBOOK: {
    docType: 'BANK_PASSBOOK',
    titleEn: 'Bank Passbook',
    titleHi: 'बैंक पासबुक',
    minOcrChars: 12,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /[A-Z]{4}0[A-Z0-9]{6}/, label: 'Valid Bank IFSC Code', weight: 35 },
      { term: /passbook/i, label: 'Passbook header', weight: 35 },
      { term: /(?:account|a\/c)\s*(?:no|number)/i, label: 'Account Number', weight: 25 },
      { term: /savings\s*bank/i, label: 'Savings Bank', weight: 20 },
    ],
    supportingSignals: [
      { term: /(?:state\s*bank|hdfc|icici|punjab\s*national|axis|baroda|canara|union\s*bank)/i, label: 'Bank Name', weight: 20 },
      { term: /branch\s*manager|branch\s*code/i, label: 'Branch details', weight: 15 },
      { term: /customer\s*id|cif/i, label: 'Customer ID / CIF', weight: 15 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate wording', weight: 45 },
    ],
  },

  LEGAL_HEIR_CERTIFICATE: {
    docType: 'LEGAL_HEIR_CERTIFICATE',
    titleEn: 'Legal Heir / Succession Certificate',
    titleHi: 'कानूनी वारिस / उत्तराधिकार प्रमाण पत्र',
    minOcrChars: 18,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /legal\s*heir/i, label: 'Legal Heir title', weight: 35 },
      { term: /succession\s*cert(?:ificate)?/i, label: 'Succession Certificate', weight: 35 },
      { term: /surviving\s*member/i, label: 'Surviving Member Certificate', weight: 30 },
      { term: /उत्तराधिकार|कानूनी\s*वारिस/i, label: 'Succession / Legal Heir (Hindi)', weight: 35 },
      { term: /(?:tehsildar|tahsildar|revenue\s*(?:officer|authority)|sub-divisional)/i, label: 'Revenue Authority / Tehsildar', weight: 25 },
      { term: /(?:civil\s*court|district\s*judge|court\s*of)/i, label: 'Court Authority', weight: 25 },
    ],
    supportingSignals: [
      { term: /deceased/i, label: 'Deceased person mention', weight: 15 },
      { term: /legal\s*representative/i, label: 'Legal Representative', weight: 15 },
      { term: /surviving\s*(?:heirs|family)/i, label: 'Surviving family list', weight: 15 },
      { term: /order|decree/i, label: 'Court order / decree', weight: 15 },
      { term: /relation(?:ship)?\s*with/i, label: 'Relationship declaration', weight: 10 },
    ],
    contradictorySignals: [
      { term: /income\s*tax\s*department/i, label: 'Income Tax wording', weight: 45 },
      { term: /share\s*cert/i, label: 'Share Certificate wording', weight: 40 },
    ],
  },

  TRANSMISSION_FORM: {
    docType: 'TRANSMISSION_FORM',
    titleEn: 'Transmission Request Form (SH-15)',
    titleHi: 'ट्रांसमिशन अनुरोध फॉर्म (SH-15)',
    minOcrChars: 15,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /sh-15|form\s*sh-15/i, label: 'Form SH-15 code', weight: 40 },
      { term: /transmission\s*request/i, label: 'Transmission Request', weight: 35 },
      { term: /transmission\s*of\s*securities/i, label: 'Transmission of Securities', weight: 35 },
      { term: /registrar\s*(?:and|&)\s*transfer\s*agent|rta/i, label: 'RTA mention', weight: 25 },
    ],
    supportingSignals: [
      { term: /deceased\s*(?:holder|shareholder)/i, label: 'Deceased holder reference', weight: 15 },
      { term: /claimant|legal\s*heir/i, label: 'Claimant reference', weight: 15 },
      { term: /folio\s*no/i, label: 'Folio number field', weight: 15 },
      { term: /annexure/i, label: 'Annexure notation', weight: 10 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate title', weight: 40 },
    ],
  },

  AFFIDAVIT: {
    docType: 'AFFIDAVIT',
    titleEn: 'Affidavit (Notarized)',
    titleHi: 'शपथ पत्र (नोटरीकृत)',
    minOcrChars: 18,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /affidavit/i, label: 'Affidavit title', weight: 35 },
      { term: /शपथ\s*पत्र/i, label: 'Affidavit (Hindi)', weight: 35 },
      { term: /solemnly\s*(?:affirm|state)/i, label: 'Solemn Affirmation phrase', weight: 30 },
      { term: /deponent/i, label: 'Deponent keyword', weight: 30 },
      { term: /notary\s*public|notarised|notarized/i, label: 'Notary Public seal / text', weight: 25 },
      { term: /sworn\s*before\s*me/i, label: 'Sworn before me clause', weight: 25 },
    ],
    supportingSignals: [
      { term: /verification/i, label: 'Verification section', weight: 15 },
      { term: /advocate/i, label: 'Advocate identification', weight: 15 },
      { term: /stamp\s*paper/i, label: 'Stamp paper indication', weight: 10 },
      { term: /legal\s*heir/i, label: 'Legal heir declaration', weight: 15 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate wording', weight: 40 },
      { term: /share\s*cert/i, label: 'Share Certificate wording', weight: 40 },
    ],
  },

  INDEMNITY_BOND: {
    docType: 'INDEMNITY_BOND',
    titleEn: 'Indemnity Bond',
    titleHi: 'क्षतिपूर्ति बंध पत्र',
    minOcrChars: 18,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /indemnity\s*bond/i, label: 'Indemnity Bond title', weight: 35 },
      { term: /deed\s*of\s*indemnity/i, label: 'Deed of Indemnity', weight: 35 },
      { term: /क्षतिपूर्ति\s*बंध\s*पत्र/i, label: 'Indemnity Bond (Hindi)', weight: 35 },
      { term: /indemnifier|indemnify/i, label: 'Indemnifier clause', weight: 30 },
      { term: /suret(?:y|ies)/i, label: 'Sureties mention', weight: 25 },
    ],
    supportingSignals: [
      { term: /whereas/i, label: 'Whereas legal recitals', weight: 15 },
      { term: /claims?\s*(?:and|&)\s*demands?/i, label: 'Claims and demands covenant', weight: 15 },
      { term: /hold\s*harmless/i, label: 'Hold harmless clause', weight: 15 },
      { term: /notary/i, label: 'Notary seal', weight: 10 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate title', weight: 40 },
    ],
  },

  BROKER_STATEMENT: {
    docType: 'BROKER_STATEMENT',
    titleEn: 'Demat / Broker Statement',
    titleHi: 'डीमैट / ब्रोकर खाता विवरण',
    minOcrChars: 15,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /client\s*id|dp\s*id/i, label: 'Client ID / DP ID', weight: 35 },
      { term: /cdsl|nsdl/i, label: 'CDSL / NSDL Depository', weight: 30 },
      { term: /holding\s*statement|portfolio/i, label: 'Holding / Portfolio Statement', weight: 30 },
      { term: /demat\s*account/i, label: 'Demat Account', weight: 25 },
    ],
    supportingSignals: [
      { term: /securities/i, label: 'Securities', weight: 15 },
      { term: /isin/i, label: 'ISIN codes', weight: 20 },
      { term: /trading\s*account/i, label: 'Trading Account', weight: 15 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate text', weight: 45 },
    ],
  },

  DIVIDEND_WARRANT: {
    docType: 'DIVIDEND_WARRANT',
    titleEn: 'Dividend Warrant',
    titleHi: 'लाभांश अधिपत्र',
    minOcrChars: 12,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /dividend\s*warrant/i, label: 'Dividend Warrant title', weight: 35 },
      { term: /dividend\s*(?:rate|amount|warrant\s*no)/i, label: 'Dividend details', weight: 30 },
      { term: /financial\s*year/i, label: 'Financial Year', weight: 20 },
    ],
    supportingSignals: [
      { term: /folio\s*no/i, label: 'Folio reference', weight: 15 },
      { term: /payable\s*at\s*par/i, label: 'Payable at par', weight: 15 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate text', weight: 40 },
    ],
  },

  NOMINEE_FORM: {
    docType: 'NOMINEE_FORM',
    titleEn: 'Nomination Form (SH-13)',
    titleHi: 'नामांकन फॉर्म (SH-13)',
    minOcrChars: 15,
    minValidScore: 40,
    minReviewScore: 20,
    strongSignals: [
      { term: /sh-13|form\s*sh-13/i, label: 'Form SH-13 designation', weight: 35 },
      { term: /nomination\s*form/i, label: 'Nomination Form title', weight: 35 },
      { term: /nominee/i, label: 'Nominee keyword', weight: 25 },
    ],
    supportingSignals: [
      { term: /folio\s*no|dp\s*id/i, label: 'Folio or DP ID field', weight: 15 },
      { term: /beneficiary/i, label: 'Beneficiary indicator', weight: 15 },
    ],
    contradictorySignals: [
      { term: /death\s*cert/i, label: 'Death Certificate text', weight: 40 },
    ],
  },
};

// ─── Main Validator Engine ───────────────────────────────────────────────────

/**
 * Deterministically validates an uploaded document using OCR extracted text and fields.
 * NEVER relies on LLMs.
 * Returns explicit status: NOT_UPLOADED | INVALID | NEEDS_REVIEW | VALID
 */
export function validateDocument(
  docType: DocumentType,
  ocrData: OcrData | undefined | null
): DocumentValidation {
  const config = VALIDATION_CONFIGS[docType];
  if (!config) {
    return {
      status: 'NEEDS_REVIEW',
      isValid: false,
      confidence: 'LOW',
      confidenceScore: 30,
      matchedSignals: [],
      missingSignals: [],
      contradictorySignals: [],
      reason: 'No specific validation rules configured for this document type.',
      reasonHi: 'इस दस्तावेज़ प्रकार के लिए कोई विशिष्ट नियम उपलब्ध नहीं हैं।',
      suggestedAction: 'Please check this document manually.',
      suggestedActionHi: 'कृपया इस दस्तावेज़ की स्वयं जांच करें।',
    };
  }

  // 1. If OCR data is missing or raw text is virtually empty
  const rawText = (ocrData?.rawText || '').trim();
  if (!rawText || rawText.length < config.minOcrChars) {
    return {
      status: 'INVALID',
      isValid: false,
      confidence: 'NONE',
      confidenceScore: 0,
      matchedSignals: [],
      missingSignals: config.strongSignals.map((s) => s.label).slice(0, 3),
      contradictorySignals: [],
      reason: `This does not appear to be a ${config.titleEn}. We could not read enough clear text from this image.`,
      reasonHi: `यह ${config.titleHi} प्रतीत नहीं होता। हम इस छवि से पर्याप्त पाठ नहीं पढ़ सके।`,
      suggestedAction: `Please upload a clear, legible photo or scan of the ${config.titleEn}.`,
      suggestedActionHi: `कृपया ${config.titleHi} की स्पष्ट और पढ़ने योग्य फ़ोटो अपलोड करें।`,
    };
  }

  // 2. Check required patterns (e.g. valid PAN pattern on PAN card)
  if (config.requiredPatterns) {
    for (const req of config.requiredPatterns) {
      if (!req.regex.test(rawText)) {
        return {
          status: 'INVALID',
          isValid: false,
          confidence: 'LOW',
          confidenceScore: 10,
          matchedSignals: [],
          missingSignals: [req.label],
          contradictorySignals: [],
          reason: `This does not appear to be a valid ${config.titleEn}. ${req.failReason}`,
          reasonHi: `यह वैध ${config.titleHi} प्रतीत नहीं होता। ${req.failReasonHi}`,
          suggestedAction: `Upload a valid document showing ${req.label}.`,
          suggestedActionHi: `कृपया ${req.label} दर्शाने वाला वैध दस्तावेज़ अपलोड करें।`,
        };
      }
    }
  }

  // 3. Evaluate positive strong signals
  const matchedSignals: string[] = [];
  const missingSignals: string[] = [];
  let score = 0;

  for (const signal of config.strongSignals) {
    const isMatched = typeof signal.term === 'string'
      ? rawText.toLowerCase().includes(signal.term.toLowerCase())
      : signal.term.test(rawText);

    if (isMatched) {
      matchedSignals.push(signal.label);
      score += signal.weight;
    } else {
      missingSignals.push(signal.label);
    }
  }

  // 4. Evaluate supporting signals
  for (const signal of config.supportingSignals) {
    const isMatched = typeof signal.term === 'string'
      ? rawText.toLowerCase().includes(signal.term.toLowerCase())
      : signal.term.test(rawText);

    if (isMatched) {
      matchedSignals.push(signal.label);
      score += signal.weight;
    }
  }

  // 5. Evaluate contradictory signals (negative weight)
  const contradictorySignals: string[] = [];
  for (const signal of config.contradictorySignals) {
    const isContradictory = typeof signal.term === 'string'
      ? rawText.toLowerCase().includes(signal.term.toLowerCase())
      : signal.term.test(rawText);

    if (isContradictory) {
      contradictorySignals.push(signal.label);
      score -= signal.weight;
    }
  }

  // 6. Normalize score to 0–100
  const normalizedScore = Math.max(0, Math.min(100, score));

  // 7. Decision logic based on score and contradictory signals
  if (contradictorySignals.length > 0 && matchedSignals.length === 0) {
    return {
      status: 'INVALID',
      isValid: false,
      confidence: 'NONE',
      confidenceScore: 0,
      matchedSignals: [],
      missingSignals: missingSignals.slice(0, 3),
      contradictorySignals,
      reason: `This does not appear to be a ${config.titleEn}. The image contains indicators of a different document (${contradictorySignals.join(', ')}).`,
      reasonHi: `यह ${config.titleHi} प्रतीत नहीं होता। यह किसी अन्य दस्तावेज़ (${contradictorySignals.join(', ')}) जैसा दिखता है।`,
      suggestedAction: `Please upload the actual ${config.titleEn} instead.`,
      suggestedActionHi: `कृपया वास्तविक ${config.titleHi} अपलोड करें।`,
    };
  }

  if (normalizedScore >= config.minValidScore && matchedSignals.length >= 2) {
    return {
      status: 'VALID',
      isValid: true,
      confidence: 'HIGH',
      confidenceScore: normalizedScore,
      matchedSignals,
      missingSignals: [],
      contradictorySignals,
      reason: `${config.titleEn} verified with matching evidence (${matchedSignals.slice(0, 3).join(', ')}).`,
      reasonHi: `${config.titleHi} प्रमाणों (${matchedSignals.slice(0, 3).join(', ')}) के साथ सत्यापित हुआ।`,
    };
  }

  if (normalizedScore >= config.minReviewScore || matchedSignals.length >= 1) {
    return {
      status: 'NEEDS_REVIEW',
      isValid: false, // Not yet verified until user confirms or clearer copy uploaded
      confidence: 'MEDIUM',
      confidenceScore: normalizedScore,
      matchedSignals,
      missingSignals: missingSignals.slice(0, 3),
      contradictorySignals,
      reason: `This document has partial indicators of a ${config.titleEn}, but requires confirmation.`,
      reasonHi: `इस दस्तावेज़ में ${config.titleHi} के आंशिक संकेत हैं, लेकिन पुष्टि की आवश्यकता है।`,
      suggestedAction: `Review the extracted details or upload a clearer scan of your ${config.titleEn}.`,
      suggestedActionHi: `निकाले गए विवरण की समीक्षा करें या स्पष्ट प्रति अपलोड करें।`,
    };
  }

  // Weak or zero signals found
  return {
    status: 'INVALID',
    isValid: false,
    confidence: 'NONE',
    confidenceScore: normalizedScore,
    matchedSignals,
    missingSignals: missingSignals.slice(0, 3),
    contradictorySignals,
    reason: `This does not appear to be a ${config.titleEn}. We could not find enough identifying information.`,
    reasonHi: `यह ${config.titleHi} प्रतीत नहीं होता। हमें इसमें आवश्यक पहचान जानकारी नहीं मिली।`,
    suggestedAction: `Please replace this document with a clear photograph or scan of your ${config.titleEn}.`,
    suggestedActionHi: `कृपया इसे बदलकर अपने ${config.titleHi} की स्पष्ट फ़ोटो अपलोड करें।`,
  };
}
