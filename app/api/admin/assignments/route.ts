import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { postToGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';
import { normalizeAssignment } from '@/lib/petroom-data';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const requestId = request.nextUrl.searchParams.get('requestId') ?? '';

  try {
    const result = await readFromGoogleSheet({ sheet: 'assignments', requestId });
    return NextResponse.json({
      ok: true,
      assignments: result.rows.map((row) => normalizeAssignment(row)),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '업체 배정 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const body = await request.json();
  const requestId = String(body.requestId ?? '').trim();
  const contractorId = String(body.contractorId ?? '').trim();

  if (!requestId || !contractorId) {
    return NextResponse.json({ ok: false, message: '신청ID와 업체ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const result = await postToGoogleSheet({
      sheet: 'assignments',
      values: {
        request_id: requestId,
        contractor_id: contractorId,
        assignment_status: body.assignmentStatus ?? '배정완료',
        request_memo: body.requestMemo ?? '',
        contractor_checked: 'N',
        estimate_submitted: 'N',
        internal_memo: body.internalMemo ?? '',
      },
    });

    return NextResponse.json({ ok: result.ok, assignmentId: result.assignmentId, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '업체 배정 저장에 실패했습니다.' }, { status: 500 });
  }
}
