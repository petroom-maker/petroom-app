import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { normalizeBid } from '@/lib/petroom-data';
import { postToGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';

const formatAmount = (value: string) => {
  const amount = Number(value.replace(/\D/g, ''));
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString('ko-KR')}원` : value;
};

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const requestId = request.nextUrl.searchParams.get('requestId') ?? '';

  try {
    const result = await readFromGoogleSheet({ sheet: 'bids', requestId });
    return NextResponse.json({
      ok: true,
      estimates: result.rows.map((row) => normalizeBid(row)),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '견적 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const body = await request.json();
  const requestId = String(body.requestId ?? '').trim();
  const bidAmount = String(body.bidAmount ?? '').trim();

  if (!requestId || !bidAmount) {
    return NextResponse.json({ ok: false, message: '신청ID와 견적금액은 필수입니다.' }, { status: 400 });
  }

  try {
    const result = await postToGoogleSheet({
      sheet: 'bids',
      values: {
        request_id: requestId,
        contractor_id: body.contractorId ?? '',
        contractor_name: body.contractorName ?? '',
        contractor_contact: body.contractorContact ?? '',
        platform: body.platform ?? '관리자 수기입력',
        bid_amount: bidAmount,
        bid_amount_display: body.bidAmountDisplay ?? formatAmount(bidAmount),
        work_scope: body.workScope ?? '',
        included_items: body.includedItems ?? '',
        excluded_items: body.excludedItems ?? '',
        extra_cost_conditions: body.extraCostConditions ?? '',
        visit_required: body.visitRequired ?? '',
        available_date: body.availableDate ?? '',
        bid_status: body.bidStatus ?? '검수대기',
        customer_visible: body.customerVisible ?? 'N',
        customer_display_name: body.customerDisplayName ?? '',
        contractor_memo: body.internalMemo ?? '',
        partial_repair_available: body.partialRepairAvailable ?? '',
        estimated_work_time: body.estimatedWorkTime ?? '',
        admin_comment: body.adminComment ?? '',
        recommended: body.recommended ? 'Y' : 'N',
      },
    });

    return NextResponse.json({ ok: result.ok, estimateId: result.bidId, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '견적 저장에 실패했습니다.' }, { status: 500 });
  }
}
