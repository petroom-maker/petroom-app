import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import {
  normalizeBid,
  normalizeCustomerAction,
  normalizeRequest,
} from '@/lib/petroom-data';
import { deleteFromGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

const getRawValue = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return '';
};

const tokenMatches = (provided: string, expected: string) => {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
};

const isYes = (value: unknown) => {
  const text = String(value ?? '').toUpperCase();
  return text === 'Y' || text === 'TRUE' || text === '1';
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { requestId } = await context.params;
  const providedToken = request.nextUrl.searchParams.get('token') ?? '';

  try {
    const requestsResult = await readFromGoogleSheet({ sheet: 'requests' });
    const rawRequest = requestsResult.rows.find(
      (row) => getRawValue(row, 'request_id', '신청ID', '요청ID') === requestId,
    );
    const expectedToken = rawRequest ? getRawValue(rawRequest, 'customer_token', '고객접근토큰') : '';

    if (!rawRequest || !tokenMatches(providedToken, expectedToken)) {
      return NextResponse.json(
        {
          ok: false,
          message: '견적 결과를 확인할 수 없습니다. 전달받은 링크를 다시 확인해주세요.',
        },
        { status: 403 },
      );
    }

    const [bidsResult, imagesResult, actionsResult] = await Promise.all([
      readFromGoogleSheet({ sheet: 'bids', requestId }),
      readFromGoogleSheet({ sheet: 'images', requestId }),
      readFromGoogleSheet({ sheet: 'customer_actions', requestId }),
    ]);

    const requestRecord = normalizeRequest(rawRequest);
    const bids = bidsResult.rows
      .map((row) => normalizeBid(row))
      .filter((bid) => bid.customer_visible)
      .map((bid) => ({
        bid_id: bid.bid_id,
        request_id: bid.request_id,
        submitted_at: bid.submitted_at,
        customer_display_name: bid.customer_display_name || '업체',
        bid_amount: bid.bid_amount,
        bid_amount_display: bid.bid_amount_display,
        work_scope: bid.work_scope,
        included_items: bid.included_items,
        excluded_items: bid.excluded_items,
        extra_cost_conditions: bid.extra_cost_conditions,
        available_date: bid.available_date,
        visit_required: bid.visit_required,
        partial_repair_available: bid.partial_repair_available,
        estimated_work_time: bid.estimated_work_time,
        admin_comment: bid.admin_comment,
        recommended: Boolean(bid.recommended),
      }));

    const images = imagesResult.rows
      .filter((row) => isYes(row.customer_visible ?? row['고객노출여부']))
      .map((row) => ({
        image_id: getRawValue(row, 'image_id', '이미지ID'),
        image_type: getRawValue(row, 'image_type', '이미지구분'),
        url: getRawValue(row, 'drive_url', 'DriveURL'),
        thumbnail_url: getRawValue(row, 'thumbnail_url', '썸네일URL'),
        sort_order: Number(row.sort_order ?? row['정렬순서'] ?? 0),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    const actions = actionsResult.rows
      .map((row) => normalizeCustomerAction(row))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      ok: true,
      request: {
        ...requestRecord,
        user_contact: '',
        customer_result_url: undefined,
      },
      bids,
      images,
      lastAction: actions[0] ?? null,
    });
  } catch (error) {
    console.error('[PETROOM_CUSTOMER_RESULT_FAILED]', error);
    return NextResponse.json(
      {
        ok: false,
        message: '견적 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  const { requestId } = await context.params;

  try {
    const aliases = ['requests', 'bids', 'images', 'assignments', 'customer_actions'] as const;
    const results = await Promise.all(
      aliases.map((sheet) => deleteFromGoogleSheet({ sheet, requestId })),
    );

    return NextResponse.json({
      ok: results.every((result) => result.ok),
      results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message: '삭제 중 문제가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
