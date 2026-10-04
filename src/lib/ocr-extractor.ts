// Client-side OCR using Tesseract.js
// Extracts: name, PAN, folio number, DOB from document images

import { OcrData } from './types';

/**
 * Run OCR on a File and extract structured fields.
 * Progress callback: 0-100
 */
export async function extractOcrData(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OcrData> {
  // Dynamically import Tesseract so it only loads client-side
  const Tesseract = await import('tesseract.js');

  onProgress?.(5);

  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(10 + m.progress * 80));
      }
    },
  });

  onProgress?.(95);

  const text = result.data.text;
  const confidence = result.data.confidence;

  const ocrData: OcrData = {
    rawText: text,
    confidence,
    name: extractName(text),
    pan: extractPan(text),
    folioNumber: extractFolio(text),
    dob: extractDob(text),
    address: extractAddress(text),
  };

  onProgress?.(100);
  return ocrData;
}

// ─── Field extractors ─────────────────────────────────────────────────────────

function extractPan(text: string): string | undefined {
  // PAN format: AAABB1234C (5 alpha, 4 numeric, 1 alpha)
  const match = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  return match?.[1];
}

function extractFolio(text: string): string | undefined {
  // Folio numbers often labelled "Folio No.", "Folio Number:", etc.
  const labelMatch = text.match(/(?:folio\s*(?:no|number|#)?\.?\s*:?\s*)([A-Z0-9\/\-]+)/i);
  if (labelMatch) return labelMatch[1].trim();

  // DP ID / Client ID for demat
  const dpMatch = text.match(/(?:DP\s*ID|Client\s*ID)\s*:?\s*([A-Z0-9]+)/i);
  return dpMatch?.[1];
}

function extractName(text: string): string | undefined {
  // Try labeled fields first
  const patterns = [
    /(?:Name\s*(?:of\s*(?:shareholder|applicant|account\s*holder|deceased)?)?)\s*:?\s*([A-Z][A-Z\s]+)/i,
    /(?:Sh\.|Shri\s+|Smt\.\s+|Mr\.\s+|Mrs\.\s+|Ms\.\s+)([A-Z][A-Z\s]+)/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const name = m[1].trim().replace(/\s+/g, ' ');
      if (name.length > 3 && name.length < 60) return name;
    }
  }
  return undefined;
}

function extractDob(text: string): string | undefined {
  // Various date formats
  const match = text.match(
    /(?:D(?:ate)?\s*(?:of)?\s*B(?:irth)?|DOB)\s*:?\s*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/i
  );
  return match?.[1];
}

function extractAddress(text: string): string | undefined {
  const match = text.match(/(?:Address|Addr\.?)\s*:?\s*([\s\S]{10,150}?)(?:\n\n|\bPAN\b|\bPhone\b)/i);
  if (match) return match[1].replace(/\s+/g, ' ').trim();
  return undefined;
}
