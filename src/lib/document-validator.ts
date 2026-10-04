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

export type SignalMatcher =
  | string
  | RegExp
  | ((normText: string, compactText: string, rawText: string) => boolean);

export interface SignalRule {
  term: SignalMatcher;
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
    minOcrChars: 15,
    minValidScore: 40,
    minReviewScore: 25,
    strongSignals: [
      {
        term: (n, c) =>
          /\bdeath\s*cert(?:ificate|ifict|ificat|if)?\b/i.test(n) ||
          c.includes('deathcertificate') ||
          c.includes('deathcert') ||
          /मृत्यु\s*प्रमाण\s*पत्र/i.test(n) ||
          c.includes('मृत्युप्रमाणपत्र'),
        label: 'Death Certificate',
        weight: 25,
      },
      {
        term: (n, c) =>
          /\bcert(?:ificate)?\s*(?:of)?\s*death\b/i.test(n) ||
          c.includes('certificateofdeath') ||
          c.includes('certofdeath') ||
          /record\s*(?:of)?\s*death\b/i.test(n) ||
          c.includes('recordofdeath'),
        label: 'Certificate of Death',
        weight: 25,
      },
      {
        term: (n, c) =>
          /\b(?:date|dt)\s*(?:of)?\s*(?:death|demise)\b/i.test(n) ||
          c.includes('dateofdeath') ||
          c.includes('dateofdemise') ||
          /मृत्यु\s*(?:की\s*)?(?:तिथि|दिनांक)/i.test(n) ||
          c.includes('मृत्युतिथि') ||
          c.includes('मृत्युदिनांक'),
        label: 'Date of Death',
        weight: 20,
      },
      {
        term: (n, c) =>
          /\breg(?:istration|istn)?\s*(?:of)?\s*death\b/i.test(n) ||
          c.includes('registrationofdeath') ||
          /\bdeath\s*reg(?:istration|istn)?\b/i.test(n) ||
          /\bdeath\s*act\b/i.test(n) ||
          /\bdeath\s*rule\b/i.test(n) ||
          c.includes('deathregistration') ||
          c.includes('deathact'),
        label: 'Registration of Death',
        weight: 20,
      },
      {
        term: (n, c) =>
          /\breg(?:istration|istn|n)?\.?\s*(?:no|number|num|#)\b/i.test(n) ||
          c.includes('registrationno') ||
          c.includes('registrationnumber') ||
          c.includes('regno') ||
          c.includes('regnumber') ||
          /पंजीकरण\s*(?:संख्या|नं)/i.test(n) ||
          c.includes('पंजीकरणसंख्या') ||
          /\bmcdour\b/i.test(n),
        label: 'Registration Number',
        weight: 20,
      },
      {
        term: (n, c) =>
          /\b(?:date|dt)\s*(?:of)?\s*reg(?:istration|istn|n)?\b/i.test(n) ||
          c.includes('dateofregistration') ||
          c.includes('dateofreg') ||
          /पंजीकरण\s*(?:की\s*)?(?:तिथि|दिनांक)/i.test(n) ||
          c.includes('पंजीकरणतिथि'),
        label: 'Date of Registration',
        weight: 15,
      },
      {
        term: (n, c) =>
          /\bform\s*(?:no\.?|na\.?|number|num)?\s*6\b/i.test(n) ||
          c.includes('formno6') ||
          c.includes('formna6') ||
          c.includes('form6') ||
          /फॉर्म\s*(?:नं\.?|संख्या)?\s*6\b/i.test(n),
        label: 'Form No. 6',
        weight: 15,
      },
      {
        term: (n, c) =>
          /\b(?:sub[\s-]*)?registrar\b/i.test(n) ||
          c.includes('registrar') ||
          c.includes('subregistrar') ||
          /पंजीयक/i.test(n),
        label: 'Registrar Authority',
        weight: 15,
      },
      {
        term: (n, c) =>
          /\b(?:municipal|munkipal)\s*(?:corp(?:oration)?|counci[l1])\b/i.test(n) ||
          c.includes('municipalcorporation') ||
          c.includes('munkipalcorporation') ||
          /\bnorth\s*deli\b/i.test(n) ||
          /\bnagar\s*(?:nigam|palika)\b/i.test(n) ||
          /\bgram\s*panchayat\b/i.test(n) ||
          /\bmcd\b/i.test(n) ||
          /\bndmc\b/i.test(n) ||
          c.includes('mcdonline'),
        label: 'Municipal Corporation',
        weight: 15,
      },
      {
        term: (n, c) =>
          /\bbirth(?:s)?\s*(?:and|&)\s*death(?:s)?\b/i.test(n) ||
          c.includes('birthanddeath') ||
          c.includes('birthsanddeaths') ||
          c.includes('birthdeath') ||
          /जन्म\s*(?:और|एवं)\s*मृत्यु/i.test(n),
        label: 'Births and Deaths',
        weight: 15,
      },
    ],
    supportingSignals: [
      {
        term: (n, c) =>
          /\b(?:name\s*(?:of)?\s*)?father\s*(?:\/|\s*(?:and|or)\s*)\s*husband\b/i.test(n) ||
          c.includes('fatherhusband') ||
          c.includes('nameoffatherhusband') ||
          /\bfather(?:'s)?\s*name\b/i.test(n) ||
          /पिता\s*(?:\/|या)\s*पति/i.test(n),
        label: 'Name of Father/Husband',
        weight: 10,
      },
      {
        term: (n, c) =>
          /\b(?:name\s*(?:of)?\s*)?mother(?:'s)?(?:\s*name)?\b/i.test(n) ||
          c.includes('nameofmother') ||
          c.includes('mothername') ||
          /माता\s*(?:का\s*नाम)?/i.test(n),
        label: 'Name of Mother',
        weight: 8,
      },
      {
        term: (n, c) =>
          /\b(?:name\s*(?:of)?\s*)?spouse\b/i.test(n) ||
          c.includes('nameofspouse') ||
          c.includes('spousename') ||
          /पति\s*\/\s*पत्नी/i.test(n),
        label: 'Name of Spouse',
        weight: 8,
      },
      {
        term: (n, c) =>
          /\bplace\s*(?:of)?\s*death\b/i.test(n) ||
          c.includes('placeofdeath') ||
          /मृत्यु\s*(?:का\s*)?स्थान/i.test(n),
        label: 'Place of Death',
        weight: 10,
      },
      {
        term: (n, c) =>
          /\b(?:permanent|present)\s*address\b/i.test(n) ||
          c.includes('permanentaddress') ||
          c.includes('presentaddress') ||
          /स्थायी\s*पता/i.test(n),
        label: 'Permanent Address',
        weight: 8,
      },
      {
        term: (n, c) =>
          /\b(?:issued\s*under\s*(?:section\s*\d+\s*of\s*(?:the\s*)?)?)?registration\s*of\s*(?:births?\s*(?:and|&)\s*)?deaths?\s*act\b/i.test(n) ||
          /\bact\s*,?\s*1969\b/i.test(n) ||
          c.includes('act1969') ||
          c.includes('registrationofdeathact'),
        label: 'Issued under Registration Act',
        weight: 10,
      },
      {
        term: (n, c) =>
          /\b(?:govt|government)\s*(?:of)?\s*(?:national\s*capital\s*territory|nct|delhi|india)\b/i.test(n) ||
          /\bnational\s*capital\s*territory\b/i.test(n) ||
          /\bnct\s*(?:of)?\s*delhi\b/i.test(n) ||
          /\bnct\.?\s*dein\b/i.test(n) ||
          c.includes('nationalcapitalterritory') ||
          c.includes('govtofnationalcapitalterritory'),
        label: 'Government Authority',
        weight: 10,
      },
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
        regex: /\b[A-Z](?:\s*[A-Z]){4}\s*[\dIO](?:\s*[\dIO]){2,4}\s*[A-Z]\b/i,
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
 * Normalizes raw OCR text before matching:
 * - lowercase
 * - normalize whitespace & line breaks to single spaces
 * - normalize punctuation and common OCR variation symbols (dashes, quotes, delimiters)
 * - creates a compact representation stripped of spaces/punctuation to handle merged or split OCR tokens
 */
export function normalizeOcrText(text: string): { norm: string; compact: string; raw: string } {
  const raw = text || '';
  const norm = raw
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212_]/g, '-')
    .replace(/[\u2018\u2019`]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const compact = norm.replace(/[^a-z0-9\u0900-\u097F]/g, '');
  return { norm, compact, raw };
}

function isSignalMatched(
  signal: SignalRule,
  normText: string,
  compactText: string,
  rawText: string
): boolean {
  if (typeof signal.term === 'function') {
    return signal.term(normText, compactText, rawText);
  }
  if (typeof signal.term === 'string') {
    const lower = signal.term.toLowerCase();
    return normText.includes(lower) || rawText.toLowerCase().includes(lower);
  }
  return signal.term.test(normText) || signal.term.test(rawText);
}

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

  const { norm: normText, compact: compactText } = normalizeOcrText(rawText);

  // 2. Check required patterns (e.g. valid PAN pattern on PAN card)
  if (config.requiredPatterns) {
    for (const req of config.requiredPatterns) {
      if (!req.regex.test(rawText) && !req.regex.test(normText)) {
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
  const matchedStrongSignals: string[] = [];
  const missingSignals: string[] = [];
  let score = 0;

  for (const signal of config.strongSignals) {
    if (isSignalMatched(signal, normText, compactText, rawText)) {
      matchedStrongSignals.push(signal.label);
      score += signal.weight;
    } else {
      missingSignals.push(signal.label);
    }
  }

  // 4. Evaluate supporting signals
  const matchedSupportingSignals: string[] = [];
  for (const signal of config.supportingSignals) {
    if (isSignalMatched(signal, normText, compactText, rawText)) {
      matchedSupportingSignals.push(signal.label);
      score += signal.weight;
    }
  }

  // 5. Evaluate contradictory signals (negative weight)
  const contradictorySignals: string[] = [];
  for (const signal of config.contradictorySignals) {
    if (isSignalMatched(signal, normText, compactText, rawText)) {
      contradictorySignals.push(signal.label);
      score -= signal.weight;
    }
  }

  const matchedSignals = [...matchedStrongSignals, ...matchedSupportingSignals];
  const normalizedScore = Math.max(0, Math.min(100, score));

  // 6. Contradictory signals override if strong matches are absent or score was eliminated
  if (contradictorySignals.length > 0 && (matchedStrongSignals.length === 0 || score <= 0)) {
    return {
      status: 'INVALID',
      isValid: false,
      confidence: 'NONE',
      confidenceScore: 0,
      matchedSignals,
      missingSignals: missingSignals.slice(0, 3),
      contradictorySignals,
      reason: `This does not appear to be a ${config.titleEn}. The image contains indicators of a different document (${contradictorySignals.join(', ')}).`,
      reasonHi: `यह ${config.titleHi} प्रतीत नहीं होता। यह किसी अन्य दस्तावेज़ (${contradictorySignals.join(', ')}) जैसा दिखता है।`,
      suggestedAction: `Please upload the actual ${config.titleEn} instead.`,
      suggestedActionHi: `कृपया वास्तविक ${config.titleHi} अपलोड करें।`,
    };
  }

  // 7. Valid: sufficient score AND at least 2 independent strong signals
  // For DEATH_CERTIFICATE, at least one core death-identifying signal is required to distinguish
  // from general municipal notices or birth registration documents.
  const hasCoreDeathSignal =
    docType !== 'DEATH_CERTIFICATE' ||
    matchedStrongSignals.some(
      (s) =>
        s === 'Death Certificate' ||
        s === 'Certificate of Death' ||
        s === 'Date of Death' ||
        s === 'Registration of Death' ||
        s === 'Form No. 6'
    );

  if (normalizedScore >= config.minValidScore && matchedStrongSignals.length >= 2 && hasCoreDeathSignal) {
    return {
      status: 'VALID',
      isValid: true,
      confidence: 'HIGH',
      confidenceScore: normalizedScore,
      matchedSignals,
      missingSignals: [],
      contradictorySignals,
      reason: `${config.titleEn} document type verified with matching evidence (${matchedSignals.slice(0, 5).join(', ')}).`,
      reasonHi: `${config.titleHi} दस्तावेज़ प्रकार की प्रमाणों (${matchedSignals.slice(0, 5).join(', ')}) के साथ पुष्टि हुई।`,
    };
  }

  // 8. Needs review: partial signals (at least 1 strong signal or multiple signals with score >= minReviewScore)
  if (normalizedScore >= config.minReviewScore && (matchedStrongSignals.length >= 1 || matchedSignals.length >= 2)) {
    return {
      status: 'NEEDS_REVIEW',
      isValid: false,
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

  // 9. Weak or zero signals found: INVALID
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
