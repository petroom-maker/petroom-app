import { NextRequest, NextResponse } from 'next/server';
import { normalizeContractor, type ContractorRecord } from '@/lib/petroom-data';
import { readFromGoogleSheet } from '@/lib/sheets';

export const getAdminToken = (request: NextRequest) =>
  request.headers.get('x-admin-token') || request.nextUrl.searchParams.get('adminToken') || '';

export const isAdminAuthorized = (request: NextRequest) => {
  const configuredToken = process.env.ADMIN_ACCESS_TOKEN;

  if (!configuredToken) {
    return true;
  }

  return getAdminToken(request) === configuredToken;
};

export const unauthorized = (message = '접근 권한이 없습니다.') =>
  NextResponse.json({ ok: false, message }, { status: 401 });

export const getContractorByAccess = async (
  contractorId: string,
  token: string,
): Promise<ContractorRecord | null> => {
  if (!contractorId || !token) {
    return null;
  }

  const result = await readFromGoogleSheet({ sheet: 'contractors' });
  const contractor = result.rows
    .map((row) => normalizeContractor(row))
    .find((item) => item.contractor_id === contractorId);

  if (!contractor) {
    return null;
  }

  const active = !contractor.active || contractor.active.toUpperCase() === 'Y';

  if (!active || contractor.access_token !== token) {
    return null;
  }

  return contractor;
};
