import { NextRequest, NextResponse } from 'next/server';
import { normalizeBid } from '@/lib/petroom-data';
import { postToGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('requestId') ?? '';
    const sheetResult = await readFromGoogleSheet({
      sheet: 'bids',
      requestId,
    });
    const bids = sheetResult.rows
      .map((row) => normalizeBid(row))
      .filter((row) => !requestId || row.request_id === requestId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    return NextResponse.json({
      ok: true,
      source: 'google_sheets',
      bids,
      sheetResult,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      ok: true,
      source: 'demo',
      bids: [],
      sheetResult: {
        ok: false,
        message: 'Google Sheets 읽기 설정이 아직 준비되지 않아 입찰 목록을 비워둡니다.',
      },
    });
  }
}

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
