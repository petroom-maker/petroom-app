import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { postToGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

const allowedActions = {
  CONNECT_REQUESTED: '이 업체로 연결 요청하기',
  CONSULT_REQUESTED: '추가 상담 요청하기',
  DECIDED_LATER: '아직 결정하지 않기',
} as const;

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
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    Boolean(provided) &&
    Boolean(expected) &&
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { requestId } = await context.params;
  const body = await request.json();
  const customerToken = String(body.token ?? '');
  const actionType = String(body.actionType ?? '') as keyof typeof allowedActions;
  const selectedQuoteId = String(body.selectedQuoteId ?? '');

  if (!allowedActions[actionType]) {
    return NextResponse.json({ ok: false, message: '선택한 요청을 확인해주세요.' }, { status: 400 });
  }

  if (actionType === 'CONNECT_REQUESTED' && !selectedQuoteId) {
    return NextResponse.json({ ok: false, message: '연결을 원하는 업체 견적을 선택해주세요.' }, { status: 400 });
  }

  try {
    const requestsResult = await readFromGoogleSheet({ sheet: 'requests' });
    const rawRequest = requestsResult.rows.find(
      (row) => getRawValue(row, 'request_id', '신청ID') === requestId,
    );
    const expectedToken = rawRequest ? getRawValue(rawRequest, 'customer_token', '고객접근토큰') : '';

    if (!rawRequest || !tokenMatches(customerToken, expectedToken)) {
      return NextResponse.json(
        { ok: false, message: '견적 결과 링크 인증에 실패했습니다.' },
        { status: 403 },
      );
    }

    const result = await postToGoogleSheet({
      sheet: 'customer_actions',
      values: {
        request_id: requestId,
        customer_token: customerToken,
        selected_quote_id: selectedQuoteId,
        action_type: actionType,
        action_label: allowedActions[actionType],
        user_agent: request.headers.get('user-agent') ?? '',
        memo: String(body.memo ?? ''),
      },
    });

    if (!result.ok) {
      throw new Error(typeof result.message === 'string' ? result.message : '고객 요청 저장 실패');
    }

    return NextResponse.json({
      ok: true,
      actionId: result.actionId,
      actionType,
    });
  } catch (error) {
    console.error('[PETROOM_CUSTOMER_ACTION_FAILED]', error);
    return NextResponse.json(
      { ok: false, message: '요청을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
