type SheetPayload = {
  sheet: 'requests' | 'bids';
  values: Record<string, unknown>;
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
