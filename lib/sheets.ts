type SheetPayload = {
  sheet: 'requests' | 'bids';
  values: Record<string, unknown>;
};

type ReadSheetPayload = {
  sheet: 'requests' | 'bids';
  requestId?: string;
};

type SheetReadResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  rows: Record<string, unknown>[];
};

export const postToGoogleSheet = async (payload: SheetPayload) => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      skipped: true,
      reason: 'GOOGLE_SHEETS_WEBHOOK_URL is not configured',
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets webhook failed: ${response.status}`);
  }

  return {
    ok: true,
    skipped: false,
  };
};

export const readFromGoogleSheet = async ({ sheet, requestId }: ReadSheetPayload): Promise<SheetReadResult> => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      skipped: true,
      reason: 'GOOGLE_SHEETS_WEBHOOK_URL is not configured',
      rows: [],
    };
  }

  const url = new URL(webhookUrl);
  url.searchParams.set('sheet', sheet);
  url.searchParams.set('action', 'list');

  if (requestId) {
    url.searchParams.set('request_id', requestId);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Google Sheets read failed: ${response.status}`);
  }

  const result = await response.json();

  return {
    ok: Boolean(result.ok),
    skipped: false,
    rows: Array.isArray(result.rows) ? (result.rows as Record<string, unknown>[]) : [],
  };
};
