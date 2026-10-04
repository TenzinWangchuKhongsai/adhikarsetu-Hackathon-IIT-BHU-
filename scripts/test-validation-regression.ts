import { validateDocument } from '../src/lib/document-validator';
import { DocumentType, OcrData } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('=== RUNNING ADHIKARSETU DOCUMENT VALIDATION REGRESSION SUITE ===\n');

// 1. Representative Death Certificate OCR text requested by user
const representativeDeathCertText = `
GOVERNMENT OF DELHI
DEATH CERTIFICATE
Form No. 6
Date of Death: 13-02-2021
Date of Registration: 28-12-2021
Registration No: MCD-2021-098765
Name of Deceased: RAMESH CHANDRA
`;

const res1 = validateDocument('DEATH_CERTIFICATE', { rawText: representativeDeathCertText });
console.log('[Test 1] Representative Death Certificate:');
console.log('  Status:', res1.status, '| Valid:', res1.isValid, '| Score:', res1.confidenceScore);
console.log('  Matched signals:', res1.matchedSignals);
assert(res1.status === 'VALID', 'Representative Death Certificate text must have status VALID');
assert(res1.isValid === true, 'Representative Death Certificate must be isValid = true');
assert(res1.matchedSignals.includes('Death Certificate'), 'Must detect Death Certificate');
assert(res1.matchedSignals.includes('Form No. 6'), 'Must detect Form No. 6');
assert(res1.matchedSignals.includes('Date of Death'), 'Must detect Date of Death');
assert(res1.matchedSignals.includes('Date of Registration'), 'Must detect Date of Registration');
assert(res1.matchedSignals.includes('Registration Number'), 'Must detect Registration Number');

// 2. Real OCR text from North Delhi Municipal Corporation death certificate (SHIV KUMAR)
const sampleMcdDeathCertText = `
Wid Hx | Form Na 6
ala wah By, Reel wan [)
Govt. of National Capital Territory of Delhi
Fad fwd FR Fm Ld
NORTH DELHI MUNICIPAL CORPORATION
tq WATT 99 / Death Certificate 0221-0811276623
(lssucd under section 17 of the Registration of Death Act, 1969 and 8/13 of Delhi Registration of
Death Rule,1999)
This is tm cerufy that the following Information has been taken from the original record of DEATH
which is the register for North Delhi Munkipal Corporation of CITY SP. ZONE of NCT. Dein
TTT / Name SHIV KUMAR
7 / Gender MALE
Trg FUR / Date Of Death 1302 2021
TW TTT / Place Of Death B 1614 SHASTRI NAGAR SHASTRI NAGAR NOKTH WEST DELHI INDIA 110052
afte FR / Date Of Registration 28122021
Toft FT / Registration No MCDOUR 0221 0811152168
HT BT ATH / Name of Mother DHARMWATI
Fam ff TAT / Name of Father/Husband JAI RAM SINGH
tera BT / Name of Spouse: PRAVESH TOMER
THTT TW / Present Address © 1614 SHASTRI NAGAR NORTH WEST DELHI INDIA 110052
FTE TT / Permanent Address B 1614 SHASTRI NAGAR NORTH WEST DELHI INDIA 110052
orf #1 / Print Date 2812 2021
Note: This certificate Is system generated and does not require any seal /signature in original
ENSURE REGISTRATION OF EVERY BIRTH & DEATH
`;

const res2 = validateDocument('DEATH_CERTIFICATE', { rawText: sampleMcdDeathCertText });
console.log('\n[Test 2] Sample MCD Death Certificate (SHIV KUMAR):');
console.log('  Status:', res2.status, '| Valid:', res2.isValid, '| Score:', res2.confidenceScore);
console.log('  Matched signals:', res2.matchedSignals);
assert(res2.status === 'VALID', 'Sample MCD Death Certificate must produce VALID status');
assert(res2.isValid === true, 'Sample MCD Death Certificate must be isValid = true');
assert(res2.matchedSignals.length >= 5, 'Sample MCD Death Certificate must match multiple signals');

