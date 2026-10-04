// Client-side OCR using Tesseract.js
// Extracts: name, PAN, folio number, DOB from document images

import { OcrData } from './types';

/**
 * Client-side OCR image preprocessing.
 * For low-resolution uploads (e.g. screenshots with width or height < 1200px),
 * small text font size (6-10px) causes Tesseract LSTM segmentation to fail.
 * Scaling the image to a target resolution (min dimension ~1400px) on an HTML canvas
 * dramatically improves OCR character recognition accuracy.
 */
async function preprocessImageForOcr(file: File): Promise<HTMLCanvasElement | File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
    URL.revokeObjectURL(url);

    const { naturalWidth: width, naturalHeight: height } = img;
    if (!width || !height) return file;

    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    let scale = 1;
    if (minDim < 900 || maxDim < 1300) {
      scale = Math.min(3, Math.max(1.8, 1400 / minDim));
    }

    if (scale <= 1.05) {
      return file;
    }

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas;
  } catch {
    return file;
  }
}

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

  const inputForOcr = await preprocessImageForOcr(file);

  const result = await Tesseract.recognize(inputForOcr, 'eng', {
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
  // OCR may lowercase letters or insert spaces between characters in a PAN.
  const match = text.match(/\b([A-Z](?:\s*[A-Z]){4}\s*\d(?:\s*\d){3}\s*[A-Z])\b/i);
  return match?.[1].replace(/\s+/g, '').toUpperCase();
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
  // Try labeled fields first, limiting match to single line
  const patterns = [
    /(?:Name\s*(?:of\s*(?:the\s*)?(?:shareholder|applicant|account\s*holder|deceased))?|Name)\s*[:\-]?\s*([A-Za-z][A-Za-z\s.]{2,40})/i,
    /(?:Sh\.|Shri\s+|Smt\.\s+|Mr\.\s+|Mrs\.\s+|Ms\.\s+)([A-Za-z][A-Za-z\s.]{2,40})/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const line = m[1].split(/[\r\n]/)[0].trim().replace(/\s+/g, ' ');
      if (line.length > 3 && line.length < 60) return line;
    }
  }
  return undefined;
}

function extractDob(text: string): string | undefined {
  // Various date formats: DOB or Date of Death/Registration
  const match = text.match(
    /(?:D(?:ate)?\s*(?:of)?\s*(?:B(?:irth)?|Death|Demise)|DOB)\s*[:\-]?\s*(\d{1,2}[\-\/\.\s]\d{1,2}[\-\/\.\s]\d{2,4})/i
  );
  return match?.[1]?.replace(/\s+/g, '-');
}

function extractAddress(text: string): string | undefined {
  const match = text.match(/(?:Address|Addr\.?)\s*:?\s*([\s\S]{10,150}?)(?:\n\n|\bPAN\b|\bPhone\b)/i);
  if (match) return match[1].replace(/\s+/g, ' ').trim();
  return undefined;
}
