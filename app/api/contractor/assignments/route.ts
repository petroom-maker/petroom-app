import { NextRequest, NextResponse } from 'next/server';
import { getContractorByAccess, unauthorized } from '@/lib/petroom-access';
import { normalizeAssignment, normalizeRequest } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  const contractorId = request.nextUrl.searchParams.get('contractorId') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const contractor = await getContractorByAccess(contractorId, token);

  if (!contractor) {
    return unauthorized('업체 전용 링크가 올바르지 않습니다.');
  }

  try {
    const [assignmentsResult, requestsResult] = await Promise.all([
      readFromGoogleSheet({ sheet: 'assignments' }),
      readFromGoogleSheet({ sheet: 'requests' }),
    ]);
    const requests = requestsResult.rows.map((row) => normalizeRequest(row));
    const assignments = assignmentsResult.rows
      .map((row) => normalizeAssignment(row))
      .filter((item) => item.contractor_id === contractor.contractor_id)
      .map((assignment) => ({
        ...assignment,
        request: requests.find((item) => item.request_id === assignment.request_id) ?? null,
      }));

    return NextResponse.json({
      ok: true,
      contractor,
      assignments,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '배정 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}