// 3. Negative Case A: Random laptop photo specs
const laptopSpecsText = `
Lenovo ThinkPad X1 Carbon Gen 10
Processor: 12th Gen Intel Core i7-1260P
Memory: 16 GB LPDDR5-5200MHz
Storage: 512 GB SSD PCIe Gen 4
Display: 14.0 inch WUXGA IPS anti-glare
Graphics: Integrated Intel Iris Xe
Operating System: Windows 11 Pro 64
Battery: 57Wh with 65W Rapid Charge
Wireless: Intel Wi-Fi 6E AX211, Bluetooth 5.2
Ports: 2x Thunderbolt 4, 2x USB-A 3.2, HDMI 2.0b
`;

const resLaptop = validateDocument('DEATH_CERTIFICATE', { rawText: laptopSpecsText });
console.log('\n[Test 3] Negative Case A (Laptop specs):');
console.log('  Status:', resLaptop.status, '| Valid:', resLaptop.isValid);
assert(resLaptop.status === 'INVALID', 'Laptop specs must be INVALID');
assert(resLaptop.isValid === false, 'Laptop specs must have isValid = false');

// 4. Negative Case B: Blank / empty image text
const resBlank = validateDocument('DEATH_CERTIFICATE', { rawText: '    ' });
const resShort = validateDocument('DEATH_CERTIFICATE', { rawText: 'scan 1.jpg' });
console.log('\n[Test 4] Negative Case B (Blank/Empty text):');
console.log('  Blank Status:', resBlank.status, '| Short Status:', resShort.status);
assert(resBlank.status === 'INVALID', 'Blank text must be INVALID');
assert(resShort.status === 'INVALID', 'Very short text (<15 chars) must be INVALID');

// 5. Negative Case C: Tax Invoice
const invoiceText = `
TAX INVOICE
Invoice Number: INV-2024-8849
Invoice Date: 15-Jan-2024
Sold By: Cloud Retail India Private Limited
GSTIN: 07AABCC1234D1Z2
Billed To: Amit Verma
Item Description: Ergonomic Office Chair
Quantity: 1
Unit Price: Rs. 8,474.58
IGST (18%): Rs. 1,525.42
Total Amount Due: Rs. 10,000.00
This is a computer generated invoice and does not require signature.
`;

const resInvoice = validateDocument('DEATH_CERTIFICATE', { rawText: invoiceText });
console.log('\n[Test 5] Negative Case C (Invoice):');
console.log('  Status:', resInvoice.status, '| Valid:', resInvoice.isValid);
assert(resInvoice.status === 'INVALID', 'Invoice text must be INVALID for DEATH_CERTIFICATE');
assert(resInvoice.isValid === false, 'Invoice must not be valid');

// 6. Negative Case D: PAN card uploaded where Death Certificate is expected
const panCardText = `
INCOME TAX DEPARTMENT
GOVT. OF INDIA
PERMANENT ACCOUNT NUMBER
ABCDE1234F
Name: RAJESH GUPTA
Father's Name: SURESH GUPTA
Date of Birth: 12/08/1975
Signature
`;

const resPan = validateDocument('DEATH_CERTIFICATE', { rawText: panCardText });
console.log('\n[Test 6] Negative Case D (PAN card in Death Cert slot):');
console.log('  Status:', resPan.status, '| Valid:', resPan.isValid);
console.log('  Contradictory signals:', resPan.contradictorySignals);
assert(resPan.status === 'INVALID', 'PAN card in Death Cert slot must be INVALID');
assert(resPan.isValid === false, 'PAN card must not be valid in Death Cert slot');
assert(resPan.contradictorySignals.length > 0, 'Must identify contradictory PAN signals');

// 7. Ambiguous document (Needs Review)
const ambiguousNoticeText = `
MUNICIPAL CORPORATION OF DELHI
PUBLIC NOTICE CONCERNING REGISTRATION OF BIRTHS AND DEATHS
All residents are requested to register vital statistics at the local registrar office.
Issued by order of Municipal Authority.
`;

