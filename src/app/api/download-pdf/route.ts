import { NextRequest, NextResponse } from 'next/server';
import { generateClaimPacket } from '@/lib/pdf-generator';
import { Case } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let caseData: Case | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      caseData = body.caseData || body;
    } else if (contentType.includes('form') || contentType.includes('urlencoded')) {
      const formData = await req.formData();
      const raw = formData.get('caseData');
      if (raw && typeof raw === 'string') {
        caseData = JSON.parse(raw);
      }
    }

    if (!caseData || !caseData.id) {
      return NextResponse.json({ error: 'Invalid case data provided' }, { status: 400 });
    }

    const pdfBytes = await generateClaimPacket(caseData);
    const safeId = caseData.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `AdhikarSetu-${safeId}-ClaimPacket.pdf`;
    const isInline = req.nextUrl.searchParams.get('inline') === '1';
    const dispositionType = isInline ? 'inline' : 'attachment';

    // Return real PDF binary with strict attachment header and correct Content-Type
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${dispositionType}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': pdfBytes.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[API /api/download-pdf error]', error);
    const message = error instanceof Error ? error.message : 'Failed to generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
