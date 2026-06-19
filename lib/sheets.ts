export type SheetAlias =
  | 'requests'
  | 'bids'
  | 'images'
  | 'contractors'
  | 'statuses'
  | 'notification_logs'
  | 'assignments'
  | 'customer_actions';

type SheetPayload = {
  sheet: SheetAlias;
  values: Record<string, unknown>;
  action?: string;
  id?: string;
  requestId?: string;
  bidId?: string;
  assignmentId?: string;
};

type ReadSheetPayload = {
  sheet: SheetAlias;
  requestId?: string;
};

type DeleteSheetPayload = {
  sheet: SheetAlias;
  requestId: string;
};

type UpdateSheetPayload = {
  sheet: SheetAlias;
  id: string;
  values: Record<string, unknown>;
};

type SheetReadResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  rows: Record<string, unknown>[];
};

type SheetDeleteResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  deleted: number;
};

type SheetPostResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  requestId?: string;
  bidId?: string;
  [key: string]: unknown;
};

export const postToGoogleSheet = async (payload: SheetPayload): Promise<SheetPostResult> => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const serverSecret = process.env.GOOGLE_SHEETS_SERVER_SECRET;

  if (!webhookUrl || !serverSecret) {
    return {
      ok: false,
      skipped: true,
      reason: 'Google Sheets server connection is not configured',
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      server_secret: serverSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets webhook failed: ${response.status}`);
  }

  const text = await response.text();
  let result: Record<string, unknown> = {};

  if (text.trim()) {
    try {
      result = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(`Google Sheets webhook returned non-JSON: ${text.slice(0, 160)}`);
    }
  }

  return {
    ok: result.ok !== false,
    skipped: false,
    ...result,
  };
};

export const readFromGoogleSheet = async ({ sheet, requestId }: ReadSheetPayload): Promise<SheetReadResult> => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const serverSecret = process.env.GOOGLE_SHEETS_SERVER_SECRET;

  if (!webhookUrl || !serverSecret) {
    return {
      ok: false,
      skipped: true,
      reason: 'Google Sheets server connection is not configured',
      rows: [],
    };
  }

  const url = new URL(webhookUrl);
  url.searchParams.set('sheet', sheet);
  url.searchParams.set('action', 'list');
  url.searchParams.set('server_secret', serverSecret);

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

  const text = await response.text();
  let result: { ok?: boolean; rows?: Record<string, unknown>[] };

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Google Sheets read returned non-JSON: ${text.slice(0, 160)}`);
  }

  return {
    ok: Boolean(result.ok),
    skipped: false,
    rows: Array.isArray(result.rows) ? (result.rows as Record<string, unknown>[]) : [],
  };
};

export const deleteFromGoogleSheet = async ({ sheet, requestId }: DeleteSheetPayload): Promise<SheetDeleteResult> => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const serverSecret = process.env.GOOGLE_SHEETS_SERVER_SECRET;

  if (!webhookUrl || !serverSecret) {
    return {
      ok: false,
      skipped: true,
      reason: 'Google Sheets server connection is not configured',
      deleted: 0,
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      action: 'delete',
      sheet,
      request_id: requestId,
      server_secret: serverSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets webhook failed: ${response.status}`);
  }

  const text = await response.text();
  let result: { ok?: boolean; deleted?: number; message?: string };

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Google Sheets delete returned non-JSON: ${text.slice(0, 160)}`);
  }

  return {
    ok: Boolean(result.ok),
    skipped: false,
    reason: result.message,
    deleted: result.deleted ?? 0,
  };
};

export const updateGoogleSheetRow = async ({
  sheet,
  id,
  values,
}: UpdateSheetPayload): Promise<SheetPostResult> => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const serverSecret = process.env.GOOGLE_SHEETS_SERVER_SECRET;

  if (!webhookUrl || !serverSecret) {
    return {
      ok: false,
      skipped: true,
      reason: 'Google Sheets server connection is not configured',
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      sheet,
      id,
      values,
      server_secret: serverSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets webhook failed: ${response.status}`);
  }

  const text = await response.text();
  let result: Record<string, unknown> = {};

  if (text.trim()) {
    try {
      result = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(`Google Sheets update returned non-JSON: ${text.slice(0, 160)}`);
    }
  }

  return {
    ok: result.ok !== false,
    skipped: false,
    ...result,
  };
};
