// AdhikarSetu Claim Preparation Packet Generator
// Generates a truthful, evidence-based 5-page PDF report using pdf-lib
//
// Root Cause / WinAnsi Notice: Helvetica fonts strictly support byte codes 0x00-0xFF.
// All text passes through sanitize() to map symbols/accents to safe ASCII.

import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { Case, ChecklistItem } from './types';
import { labels } from './i18n';
import { evaluateCaseReadiness } from './rules-engine';

// ─── WinAnsi Sanitizer ────────────────────────────────────────────────────────
const UNICODE_MAP: Record<string, string> = {
  '✓': '[OK]',
  '✗': '[X]',
  '✘': '[X]',
  '☑': '[OK]',
  '☒': '[X]',
  '●': '*',
  '○': '-',
  '•': '-',
  '→': '->',
  '←': '<-',
  '↓': 'v',
  '↑': '^',
  '►': '>',
  '◄': '<',
  '⚠': '[!]',
  '⚠️': '[!]',
  'ℹ': '[i]',
  '🎉': '',
  '📄': '',
  '📎': '',
  '💡': '[Tip]',
  '—': '-',
  '–': '-',
  '‒': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '…': '...',
  '\u00A0': ' ',
  '₹': 'Rs.',
  '×': 'x',
  '©': '(c)',
  '®': '(R)',
};

function sanitize(input: string | undefined | null): string {
  if (!input) return '';
  let result = '';
  for (const char of input) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp <= 0x00ff) {
      result += char;
    } else if (UNICODE_MAP[char] !== undefined) {
      result += UNICODE_MAP[char];
    } else {
      result += '';
    }
  }
  return result.replace(/\s{2,}/g, ' ').trim();
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = {
  primary: rgb(0.11, 0.31, 0.63),
  accent: rgb(0.95, 0.49, 0.14),
  success: rgb(0.16, 0.65, 0.32),
  danger: rgb(0.75, 0.1, 0.1),
  dark: rgb(0.1, 0.1, 0.15),
  gray: rgb(0.48, 0.48, 0.52),
  lightGray: rgb(0.94, 0.94, 0.96),
  white: rgb(1.0, 1.0, 1.0),
  warnBg: rgb(1, 0.97, 0.88),
};

function journeyLabel(type: Case['journeyType']): string {
  const map: Record<Case['journeyType'], string> = {
    LEGAL_HEIR_IEPF: 'Legal Heir & IEPF Claim',
    IEPF_ONLY: 'IEPF Unclaimed Dividend Claim',
    SCORES_COMPLAINT: 'SEBI SCORES Complaint',
    NOMINEE_REGISTRATION: 'Nominee Registration',
  };
  return map[type];
}

function docLabel(type: string): string {
  return sanitize((labels as Record<string, { en: string }>)[type]?.en ?? type);
}

function drawHLine(page: PDFPage, y: number, color = COLORS.lightGray) {
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color });
}

