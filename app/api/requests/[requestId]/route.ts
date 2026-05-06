import { NextRequest, NextResponse } from 'next/server';
import { demoRequests, normalizeRequest } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

export async function GET(_request: NextRequest, context: RouteContext) {
  const { requestId } = await context.params;
  let sheetError = '';

  try {
    const sheetResult = await readFromGoogleSheet({ sheet: 'requests' });
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
    sheetError = getErrorMessage(error);
  }

  const demoRequest = demoRequests.find((row) => row.request_id === requestId);

  if (demoRequest) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      request: demoRequest,
      sheetResult: {
        ok: false,
        error: sheetError,
      },
    });
  }

  return NextResponse.json(
    {
      ok: false,
      message: '요청서를 찾을 수 없습니다.',
      sheetResult: {
        ok: false,
        error: sheetError,
      },
    },
    { status: 404 },
  );
}
