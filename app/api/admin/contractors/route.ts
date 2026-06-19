import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { normalizeContractor } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  try {
    const result = await readFromGoogleSheet({ sheet: 'contractors' });
    const contractors = result.rows.map((row) => normalizeContractor(row)).filter((row) => row.contractor_id);

    return NextResponse.json({
      ok: true,
      contractors,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: '업체 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}
