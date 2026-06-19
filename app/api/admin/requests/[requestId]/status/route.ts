import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { updateGoogleSheetRow } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const { requestId } = await context.params;
  const body = await request.json();
  const status = String(body.status ?? '').trim();

  if (!status) {
    return NextResponse.json({ ok: false, message: '변경할 상태가 없습니다.' }, { status: 400 });
  }

  try {
    const result = await updateGoogleSheetRow({
      sheet: 'requests',
      id: requestId,
      values: {
        status,
        진행상태: status,
        admin_memo: body.adminMemo ?? '',
        담당메모: body.adminMemo ?? '',
        result_notice_status: body.resultNoticeStatus,
        결과안내상태: body.resultNoticeStatus,
        result_notice_at: body.resultNoticeAt,
        결과안내일시: body.resultNoticeAt,
      },
    });

    return NextResponse.json({ ok: result.ok, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '진행상태 변경에 실패했습니다.' }, { status: 500 });
  }
}
