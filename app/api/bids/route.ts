import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { demoBids, normalizeBid } from '@/lib/petroom-data';
import { addMemoryBid, petroomMemoryStore } from '@/lib/petroom-memory';
import { postToGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const requestId = request.nextUrl.searchParams.get('requestId') ?? '';
  const customerVisibleOnly = request.nextUrl.searchParams.get('customerVisible') === 'Y';

  try {
    const sheetResult = await readFromGoogleSheet({
      sheet: 'bids',
    });
    const bids = sheetResult.rows
      .map((row) => normalizeBid(row))
      .filter((row) => !requestId || row.request_id === requestId)
      .filter((row) => !customerVisibleOnly || row.customer_visible)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    const memoryBids = petroomMemoryStore.bids
      .filter((bid) => !requestId || bid.request_id === requestId)
      .filter((bid) => !customerVisibleOnly || bid.customer_visible);
    const fallbackBids = sheetResult.skipped
      ? demoBids.filter((bid) => !requestId || bid.request_id === requestId)
      : [];

    return NextResponse.json({
      ok: true,
      source: sheetResult.skipped ? 'demo' : 'google_sheets',
      bids: [...memoryBids, ...fallbackBids, ...bids],
      sheetResult,
    });
  } catch (error) {
    console.error(error);

    const memoryBids = petroomMemoryStore.bids
      .filter((bid) => !requestId || bid.request_id === requestId)
      .filter((bid) => !customerVisibleOnly || bid.customer_visible);
    const fallbackBids = demoBids
      .filter((bid) => !requestId || bid.request_id === requestId)
      .filter((bid) => !customerVisibleOnly || bid.customer_visible);

    return NextResponse.json({
      ok: true,
      source: 'demo',
      bids: [...memoryBids, ...fallbackBids],
      sheetResult: {
        ok: false,
        error: getErrorMessage(error),
        message: 'Google Sheets 읽기 설정이 아직 준비되지 않아 데모 견적을 표시합니다.',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const bidId = makeId('bid');
    const submittedAt = new Date().toISOString();
    const amountText = String(body.bidAmount ?? '').trim();

    const row = {
      bid_id: bidId,
      request_id: body.requestId ?? '',
      submitted_at: submittedAt,
      contractor_id: body.contractorId ?? '',
      contractor_name: body.contractorName ?? '',
      contractor_contact: body.contractorContact ?? '',
      contractor_region: body.contractorRegion ?? '',
      platform: body.platform ?? 'PET ROOM',
      is_verified: Boolean(body.isVerified),
      rating: Number(body.rating ?? 0),
      review_count: Number(body.reviewCount ?? 0),
      completed_count: Number(body.completedCount ?? 0),
      bid_amount: amountText,
      bid_amount_display: body.bidAmountDisplay ?? (amountText ? `${Number(amountText).toLocaleString('ko-KR')}원` : ''),
      work_scope: body.workScope ?? '',
      included_items: body.includedItems ?? '',
      excluded_items: body.excludedItems ?? '',
      extra_cost_conditions: body.extraCostConditions ?? '',
      available_date: body.availableDate ?? '',
      visit_required: body.visitRequired ?? '',
      above_range_reason: body.aboveRangeReason ?? '',
      contractor_memo: body.contractorMemo ?? '',
      bid_status: body.bidStatus ?? '검수대기',
      customer_visible: body.customerVisible ?? 'N',
      customer_display_name: body.customerDisplayName ?? '',
    };

    const sheetResult = await postToGoogleSheet({
      sheet: 'bids',
      values: row,
    });

    addMemoryBid(row);

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
