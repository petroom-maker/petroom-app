import { NextRequest, NextResponse } from 'next/server';
import { getContractorByAccess, unauthorized } from '@/lib/petroom-access';
import { normalizeBid } from '@/lib/petroom-data';
import { readFromGoogleSheet, updateGoogleSheetRow } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    estimateId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const body = await request.json();
  const contractor = await getContractorByAccess(String(body.contractorId ?? ''), String(body.token ?? ''));

  if (!contractor) {
    return unauthorized('업체 전용 링크가 올바르지 않습니다.');
  }

  const { estimateId } = await context.params;

  try {
    const bidsResult = await readFromGoogleSheet({ sheet: 'bids' });
    const existing = bidsResult.rows
      .map((row) => normalizeBid(row))
      .find((item) => item.bid_id === estimateId && item.contractor_id === contractor.contractor_id);

    if (!existing) {
      return NextResponse.json({ ok: false, message: '수정할 견적을 찾을 수 없습니다.' }, { status: 404 });
    }

    const values: Record<string, unknown> = {
      bid_status: existing.customer_visible ? '재검수필요' : '검수대기',
      견적상태: existing.customer_visible ? '재검수필요' : '검수대기',
      customer_visible: 'N',
      고객노출여부: 'N',
    };

    const map: [string, string, string][] = [
      ['bidAmount', 'bid_amount', '견적금액'],
      ['bidAmountDisplay', 'bid_amount_display', '견적금액표시'],
      ['workScope', 'work_scope', '작업범위'],
      ['includedItems', 'included_items', '포함항목'],
      ['excludedItems', 'excluded_items', '제외항목'],
      ['extraCostConditions', 'extra_cost_conditions', '추가비용조건'],
      ['visitRequired', 'visit_required', '방문필요여부'],
      ['partialRepairAvailable', 'partial_repair_available', '부분시공가능여부'],
      ['estimatedWorkTime', 'estimated_work_time', '예상작업시간'],
      ['availableDate', 'available_date', '가능일정'],
      ['contractorMemo', 'contractor_memo', '내부메모'],
    ];

    map.forEach(([bodyKey, englishKey, koreanKey]) => {
      if (body[bodyKey] !== undefined) {
        values[englishKey] = body[bodyKey];
        values[koreanKey] = body[bodyKey];
      }
    });

    const result = await updateGoogleSheetRow({ sheet: 'bids', id: estimateId, values });
    return NextResponse.json({ ok: result.ok, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '견적 수정에 실패했습니다.' }, { status: 500 });
  }
}
