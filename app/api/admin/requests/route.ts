import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { normalizeRequest } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  try {
    const sheetResult = await readFromGoogleSheet({ sheet: 'requests' });
    const requests = sheetResult.rows
      .map((row) => normalizeRequest(row))
      .filter((row) => row.request_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      ok: true,
      requests,
      rawRows: sheetResult.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message: '신청 목록을 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
