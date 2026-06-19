import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import {
  normalizeAssignment,
  normalizeBid,
  normalizeCustomerAction,
  normalizeRequest,
} from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const { requestId } = await context.params;

  try {
    const [requestsResult, imagesResult, assignmentsResult, bidsResult, actionsResult] = await Promise.all([
      readFromGoogleSheet({ sheet: 'requests' }),
      readFromGoogleSheet({ sheet: 'images', requestId }),
      readFromGoogleSheet({ sheet: 'assignments', requestId }),
      readFromGoogleSheet({ sheet: 'bids', requestId }),
      readFromGoogleSheet({ sheet: 'customer_actions', requestId }),
    ]);
    const rawRequest = requestsResult.rows.find((row) => String(row.request_id || row['신청ID'] || '') === requestId);
    const requestRecord = rawRequest ? normalizeRequest(rawRequest) : null;

    if (!requestRecord) {
      return NextResponse.json({ ok: false, message: '신청건을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      request: requestRecord,
      rawRequest,
      images: imagesResult.rows,
      assignments: assignmentsResult.rows.map((row) => normalizeAssignment(row)),
      estimates: bidsResult.rows.map((row) => normalizeBid(row)),
      customerActions: actionsResult.rows
        .map((row) => normalizeCustomerAction(row))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message: '신청 상세를 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