function wrapText(raw: string, maxChars: number): string[] {
  const text = sanitize(raw);
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function addPageWithHeader(
  pdfDoc: PDFDocument,
  width: number,
  height: number,
  title: string,
  subtitle: string,
  headerColor = COLORS.primary,
  fontBold: any,
  fontNormal: any
): PDFPage {
  const pg = pdfDoc.addPage([width, height]);
  pg.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: headerColor });
  pg.drawText(sanitize(title), { x: 40, y: height - 35, size: 18, font: fontBold, color: COLORS.white });
  pg.drawText(sanitize(subtitle), { x: 40, y: height - 55, size: 9.5, font: fontNormal, color: rgb(0.85, 0.9, 1) });
  return pg;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generateClaimPacket(caseData: Case): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const PAGE_W = 595;
  const PAGE_H = 842;

  const evalResult = evaluateCaseReadiness(
    caseData.checklist,
    caseData.documents,
    caseData.nameMismatches
  );

  const required = caseData.checklist.filter((i) => i.required);
  const verifiedDocsCount = caseData.documents.filter((d) => d.verified).length;

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1: CASE OVERVIEW & READINESS SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // Deep-blue header
  page.drawRectangle({ x: 0, y: PAGE_H - 120, width: PAGE_W, height: 120, color: COLORS.primary });
  page.drawText('AdhikarSetu Claim Preparation Packet', {
    x: 40, y: PAGE_H - 52, size: 22, font: fontBold, color: COLORS.white,
  });
  page.drawText('Investor Rights Case Preparation, Document Verification & Consistency Report', {
    x: 40, y: PAGE_H - 74, size: 10, font: fontNormal, color: rgb(0.85, 0.9, 1),
  });
  page.drawText('AdhikarSetu - Aapke Vittiya Adhikaron ka Setu (Prototype Report)', {
    x: 40, y: PAGE_H - 94, size: 8, font: fontNormal, color: rgb(0.75, 0.82, 1),
  });

  // Claim type badge
  page.drawRectangle({ x: 40, y: PAGE_H - 175, width: 515, height: 40, color: COLORS.lightGray });
  page.drawText('CLAIM CATEGORY', { x: 55, y: PAGE_H - 150, size: 8, font: fontBold, color: COLORS.gray });
  page.drawText(sanitize(journeyLabel(caseData.journeyType)), {
    x: 55, y: PAGE_H - 164, size: 13, font: fontBold, color: COLORS.primary,
  });

  // Claimant details
  let y = PAGE_H - 225;
  page.drawText('CASE IDENTIFICATION & CLAIMANT DETAILS', { x: 40, y, size: 8.5, font: fontBold, color: COLORS.gray });
  y -= 14;
  drawHLine(page, y, COLORS.primary);
  y -= 18;

  const details: [string, string | undefined][] = [
    ['Case ID', caseData.id],
    ['Claimant Name', caseData.claimantName],
    ['Deceased Person', caseData.deceasedName],
    ['Company Name', caseData.companyName],
    ['Folio / DP & Client ID', caseData.folioNumber],
    ['Date Generated', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Evidence Readiness Score', `${evalResult.score}%`],
  ];

  for (const [lbl, val] of details) {
    if (!val) continue;
    page.drawText(sanitize(lbl) + ':', { x: 40, y, size: 9.5, font: fontBold, color: COLORS.dark });
    page.drawText(sanitize(val), { x: 210, y, size: 9.5, font: fontNormal, color: COLORS.dark });
    y -= 20;
  }

  // Truthful Readiness Overview Box
  y -= 10;
  page.drawText('TRUTHFUL READINESS ASSESSMENT', { x: 40, y, size: 8.5, font: fontBold, color: COLORS.gray });
  y -= 14;
  drawHLine(page, y);
  y -= 18;

  const isReady = evalResult.status === 'READY';
  const statusBadgeColor = isReady ? COLORS.success : evalResult.status === 'NEEDS_ATTENTION' ? COLORS.accent : COLORS.danger;
  const statusBadgeText = isReady
    ? '[OK] READY FOR FINAL REVIEW'
    : evalResult.status === 'NEEDS_ATTENTION'
    ? '[!] ACTION REQUIRED BEFORE FINAL REVIEW'
    : '[X] INCOMPLETE EVIDENCE - NOT READY';

  page.drawText('Status:', { x: 40, y, size: 10, font: fontBold, color: COLORS.dark });
  page.drawText(statusBadgeText, { x: 130, y, size: 10, font: fontBold, color: statusBadgeColor });
  y -= 18;

  page.drawText(`Required Documents (Type Check Passed): ${evalResult.verifiedRequiredCount} / ${evalResult.totalRequiredCount}`, {
    x: 40, y, size: 9.5, font: fontNormal, color: COLORS.dark,
  });
  y -= 16;

  page.drawText(`Uploaded Documents with Confirmed Signals: ${verifiedDocsCount}`, {
    x: 40, y, size: 9.5, font: fontNormal, color: COLORS.dark,
  });
  y -= 16;

  if (caseData.nameMismatches.length > 0) {
    page.drawText(`[!] Name Mismatch Blocker: ${caseData.nameMismatches.length} conflict(s) detected (see Page 3)`, {
      x: 40, y, size: 9.5, font: fontBold, color: COLORS.danger,
    });
    y -= 16;
  }

  if (evalResult.invalidRequiredCount > 0) {
    page.drawText(`[X] Invalid / Unrecognized Document Uploads: ${evalResult.invalidRequiredCount} (see Page 2)`, {
      x: 40, y, size: 9.5, font: fontBold, color: COLORS.danger,
    });
    y -= 16;
  }

  // Active blockers list
  if (evalResult.blockers.length > 0) {
    y -= 6;
    for (const b of evalResult.blockers.slice(0, 3)) {
      const blines = wrapText('* ' + b, 82);
      for (const bl of blines) {
        page.drawText(bl, { x: 50, y, size: 8.5, font: fontNormal, color: rgb(0.65, 0.1, 0.1) });
        y -= 12;
      }
    }
  }

  // Non-negotiable Truthful Disclaimer Box
  y -= 14;
  page.drawRectangle({ x: 40, y: y - 66, width: 515, height: 74, color: COLORS.warnBg });
  page.drawLine({ start: { x: 40, y: y - 66 }, end: { x: 40, y: y + 8 }, thickness: 3, color: COLORS.accent });
  page.drawText('[!] IMPORTANT DISCLAIMER & LEGAL NOTICE', { x: 55, y: y - 6, size: 8.5, font: fontBold, color: COLORS.accent });
  const disclaimerLines = wrapText(
    'This Claim Preparation Packet is generated by AdhikarSetu to verify evidence and identify ' +
    'preventable filing defects. Document checks are based on extracted text and deterministic rules. ' +
    'They do not authenticate documents or determine final legal eligibility. It is NOT an official ' +
    'government form. Official claims must be submitted through authorized portals (iepf.gov.in / MCA) or with the company RTA.',
    86
  );
  let dy = y - 18;
  for (const line of disclaimerLines) {
    page.drawText(line, { x: 55, y: dy, size: 7.2, font: fontNormal, color: COLORS.dark });
    dy -= 11;
  }

  // Footer
  page.drawText(
    sanitize(`AdhikarSetu Evidence Report | Case: ${caseData.id} | Generated: ${new Date().toLocaleString('en-IN')}`),
    { x: 40, y: 22, size: 7, font: fontNormal, color: COLORS.gray }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2: DOCUMENT READINESS & EVIDENCE TABLE
  // ════════════════════════════════════════════════════════════════════════════
  page = addPageWithHeader(
    pdfDoc, PAGE_W, PAGE_H,
    'Document Readiness & Evidence Status',
    'Deterministic type check status for each required document (not an authenticity check)',
    COLORS.primary, fontBold, fontNormal
  );

  y = PAGE_H - 95;

  page.drawText('CHECKLIST ITEM', { x: 42, y, size: 8, font: fontBold, color: COLORS.gray });
  page.drawText('TYPE CHECK RESULT', { x: 260, y, size: 8, font: fontBold, color: COLORS.gray });
  page.drawText('CHECK RESULT / REQUIRED ACTION', { x: 380, y, size: 8, font: fontBold, color: COLORS.gray });
  y -= 10;
  drawHLine(page, y, COLORS.primary);
  y -= 16;

  for (const item of caseData.checklist) {
    if (y < 80) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 50;
      page.drawText('Document Readiness (continued)', { x: 40, y, size: 10, font: fontBold, color: COLORS.gray });
      y -= 20;
    }

    const isVer = item.evidenceStatus === 'VERIFIED';
    const isInv = item.evidenceStatus === 'INVALID';
    const isRev = item.evidenceStatus === 'NEEDS_REVIEW';
    const isUC  = item.evidenceStatus === 'USER_CONFIRMED';

    const statusBadge = isVer
      ? '[OK] TYPE CHECK PASSED'
      : isInv
      ? '[X] REJECTED'
      : isRev
      ? '[!] REVIEW NEEDED'
      : isUC
      ? '[i] USER CONFIRMED'
      : '[X] MISSING';
    const statusColor = isVer ? COLORS.success : isInv ? COLORS.danger : isRev ? COLORS.accent : isUC ? COLORS.primary : COLORS.gray;

    // Item title
    page.drawText(sanitize(item.label), { x: 42, y, size: 9, font: fontBold, color: COLORS.dark });
    page.drawText(statusBadge, { x: 260, y, size: 8, font: fontBold, color: statusColor });

    // Evidence note
    let evidenceText = '';
    let actionText = '';

    if (isVer) {
      evidenceText = 'Document type check passed via text signals';
      actionText = 'Keep physical original/copy for official submission';
    } else if (isInv) {
      evidenceText = 'Rejected: insufficient or unrelated text signals';
      actionText = 'Action: Upload clear photo of authentic certificate';
    } else if (isRev) {
      evidenceText = 'Partial signals detected; manual review needed';
      actionText = 'Action: Confirm legitimacy or provide clearer scan';
    } else if (isUC) {
      evidenceText = 'User confirmed - no document proof';
      actionText = 'Upload document to pass type checking';
    } else {
      evidenceText = 'No document uploaded yet';
      actionText = item.required ? 'Mandatory: Obtain certificate prior to filing' : 'Optional document';
    }

    page.drawText(sanitize(evidenceText), { x: 380, y, size: 8, font: fontNormal, color: COLORS.dark });
    y -= 13;

    // Second line with required action
    page.drawText(sanitize(`-> ${actionText}`), { x: 380, y, size: 7.5, font: fontNormal, color: statusColor });
    y -= 16;
    drawHLine(page, y, COLORS.lightGray);
    y -= 14;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 3: DOCUMENT CONSISTENCY & EXTRACTED FIELDS
  // ════════════════════════════════════════════════════════════════════════════
  page = addPageWithHeader(
    pdfDoc, PAGE_W, PAGE_H,
    'Document Consistency & Cross-Check',
    'Cross-document identity comparison to identify potential mismatches',
    COLORS.primary, fontBold, fontNormal
  );

  y = PAGE_H - 95;

  page.drawText('EXTRACTED FIELDS FROM MATCHED DOCUMENTS', { x: 40, y, size: 8.5, font: fontBold, color: COLORS.gray });
  y -= 12;
  drawHLine(page, y);
  y -= 18;

  const ocrDocs = caseData.documents.filter((d) => d.ocrData && d.validation?.status !== 'INVALID');
  if (ocrDocs.length === 0) {
    page.drawText('No valid documents with extracted text available for cross-comparison.', {
      x: 40, y, size: 9, font: fontNormal, color: COLORS.gray,
    });
    y -= 25;
  } else {
    for (const d of ocrDocs) {
      if (y < 120) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 50;
      }
      page.drawText(sanitize(`${docLabel(d.type)} (${d.fileName}):`), {
        x: 40, y, size: 9, font: fontBold, color: COLORS.primary,
      });
      y -= 14;

      const fields: string[] = [];
      if (d.ocrData?.name) fields.push(`Name: "${d.ocrData.name}"`);
      if (d.ocrData?.pan) fields.push(`PAN: ${d.ocrData.pan}`);
      if (d.ocrData?.folioNumber) fields.push(`Folio: ${d.ocrData.folioNumber}`);
      if (d.ocrData?.dob) fields.push(`DOB: ${d.ocrData.dob}`);

      const fieldStr = fields.length > 0 ? fields.join('  |  ') : 'No structured entities found';
      page.drawText(sanitize(fieldStr), { x: 55, y, size: 8.5, font: fontNormal, color: COLORS.dark });
      y -= 18;
    }
  }

  // Name Mismatches Section
  y -= 10;
  page.drawText('NAME MISMATCH AUDIT', { x: 40, y, size: 8.5, font: fontBold, color: COLORS.gray });
  y -= 12;
  drawHLine(page, y);
  y -= 18;

  if (caseData.nameMismatches.length === 0) {
    page.drawRectangle({ x: 40, y: y - 30, width: 515, height: 36, color: rgb(0.95, 0.99, 0.96) });
    page.drawText('[OK] No name mismatches detected across uploaded documents.', {
      x: 55, y: y - 18, size: 9, font: fontBold, color: COLORS.success,
    });
    y -= 45;
  } else {
    page.drawText('Warning: Mismatched names will cause claim rejection by the RTA / IEPF Authority.', {
      x: 40, y, size: 9, font: fontBold, color: COLORS.danger,
    });
    y -= 18;

    for (const mm of caseData.nameMismatches) {
      if (y < 140) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 50;
      }

      const boxH = 75;
      page.drawRectangle({ x: 40, y: y - boxH, width: 515, height: boxH, color: rgb(1, 0.95, 0.95) });
      page.drawLine({ start: { x: 40, y: y - boxH }, end: { x: 40, y }, thickness: 4, color: COLORS.danger });

      const simPct = Math.round(mm.similarity * 100);
      page.drawText(sanitize(`[!] Mismatch: ${docLabel(mm.doc1Type)} vs ${docLabel(mm.doc2Type)} (Similarity: ${simPct}%)`), {
        x: 52, y: y - 16, size: 9, font: fontBold, color: COLORS.danger,
      });

      page.drawText(sanitize(`Name on ${docLabel(mm.doc1Type)}: "${mm.doc1Name}"`), {
        x: 52, y: y - 32, size: 8.5, font: fontNormal, color: COLORS.dark,
      });
      page.drawText(sanitize(`Name on ${docLabel(mm.doc2Type)}: "${mm.doc2Name}"`), {
        x: 52, y: y - 46, size: 8.5, font: fontNormal, color: COLORS.dark,
      });

      page.drawText(
        'Required Solution: Obtain a notarized "Same Person" affidavit on stamp paper (Draft on Page 5).',
        { x: 52, y: y - 62, size: 8, font: fontBold, color: COLORS.danger }
      );

      y -= (boxH + 14);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 4: PRIORITIZED ACTION PLAN
  // ════════════════════════════════════════════════════════════════════════════
  page = addPageWithHeader(
    pdfDoc, PAGE_W, PAGE_H,
    'Prioritized Action Plan',
    'Follow these actionable steps to prepare your claim packet before submission',
    COLORS.success, fontBold, fontNormal
  );

  y = PAGE_H - 95;

  const ACTION_STEPS: [string, string[]][] = [];

  // Step 1: Replace Invalid documents if any
  const invalidDocs = caseData.documents.filter((d) => d.validation?.status === 'INVALID');
  if (invalidDocs.length > 0) {
    ACTION_STEPS.push([
      'Step 1 — Replace Rejected / Invalid Documents (CRITICAL)',
      [
        `The system rejected ${invalidDocs.length} uploaded file(s) due to insufficient certificate signals.`,
        'Take a clear, legible photograph of the original physical certificate in daylight.',
        'Ensure the registration number, issuing authority seal, and date are readable.',
      ],
    ]);
  }

  // Step 2: Name mismatch resolution
  if (caseData.nameMismatches.length > 0) {
    ACTION_STEPS.push([
      'Step 2 — Execute Notarized Same-Person Affidavit',
      [
        'Take the draft affidavit text on Page 5 to a local notary public or advocate.',
        'Purchase non-judicial stamp paper of appropriate denomination (usually Rs. 50-100).',
        'Have the affidavit signed and attested under the notary public official seal.',
      ],
    ]);
  }

  // Step 3: Missing documents
  const missingReq = caseData.checklist.filter((i) => i.required && i.evidenceStatus === 'MISSING');
  if (missingReq.length > 0) {
    ACTION_STEPS.push([
      `Step ${ACTION_STEPS.length + 1} — Gather Missing Required Documents`,
      [
        `Missing items: ${missingReq.map((i) => i.label).join(', ')}.`,
        'For Legal Heir Certificate: apply at the local revenue office (Tehsildar) or Civil Court.',
        'For Bank Proof: obtain a cancelled cheque with pre-printed account holder name.',
      ],
    ]);
  }

  // Step 4: Official submission channel
  ACTION_STEPS.push([
    `Step ${ACTION_STEPS.length + 1} — Official Submission to RTA / IEPF Authority`,
    [
      'Locate the company Registrar and Transfer Agent (RTA) e.g. KFin Technologies or Link Intime.',
      'Download the official Form SH-15 directly from the company or RTA investor relations website.',
      'Submit the physical claim dossier by Registered Post or Speed Post. Retain postal receipt.',
      'For unclaimed dividends: submit Form IEPF-5 online at https://iepf.gov.in and send copy to Nodal Officer.',
    ],
  ]);

  for (const [title, points] of ACTION_STEPS) {
    if (y < 120) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 50;
    }

    page.drawRectangle({ x: 40, y: y - 2, width: 515, height: 18, color: rgb(0.93, 0.97, 1) });
    page.drawText(sanitize(title), { x: 48, y: y + 2, size: 9.5, font: fontBold, color: COLORS.primary });
    y -= 20;

    for (const pt of points) {
      const wrapped = wrapText('- ' + pt, 86);
      for (const w of wrapped) {
        if (y < 60) break;
        page.drawText(w, { x: 52, y, size: 8.5, font: fontNormal, color: COLORS.dark });
        y -= 13;
      }
    }
    y -= 12;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 5: DRAFT AFFIDAVIT
  // ════════════════════════════════════════════════════════════════════════════
  page = addPageWithHeader(
    pdfDoc, PAGE_W, PAGE_H,
    'Draft Affidavit — Same Person Confirmation',
    'Legal draft for stamp paper execution before an authorized Notary Public',
    COLORS.accent, fontBold, fontNormal
  );

  y = PAGE_H - 95;

  // Stamped disclaimer banner
  page.drawRectangle({ x: 40, y: y - 36, width: 515, height: 42, color: rgb(1, 0.94, 0.9) });
  page.drawText('DRAFT ONLY — VERIFY BEFORE SIGNING — CONSULT AN ADVOCATE OR NOTARY', {
    x: 55, y: y - 14, size: 8.5, font: fontBold, color: rgb(0.7, 0.15, 0.15),
  });
  page.drawText('To be executed on non-judicial stamp paper of appropriate value as per State Stamp Act.', {
    x: 55, y: y - 28, size: 7.5, font: fontNormal, color: COLORS.dark,
  });
  y -= 54;

  const claimant = caseData.claimantName || '[Claimant Name]';
  const deceased = caseData.deceasedName || '[Deceased Name]';
  const company  = caseData.companyName || '[Company Name]';
  const folio    = caseData.folioNumber || '[Folio / Demat Number]';

  const mismatchDetails = caseData.nameMismatches.length > 0
    ? `the name "${caseData.nameMismatches[0].doc1Name}" appearing in ${docLabel(caseData.nameMismatches[0].doc1Type)} and the name "${caseData.nameMismatches[0].doc2Name}" appearing in ${docLabel(caseData.nameMismatches[0].doc2Type)} pertain to one and the same person`
    : `all references to ${claimant} across submitted identity and holding records pertain to one and the same person`;

  const AFFIDAVIT_TEXT = [
    `BEFORE THE NOTARY PUBLIC`,
    ``,
    `I, ${claimant}, residing at the address registered in my identity proof, do hereby solemnly affirm and state on oath as follows:`,
    ``,
    `1. That I am a citizen of India and the legal claimant in respect of the securities of ${company}, held under Folio / DP ID: ${folio}.`,
    ``,
    `2. That the said securities were registered in the name of ${deceased}, who passed away leaving behind legal heirs entitled to transmission.`,
    ``,
    `3. That I declare that ${mismatchDetails}, and there is no other claimant with the same identity.`,
    ``,
    `4. That I undertake to indemnify and hold harmless the Company, the Registrar and Transfer Agent (RTA), and the IEPF Authority against any claims arising from the transmission of said securities.`,
    ``,
    `5. That the statements made hereinabove are true and correct to the best of my knowledge and belief, and no material fact has been concealed.`,
    ``,
    `DEPONENT (Signature: _______________________)`,
    ``,
    `VERIFICATION:`,
    `Verified at ____________ on this _____ day of ____________, 2026, that the contents of this affidavit are true and correct.`,
    ``,
    `ATTESTED & SEALED BY NOTARY PUBLIC:`,
    `Name of Notary: ________________________   Registration No: ________________`,
  ];

  for (const line of AFFIDAVIT_TEXT) {
    if (y < 60) break;
    const isHeaderLine = line.startsWith('BEFORE') || line.startsWith('DEPONENT') || line.startsWith('VERIFICATION') || line.startsWith('ATTESTED');
    page.drawText(sanitize(line), {
      x: isHeaderLine ? 42 : 55,
      y,
      size: isHeaderLine ? 8.5 : 8,
      font: isHeaderLine ? fontBold : fontNormal,
      color: COLORS.dark,
    });
    y -= (line === '' ? 8 : 13);
  }

  // Final document footer
  if (y > 40) {
    drawHLine(page, y, COLORS.lightGray);
    y -= 12;
    page.drawText(
      sanitize(`Packet generated: ${new Date().toLocaleString('en-IN')} | Case ID: ${caseData.id} | AdhikarSetu Claim Preparation OS`),
      { x: 40, y, size: 7, font: fontNormal, color: COLORS.gray }
    );
  }

  return pdfDoc.save();
}
