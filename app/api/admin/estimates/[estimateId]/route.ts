import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { deleteGoogleSheetRowById, updateGoogleSheetRow } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    estimateId: string;
  }>;
};

const optional = (value: unknown) => (value === undefined || value === null ? undefined : value);

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const { estimateId } = await context.params;
  const body = await request.json();
  const values: Record<string, unknown> = {};

  const map: [string, string, unknown][] = [
    ['contractor_id', '업체ID', optional(body.contractorId)],
    ['contractor_name', '업체명', optional(body.contractorName)],
    ['contractor_contact', '업체연락처', optional(body.contractorContact)],
    ['platform', '플랫폼', optional(body.platform)],
    ['bid_amount', '견적금액', optional(body.bidAmount)],
    ['bid_amount_display', '견적금액표시', optional(body.bidAmountDisplay)],
    ['work_scope', '작업범위', optional(body.workScope)],
    ['included_items', '포함항목', optional(body.includedItems)],
    ['excluded_items', '제외항목', optional(body.excludedItems)],
    ['extra_cost_conditions', '추가비용조건', optional(body.extraCostConditions)],
    ['visit_required', '방문필요여부', optional(body.visitRequired)],
    ['available_date', '가능일정', optional(body.availableDate)],
    ['bid_status', '견적상태', optional(body.bidStatus)],
    ['customer_visible', '고객노출여부', optional(body.customerVisible)],
    ['customer_display_name', '고객노출명', optional(body.customerDisplayName)],
    ['contractor_memo', '내부메모', optional(body.internalMemo)],
    ['partial_repair_available', '부분시공가능여부', optional(body.partialRepairAvailable)],
    ['estimated_work_time', '예상작업시간', optional(body.estimatedWorkTime)],
    ['admin_comment', '관리자코멘트', optional(body.adminComment)],
    ['recommended', '추천여부', optional(body.recommended === undefined ? undefined : body.recommended ? 'Y' : 'N')],
  ];

  map.forEach(([englishKey, koreanKey, value]) => {
    if (value !== undefined) {
      values[englishKey] = value;
      values[koreanKey] = value;
    }
  });

  if (Object.keys(values).length === 0) {
    return NextResponse.json({ ok: false, message: '수정할 값이 없습니다.' }, { status: 400 });
  }

  try {
    const result = await updateGoogleSheetRow({
      sheet: 'bids',
      id: estimateId,
      values,
    });

    if (body.customerVisible === 'Y' && body.requestId) {
      await updateGoogleSheetRow({
        sheet: 'requests',
        id: String(body.requestId),
        values: {
          status: 'QUOTE_READY',
          진행상태: 'QUOTE_READY',
        },
      });
    }

    return NextResponse.json({ ok: result.ok, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '견적 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const { estimateId } = await context.params;

  if (!estimateId) {
    return NextResponse.json({ ok: false, message: '삭제할 견적 ID가 없습니다.' }, { status: 400 });
  }

  try {
    const result = await deleteGoogleSheetRowById({ sheet: 'bids', id: estimateId });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.reason ?? '견적을 삭제하지 못했습니다.' },
        { status: result.skipped ? 503 : 500 },
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '견적 삭제에 실패했습니다.' }, { status: 500 });
  }
}
