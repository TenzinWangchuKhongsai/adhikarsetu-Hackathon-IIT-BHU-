// Core TypeScript types for AdhikarSetu

export type JourneyType =
  | 'LEGAL_HEIR_IEPF'
  | 'IEPF_ONLY'
  | 'SCORES_COMPLAINT'
  | 'NOMINEE_REGISTRATION';

export type CaseStatus =
  | 'DRAFT'
  | 'DOCUMENTS_UPLOADED'
  | 'CHECKLIST_COMPLETE'
  | 'NEEDS_ATTENTION'
  | 'NOT_READY'
  | 'READY';

export type DocumentType =
  | 'DEATH_CERTIFICATE'
  | 'PAN_CARD'
  | 'AADHAAR'
  | 'BANK_PASSBOOK'
  | 'SHARE_CERTIFICATE'
  | 'AFFIDAVIT'
  | 'INDEMNITY_BOND'
  | 'LEGAL_HEIR_CERTIFICATE'
  | 'DIVIDEND_WARRANT'
  | 'TRANSMISSION_FORM'
  | 'BROKER_STATEMENT'
  | 'CANCELLED_CHEQUE'
  | 'NOMINEE_FORM';

export type ValidationStatus = 'NOT_UPLOADED' | 'INVALID' | 'NEEDS_REVIEW' | 'VALID';
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

export interface OcrData {
  name?: string;
  pan?: string;
  folioNumber?: string;
  dob?: string;
  address?: string;
  rawText?: string;
  confidence?: number;
}

export interface UploadedDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  ocrData?: OcrData;
  ocrStatus: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  validation?: DocumentValidation;
  verified: boolean; // TRUE only if status === 'VALID' or (status === 'NEEDS_REVIEW' && userConfirmed)
}

export type ItemEvidenceStatus =
  | 'MISSING'
  | 'INVALID'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'USER_CONFIRMED';

export interface ChecklistItem {
  id: string;
  label: string;
  labelHi: string; // Hindi label
  description: string;
  descriptionHi: string;
  required: boolean;
  completed: boolean; // retained for UI backwards compatibility
  evidenceStatus: ItemEvidenceStatus; // truthful evidence-backed status
  documentType?: DocumentType; // linked document requirement
  linkedDocId?: string;
  helpText?: string;
  helpTextHi?: string;
}

export interface NameMismatch {
  doc1Type: DocumentType;
  doc1Name: string;
  doc2Type: DocumentType;
  doc2Name: string;
  similarity: number; // 0-1
}

export interface Case {
  id: string;
  journeyType: JourneyType;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  claimantName: string;
  deceasedName?: string; // for LEGAL_HEIR_IEPF
  companyName?: string; // company whose shares are claimed
  folioNumber?: string;
  documents: UploadedDocument[];
  checklist: ChecklistItem[];
  nameMismatches: NameMismatch[];
  readinessScore: number; // 0-100 truthful score
  readinessExplanation?: string;
  readinessBlockers?: string[];
  notes?: string;
}

export interface ProblemOption {
  id: JourneyType;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  examples: string[];
  estimatedTime: string;
}

export interface Language {
  code: 'en' | 'hi';
  label: string;
}
