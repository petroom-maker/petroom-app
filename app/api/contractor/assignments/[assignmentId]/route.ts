import { NextRequest, NextResponse } from 'next/server';
import { getContractorByAccess, unauthorized } from '@/lib/petroom-access';
import { normalizeAssignment, normalizeBid, normalizeRequest } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const contractorId = request.nextUrl.searchParams.get('contractorId') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const contractor = await getContractorByAccess(contractorId, token);

  if (!contractor) {
    return unauthorized('업체 전용 링크가 올바르지 않습니다.');
  }

  const { assignmentId } = await context.params;

  try {
    const [assignmentsResult, requestsResult, imagesResult, bidsResult] = await Promise.all([
      readFromGoogleSheet({ sheet: 'assignments' }),
      readFromGoogleSheet({ sheet: 'requests' }),
      readFromGoogleSheet({ sheet: 'images' }),
      readFromGoogleSheet({ sheet: 'bids' }),
    ]);
    const assignment = assignmentsResult.rows
      .map((row) => normalizeAssignment(row))
      .find((item) => item.assignment_id === assignmentId && item.contractor_id === contractor.contractor_id);

    if (!assignment) {
      return NextResponse.json({ ok: false, message: '배정건을 찾을 수 없습니다.' }, { status: 404 });
    }

    const requestRecord =
      requestsResult.rows
        .map((row) => normalizeRequest(row))
        .find((item) => item.request_id === assignment.request_id) ?? null;
    const images = imagesResult.rows.filter((row) => String(row.request_id || row['신청ID'] || '') === assignment.request_id);
    const estimates = bidsResult.rows
      .map((row) => normalizeBid(row))
      .filter((item) => item.request_id === assignment.request_id && item.contractor_id === contractor.contractor_id);

    return NextResponse.json({
      ok: true,
      contractor,
      assignment,
      request: requestRecord,
      images,
      estimates,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '배정 상세를 불러오지 못했습니다.' }, { status: 500 });
  }
}
