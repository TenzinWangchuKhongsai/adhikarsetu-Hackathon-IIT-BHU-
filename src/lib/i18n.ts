// i18n labels - English + Hindi bilingual support

type Labels = {
  [key: string]: { en: string; hi: string };
};

export const labels: Labels = {
  // Navigation
  appName: { en: 'AdhikarSetu', hi: 'अधिकारसेतु' },
  appTagline: { en: 'Your Bridge to Financial Rights', hi: 'आपके वित्तीय अधिकारों का सेतु' },
  home: { en: 'Home', hi: 'होम' },
  back: { en: 'Back', hi: 'वापस' },
  next: { en: 'Next', hi: 'आगे' },
  save: { en: 'Save', hi: 'सहेजें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  done: { en: 'Done', hi: 'पूर्ण' },
  skip: { en: 'Skip', hi: 'छोड़ें' },

  // Landing
  landingHeadline: { en: 'What problem can we help you solve today?', hi: 'आज हम आपकी किस समस्या में मदद कर सकते हैं?' },
  landingSubtitle: { en: 'We guide you step by step — no confusing forms, no legal jargon.', hi: 'हम आपको कदम दर कदम मार्गदर्शन करते हैं — कोई उलझन नहीं, कोई कानूनी शब्दजाल नहीं।' },
  startJourney: { en: 'Start this Journey', hi: 'यह यात्रा शुरू करें' },
  myCases: { en: 'My Cases', hi: 'मेरे मामले' },
  newCase: { en: 'New Case', hi: 'नया मामला' },

  // Journey types
  legalHeirTitle: { en: 'Claim shares of a deceased family member', hi: 'मृत परिजन के शेयर का दावा करें' },
  legalHeirDesc: { en: 'A parent, spouse, or relative has passed away and left behind shares or unclaimed dividends.', hi: 'माता-पिता, जीवनसाथी या रिश्तेदार के निधन के बाद शेयर या लावारिस लाभांश छूट गया है।' },
  iepfOnlyTitle: { en: 'Claim unclaimed dividend or shares from IEPF', hi: 'IEPF से लावारिस लाभांश या शेयर का दावा करें' },
  iepfOnlyDesc: { en: 'Dividends not collected for 7+ years have gone to the IEPF fund. You can still reclaim them.', hi: '7+ वर्षों से न लिया गया लाभांश IEPF कोष में चला गया है। आप अभी भी इसे वापस पा सकते हैं।' },
  scoresTitle: { en: 'File a complaint against a broker or company', hi: 'दलाल या कंपनी के खिलाफ शिकायत दर्ज करें' },
  scoresDesc: { en: 'A company or broker has not resolved your issue. File a formal complaint with SEBI SCORES.', hi: 'किसी कंपनी या दलाल ने आपकी समस्या हल नहीं की। SEBI SCORES में औपचारिक शिकायत दर्ज करें।' },
  nomineeTitle: { en: 'Add or update a nominee to your shares', hi: 'अपने शेयरों में नामांकित व्यक्ति जोड़ें या अपडेट करें' },
  nomineeDesc: { en: 'Ensure your shares pass smoothly to your family by registering or updating a nominee.', hi: 'नामांकन करके या अपडेट करके सुनिश्चित करें कि आपके शेयर परिवार को सुचारू रूप से मिलें।' },

  // Documents
  uploadDocuments: { en: 'Upload Documents', hi: 'दस्तावेज़ अपलोड करें' },
  uploadHint: { en: 'Take a photo or upload a file', hi: 'फ़ोटो लें या फ़ाइल अपलोड करें' },
  scanningDocument: { en: 'Reading document...', hi: 'दस्तावेज़ पढ़ा जा रहा है...' },
  ocrComplete: { en: 'Document read successfully', hi: 'दस्तावेज़ सफलतापूर्वक पढ़ा गया' },
  ocrError: { en: 'Could not read document. Please try a clearer image.', hi: 'दस्तावेज़ नहीं पढ़ा जा सका। कृपया स्पष्ट छवि का प्रयास करें।' },
  documentVerified: { en: 'Verified', hi: 'सत्यापित' },
  removeDocument: { en: 'Remove', hi: 'हटाएं' },

  // Checklist
  checklist: { en: 'Document Checklist', hi: 'दस्तावेज़ चेकलिस्ट' },
  checklistProgress: { en: 'Progress', hi: 'प्रगति' },
  required: { en: 'Required', hi: 'आवश्यक' },
  optional: { en: 'Optional', hi: 'वैकल्पिक' },
  markDone: { en: 'Mark as Done', hi: 'पूर्ण चिह्नित करें' },
  markUndone: { en: 'Mark as Incomplete', hi: 'अपूर्ण चिह्नित करें' },

  // Readiness
  readinessScore: { en: 'Readiness Score', hi: 'तैयारी स्कोर' },
  notReady: { en: 'Not Ready', hi: 'तैयार नहीं' },
  almostReady: { en: 'Almost Ready', hi: 'लगभग तैयार' },
  ready: { en: 'Ready for Final Review', hi: 'अंतिम समीक्षा के लिए तैयार' },

  // Mismatches
  nameMismatch: { en: 'Name Mismatch Detected', hi: 'नाम में अंतर पाया गया' },
  nameMismatchDesc: { en: 'The names on your documents are different. This may delay your claim. Please check them.', hi: 'आपके दस्तावेज़ों पर नाम अलग-अलग हैं। इससे आपके दावे में देरी हो सकती है। कृपया जांचें।' },

  // Summary
  caseSummary: { en: 'Case Summary', hi: 'मामले का सारांश' },
  downloadPdf: { en: 'Download Claim Packet', hi: 'दावा पैकेट डाउनलोड करें' },
  caseId: { en: 'Case ID', hi: 'मामला ID' },
  createdOn: { en: 'Created On', hi: 'बनाया गया' },

  // Document types
  DEATH_CERTIFICATE: { en: 'Death Certificate', hi: 'मृत्यु प्रमाण पत्र' },
  PAN_CARD: { en: 'PAN Card', hi: 'पैन कार्ड' },
  AADHAAR: { en: 'Aadhaar Card', hi: 'आधार कार्ड' },
  BANK_PASSBOOK: { en: 'Bank Passbook / Statement', hi: 'बैंक पासबुक / स्टेटमेंट' },
  SHARE_CERTIFICATE: { en: 'Share Certificate', hi: 'शेयर प्रमाण पत्र' },
  AFFIDAVIT: { en: 'Affidavit', hi: 'शपथ पत्र' },
  INDEMNITY_BOND: { en: 'Indemnity Bond', hi: 'क्षतिपूर्ति बंध पत्र' },
  LEGAL_HEIR_CERTIFICATE: { en: 'Legal Heir Certificate / Succession Certificate', hi: 'कानूनी वारिस प्रमाण पत्र / उत्तराधिकार प्रमाण पत्र' },
  DIVIDEND_WARRANT: { en: 'Dividend Warrant', hi: 'लाभांश वारंट' },
  TRANSMISSION_FORM: { en: 'Transmission Request Form', hi: 'ट्रांसमिशन अनुरोध फॉर्म' },
  BROKER_STATEMENT: { en: 'Broker / Demat Statement', hi: 'दलाल / डीमैट स्टेटमेंट' },
  CANCELLED_CHEQUE: { en: 'Cancelled Cheque', hi: 'रद्द किया गया चेक' },
  NOMINEE_FORM: { en: 'Nominee Registration Form', hi: 'नामांकन पंजीकरण फॉर्म' },

  // Status
  DRAFT: { en: 'Draft', hi: 'मसौदा' },
  DOCUMENTS_UPLOADED: { en: 'Documents Uploaded', hi: 'दस्तावेज़ अपलोड किए गए' },
  CHECKLIST_COMPLETE: { en: 'Checklist Complete', hi: 'चेकलिस्ट पूर्ण' },
  READY: { en: 'Ready to Submit', hi: 'जमा करने के लिए तैयार' },

  // Errors & States  
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
  error: { en: 'Something went wrong', hi: 'कुछ गलत हुआ' },
  noCases: { en: 'No cases yet. Start a new one!', hi: 'अभी कोई मामला नहीं। नया शुरू करें!' },

  // Steps
  step: { en: 'Step', hi: 'चरण' },
  of: { en: 'of', hi: 'में से' },
  stepProblem: { en: 'Select Problem', hi: 'समस्या चुनें' },
  stepDocuments: { en: 'Upload Documents', hi: 'दस्तावेज़ अपलोड करें' },
  stepChecklist: { en: 'Complete Checklist', hi: 'चेकलिस्ट पूर्ण करें' },
  stepSummary: { en: 'Review & Download', hi: 'समीक्षा और डाउनलोड' },

  // Details form
  yourName: { en: 'Your Full Name', hi: 'आपका पूरा नाम' },
  deceasedName: { en: "Deceased Person's Name", hi: 'मृतक का नाम' },
  companyName: { en: 'Company Name', hi: 'कंपनी का नाम' },
  folioNumber: { en: 'Folio Number', hi: 'फोलियो नंबर' },
  enterDetails: { en: 'Enter basic details to begin', hi: 'शुरू करने के लिए बुनियादी जानकारी दर्ज करें' },
};

export type LabelKey = keyof typeof labels;

export function t(key: LabelKey, lang: 'en' | 'hi' = 'en'): string {
  return labels[key]?.[lang] ?? labels[key]?.en ?? key;
}
