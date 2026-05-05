import { NextRequest, NextResponse } from 'next/server';
import { postToGoogleSheet } from '@/lib/sheets';

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bidId = makeId('bid');
    const submittedAt = new Date().toISOString();

    const row = {
      bid_id: bidId,
      request_id: body.requestId ?? '',
      submitted_at: submittedAt,
      contractor_name: body.contractorName ?? '',
      contractor_contact: body.contractorContact ?? '',
      bid_amount: body.bidAmount ?? '',
      work_scope: body.workScope ?? '',
      included_items: body.includedItems ?? '',
      excluded_items: body.excludedItems ?? '',
      extra_cost_conditions: body.extraCostConditions ?? '',
      available_date: body.availableDate ?? '',
      visit_required: body.visitRequired ?? '',
      above_range_reason: body.aboveRangeReason ?? '',
      bid_status: '제출',
    };

    const sheetResult = await postToGoogleSheet({
      sheet: 'bids',
      values: row,
    });

    return NextResponse.json({
      ok: true,
      bidId,
      sheetResult,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: '업체 견적 저장 중 문제가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
