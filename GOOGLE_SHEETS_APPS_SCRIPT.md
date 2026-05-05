# PET ROOM Google Sheets 연동 방법

이 앱은 `GOOGLE_SHEETS_WEBHOOK_URL` 환경변수가 있으면 유저 견적 요청과 업체 견적을 Google Sheets에 저장한다.

## 1. Google Sheet 탭 만들기

아래 탭 2개를 만든다.

- `requests`
- `bids`

## 2. Apps Script 만들기

Google Sheet에서 `확장 프로그램 > Apps Script`를 열고 아래 코드를 붙여 넣는다.

```javascript
const SHEET_COLUMNS = {
  requests: [
    'request_id',
    'created_at',
    'user_name',
    'user_contact',
    'contact_preference',
    'region',
    'damage_type',
    'damage_scope',
    'housing_type',
    'room_type',
    'area_text',
    'material_match',
    'damage_position',
    'repair_intent',
    'furniture_level',
    'schedule',
    'user_memo',
    'image_count',
    'estimated_min',
    'estimated_max',
    'confidence',
    'confidence_label',
    'status',
  ],
  bids: [
    'bid_id',
    'request_id',
    'submitted_at',
    'contractor_name',
    'contractor_contact',
    'bid_amount',
    'work_scope',
    'included_items',
    'excluded_items',
    'extra_cost_conditions',
    'available_date',
    'visit_required',
    'above_range_reason',
    'bid_status',
  ],
};

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const sheetName = payload.sheet;
  const values = payload.values || {};
  const columns = SHEET_COLUMNS[sheetName];

  if (!columns) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: 'Unknown sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: 'Sheet not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(columns);
  }

  sheet.appendRow(columns.map((column) => values[column] ?? ''));

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. 웹앱으로 배포

1. Apps Script 우측 상단 `배포 > 새 배포`
2. 유형: `웹 앱`
3. 실행 사용자: `나`
4. 액세스 권한: 초기 테스트는 `모든 사용자`
5. 배포 후 생성된 Web App URL을 복사

## 4. Vercel 환경변수 등록

Vercel 프로젝트 설정에서 환경변수를 추가한다.

```bash
GOOGLE_SHEETS_WEBHOOK_URL=복사한_Apps_Script_Web_App_URL
```

로컬 테스트는 `.env.local` 파일을 만들고 같은 값을 넣는다.

## 5. 현재 저장되는 데이터

- `/api/requests`: 유저 요청, 예상 견적 범위, 신뢰도 저장
- `/api/bids`: 업체 견적, 작업 범위, 추가비 조건 저장

사진은 현재 Google Sheet에 직접 저장하지 않고 `image_count`만 저장한다.
운영 단계에서는 Vercel Blob, Cloudinary, Supabase Storage 중 하나에 사진을 저장하고 URL을 `photos` 탭에 저장하는 구조로 확장한다.
