import { NextRequest, NextResponse } from 'next/server';
import { demoRequests, normalizeRequest } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { requestId } = await context.params;

  try {
    const sheetResult = await readFromGoogleSheet({ sheet: 'requests', requestId });
    const requests = sheetResult.rows.map((row) => normalizeRequest(row));
    const requestRecord = requests.find((row) => row.request_id === requestId);

    if (requestRecord) {
      return NextResponse.json({
        ok: true,
        source: 'google_sheets',
        request: requestRecord,
        sheetResult,
      });
    }
  } catch (error) {
    console.error(error);
  }

  const demoRequest = demoRequests.find((row) => row.request_id === requestId);

  if (demoRequest) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      request: demoRequest,
    });
  }

  return NextResponse.json(
    {
      ok: false,
      message: '요청서를 찾을 수 없습니다.',
    },
    { status: 404 },
  );
}