const resAmbiguous = validateDocument('DEATH_CERTIFICATE', { rawText: ambiguousNoticeText });
console.log('\n[Test 7] Ambiguous document:');
console.log('  Status:', resAmbiguous.status, '| Valid:', resAmbiguous.isValid);
console.log('  Matched signals:', resAmbiguous.matchedSignals);
assert(resAmbiguous.status === 'NEEDS_REVIEW', 'Ambiguous municipal notice must produce NEEDS_REVIEW');
assert(resAmbiguous.isValid === false, 'Ambiguous notice must not be valid');

// 8. Normalization variants (spaceless, lowercased, punctuation variations)
const variantsText = `
deathcertificate
dateofdeath: 15/04/2020
registrationno: 44819
dateofregistration: 20/04/2020
formno6
`;

const resVariants = validateDocument('DEATH_CERTIFICATE', { rawText: variantsText });
console.log('\n[Test 8] Normalization variants:');
console.log('  Status:', resVariants.status, '| Valid:', resVariants.isValid);
console.log('  Matched signals:', resVariants.matchedSignals);
assert(resVariants.status === 'VALID', 'Spaceless / OCR merged variants must be recognized as VALID');

// 9. Name in document matches given case information -> ACCEPT
const resNameMatch = validateDocument(
  'DEATH_CERTIFICATE',
  { rawText: sampleMcdDeathCertText, name: 'SHIV KUMAR' },
  { deceasedName: 'Shiv Kumar' }
);
console.log('\n[Test 9] Name in document matches given case info (SAME -> ACCEPT):');
console.log('  Status:', resNameMatch.status, '| Valid:', resNameMatch.isValid);
console.log('  Matched signals:', resNameMatch.matchedSignals.slice(0, 3));
assert(resNameMatch.status === 'VALID', 'Document with matching case name must be ACCEPTED (VALID)');
assert(resNameMatch.isValid === true, 'Matching name must be valid');

// 10. Name in document differs from given case information -> REJECT
const resNameMismatch = validateDocument(
  'DEATH_CERTIFICATE',
  { rawText: sampleMcdDeathCertText, name: 'SHIV KUMAR' },
  { deceasedName: 'Late Suresh Sharma' }
);
console.log('\n[Test 10] Name in document differs from given case info (NOT SAME -> REJECT):');
console.log('  Status:', resNameMismatch.status, '| Valid:', resNameMismatch.isValid);
console.log('  Reason:', resNameMismatch.reason);
console.log('  Contradictory signals:', resNameMismatch.contradictorySignals);
assert(resNameMismatch.status === 'INVALID', 'Document with mismatching case name must be REJECTED (INVALID)');
assert(resNameMismatch.isValid === false, 'Mismatching name must not be valid');

// 11. PAN Card matching claimant name -> ACCEPT
const resPanMatch = validateDocument(
  'PAN_CARD',
  { rawText: panCardText, name: 'RAJESH GUPTA', pan: 'ABCDE1234F' },
  { claimantName: 'Rajesh Gupta' }
);
console.log('\n[Test 11] PAN card name matches claimant (SAME -> ACCEPT):');
console.log('  Status:', resPanMatch.status, '| Valid:', resPanMatch.isValid);
assert(resPanMatch.status === 'VALID', 'PAN card matching claimant must be ACCEPTED (VALID)');

// 12. PAN Card differing from claimant name -> REJECT
const resPanMismatch = validateDocument(
  'PAN_CARD',
  { rawText: panCardText, name: 'RAJESH GUPTA', pan: 'ABCDE1234F' },
  { claimantName: 'Amit Verma' }
);
console.log('\n[Test 12] PAN card name differs from claimant (NOT SAME -> REJECT):');
console.log('  Status:', resPanMismatch.status, '| Valid:', resPanMismatch.isValid);
console.log('  Reason:', resPanMismatch.reason);
assert(resPanMismatch.status === 'INVALID', 'PAN card differing from claimant must be REJECTED (INVALID)');

console.log('\n==================================================');
console.log('🎉 ALL DOCUMENT VALIDATION REGRESSION TESTS PASSED!');
console.log('==================================================\n');
