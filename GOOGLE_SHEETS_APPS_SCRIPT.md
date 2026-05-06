# PET ROOM Google Sheets 연동 방법

이 앱은 `GOOGLE_SHEETS_WEBHOOK_URL` 환경변수가 있으면 유저 견적 요청과 업체 견적을 Google Sheets에 저장하고, 업체 요청함에서 Google Sheets 데이터를 읽어온다.

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
    'photo_urls',
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

const PHOTO_FOLDER_NAME = 'PETROOM_REQUEST_PHOTOS';

function authorizeDriveOnce() {
  getPhotoFolder();
}

function getPhotoFolder() {
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function saveRequestPhotos(values) {
  const photos = values.photo_data_urls || [];

  if (!Array.isArray(photos) || photos.length === 0) {
    return '';
  }

  const folder = getPhotoFolder();
  const requestId = values.request_id || 'request';
  const urls = [];

  photos.forEach((dataUrl, index) => {
    const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
      return;
    }

    const mimeType = match[1];
    const extension = mimeType.split('/')[1] || 'jpg';
    const bytes = Utilities.base64Decode(match[2]);
    const blob = Utilities.newBlob(bytes, mimeType, `${requestId}_${index + 1}.${extension}`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    urls.push(`https://drive.google.com/uc?export=view&id=${file.getId()}`);
  });

  return urls.join('\n');
}

function safeSaveRequestPhotos(values) {
  try {
    return saveRequestPhotos(values);
  } catch (error) {
    console.error('Photo save failed', error);
    return `PHOTO_ERROR: ${error.message}`;
  }
}

function getRows(sheetName, requestId) {
  const columns = SHEET_COLUMNS[sheetName];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!columns || !sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];

  return values.slice(1)
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    })
    .filter((item) => !requestId || item.request_id === requestId || item['요청ID'] === requestId);
}

function doGet(e) {
  const sheetName = e.parameter.sheet;
  const requestId = e.parameter.request_id || '';

  if (!SHEET_COLUMNS[sheetName]) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: 'Unknown sheet', rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, rows: getRows(sheetName, requestId) }))
    .setMimeType(ContentService.MimeType.JSON);
}

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

  if (sheetName === 'requests') {
    values.photo_urls = safeSaveRequestPhotos(values);
  }

  sheet.appendRow(columns.map((column) => values[column] ?? ''));

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. 웹앱으로 배포

사진 저장은 Google Drive 권한이 필요하다. Apps Script 왼쪽 `프로젝트 설정`에서 `appsscript.json 매니페스트 파일 표시`를 켠 뒤, `appsscript.json`에 아래 내용을 넣는다.

```json
{
  "timeZone": "Asia/Seoul",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
}
```

그 다음 편집기에서 함수 선택을 `authorizeDriveOnce`로 바꾸고 `실행`을 눌러 Drive 권한을 승인한다.

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

## 5. 현재 저장되고 읽는 데이터

- `/api/requests`: 유저 요청, 예상 견적 범위, 신뢰도 저장
- `/api/bids`: 업체 견적, 작업 범위, 추가비 조건 저장
- `/contractor/requests`: `requests` 탭의 유저 요청 목록 조회
- `/contractor/requests/[requestId]`: 요청 상세와 해당 요청의 `bids` 탭 입찰 조회

사진은 Apps Script가 Google Drive의 `PETROOM_REQUEST_PHOTOS` 폴더에 저장하고, 공개 보기 URL을 `requests` 탭의 `사진URL` 컬럼에 저장한다.
운영 고도화 단계에서는 Vercel Blob, Cloudinary, Supabase Storage 중 하나로 이전할 수 있다.
