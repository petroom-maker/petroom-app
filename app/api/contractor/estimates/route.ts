import { NextRequest, NextResponse } from 'next/server';
import { getContractorByAccess, unauthorized } from '@/lib/petroom-access';
import { normalizeAssignment } from '@/lib/petroom-data';
import { postToGoogleSheet, readFromGoogleSheet, updateGoogleSheetRow } from '@/lib/sheets';

const formatAmount = (value: string) => {
  const amount = Number(value.replace(/\D/g, ''));
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString('ko-KR')}원` : value;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contractor = await getContractorByAccess(String(body.contractorId ?? ''), String(body.token ?? ''));

  if (!contractor) {
    return unauthorized('업체 전용 링크가 올바르지 않습니다.');
  }

  const requestId = String(body.requestId ?? '').trim();
  const bidAmount = String(body.bidAmount ?? '').trim();

  if (!requestId || !bidAmount) {
    return NextResponse.json({ ok: false, message: '신청ID와 견적금액은 필수입니다.' }, { status: 400 });
  }

  try {
    const assignmentsResult = await readFromGoogleSheet({ sheet: 'assignments', requestId });
    const assignment = assignmentsResult.rows
      .map((row) => normalizeAssignment(row))
      .find((item) => item.contractor_id === contractor.contractor_id);

    if (!assignment) {
      return unauthorized('이 업체에 배정된 신청건이 아닙니다.');
    }

    const result = await postToGoogleSheet({
      sheet: 'bids',
      values: {
        request_id: requestId,
        contractor_id: contractor.contractor_id,
        contractor_name: contractor.contractor_name,
        contractor_contact: contractor.contractor_contact,
        platform: '업체 포털',
        bid_amount: bidAmount,
        bid_amount_display: body.bidAmountDisplay ?? formatAmount(bidAmount),
        work_scope: body.workScope ?? '',
        included_items: body.includedItems ?? '',
        excluded_items: body.excludedItems ?? '',
        extra_cost_conditions: body.extraCostConditions ?? '',
        visit_required: body.visitRequired ?? '',
        available_date: body.availableDate ?? '',
        bid_status: '검수대기',
        customer_visible: 'N',
        customer_display_name: contractor.customer_display_name,
        contractor_memo: body.contractorMemo ?? '',
        partial_repair_available: body.partialRepairAvailable ?? '',
        estimated_work_time: body.estimatedWorkTime ?? '',
      },
    });

    if (assignment.assignment_id) {
      await updateGoogleSheetRow({
        sheet: 'assignments',
        id: assignment.assignment_id,
        values: {
          assignment_status: '견적제출완료',
          배정상태: '견적제출완료',
          estimate_submitted: 'Y',
          견적제출여부: 'Y',
        },
      });
    }

    return NextResponse.json({ ok: result.ok, estimateId: result.bidId, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '견적 제출에 실패했습니다.' }, { status: 500 });
  }
}
