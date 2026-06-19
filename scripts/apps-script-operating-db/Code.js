const SPREADSHEET_ID = '1jw7mcPFhZ1AJwyBamfCqB0t8oqWLLfEilgaJcOHN860';
const TIMEZONE = 'Asia/Seoul';

const SHEETS = {
  requests: '01_신청DB',
  bids: '02_업체견적DB',
  images: '03_이미지DB',
  contractors: '04_업체DB',
  statuses: '05_상태관리',
  notification_logs: '06_알림로그',
  assignments: '07_업체배정DB',
  customer_actions: '08_고객액션DB',
};

const HEADERS = {
  requests: [
    '신청ID',
    '접수일시',
    '접수채널',
    '신청유형',
    '고객명',
    '연락처',
    '연락수단',
    '시공지역',
    '시군구',
    '행정동',
    '상세주소수집여부',
    '주거유형',
    '운영공간유형',
    '현재상황',
    '손상부위',
    '손상부위_직접입력',
    '희망예산',
    '시공가능시간',
    '희망시기',
    '희망날짜',
    '추가요청사항',
    '필수사진_전체공간_URL',
    '필수사진_훼손범위_URL',
    '필수사진_근접_URL',
    '추가사진_URL',
    '사진개수',
    '예상최소금액',
    '예상최대금액',
    '신뢰도',
    '신뢰도라벨',
    '진행상태',
    '담당메모',
    '고객접근토큰',
    '고객결과URL',
    '결과안내수신동의',
    '카카오안내가능여부',
    '이메일',
    '결과안내상태',
    '결과안내일시',
  ],
  bids: [
    '견적ID',
    '신청ID',
    '제출일시',
    '업체ID',
    '업체명',
    '업체연락처',
    '플랫폼',
    '견적금액',
    '견적금액표시',
    '작업범위',
    '포함항목',
    '제외항목',
    '추가비용조건',
    '방문필요여부',
    '가능일정',
    '견적상태',
    '고객노출여부',
    '고객노출명',
    '내부메모',
    '부분시공가능여부',
    '예상작업시간',
    '관리자코멘트',
    '추천여부',
  ],
  images: [
    '이미지ID',
    '신청ID',
    '업로드일시',
    '이미지구분',
    '파일명',
    'Drive파일ID',
    'DriveURL',
    '썸네일URL',
    '고객노출여부',
    '내부노출여부',
    '정렬순서',
    '메모',
  ],
  contractors: [
    '업체ID',
    '업체명',
    '대표자명',
    '연락처',
    '가능지역',
    '가능공정',
    '벽지가능',
    '장판가능',
    '문틀가능',
    '몰딩가능',
    '사업장시공가능',
    '평균응답속도',
    '평점',
    '상태',
    '메모',
    '업체접근토큰',
    '업체전용링크',
    '고객노출명',
    '활성여부',
  ],
  statuses: ['상태코드', '상태명', '설명', '노출순서', '고객노출문구', '내부사용여부'],
  notification_logs: ['로그ID', '신청ID', '발송일시', '알림종류', '수신자', '발송상태', '발송내용', '오류내용'],
  assignments: [
    '배정ID',
    '신청ID',
    '업체ID',
    '배정일시',
    '배정상태',
    '견적요청메모',
    '업체확인여부',
    '견적제출여부',
    '내부메모',
  ],
  customer_actions: [
    '액션ID',
    '신청ID',
    '고객접근토큰',
    '선택견적ID',
    '액션유형',
    '액션명',
    '고객연락처',
    '생성일시',
    '사용자환경',
    '메모',
  ],
};

const DEFAULT_STATUSES = [
  ['RECEIVED', '접수완료', '신청이 접수된 상태', 1, '신청이 접수되었습니다. 새집다오가 사진과 요청 내용을 확인 중입니다.', 'Y'],
  ['REVIEWING', '검토중', '사진과 신청 내용을 검토 중', 2, '사진과 요청 내용을 확인하고 있습니다.', 'Y'],
  ['CONTACTING_CONTRACTORS', '업체문의중', '시공 가능한 업체에 견적 문의 중', 3, '업체 견적을 확인하고 있습니다.', 'Y'],
  ['QUOTE_READY', '견적준비완료', '고객에게 보여줄 견적이 준비된 상태', 4, '견적 결과가 준비되었습니다.', 'Y'],
  ['RESULT_SENT', '결과안내완료', '고객에게 결과 링크를 안내한 상태', 5, '견적 결과 링크를 안내드렸습니다.', 'Y'],
  ['CONNECT_REQUESTED', '업체연결요청', '고객이 특정 업체 연결을 요청한 상태', 6, '업체 연결 요청이 접수되었습니다.', 'Y'],
  ['COMPLETED', '시공완료', '시공이 완료된 상태', 7, '시공이 완료되었습니다.', 'Y'],
  ['CLOSED', '종료', '신청이 종료된 상태', 8, '요청이 종료되었습니다.', 'N'],
];

function setupPetroomOperatingDb() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ss.setSpreadsheetTimeZone(TIMEZONE);

  Object.keys(SHEETS).forEach(function (alias) {
    const sheet = getOrCreateSheet_(ss, alias);
    ensureHeader_(sheet, HEADERS[alias]);
    sheet.setFrozenRows(1);
    styleHeader_(sheet, HEADERS[alias].length);
  });

  seedStatuses_();

  return json_({
    ok: true,
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: ss.getUrl(),
    message: 'PET ROOM 운영DB 구조가 준비되었습니다.',
  });
}

function setPetroomRuntimeProperties(config) {
  const props = PropertiesService.getScriptProperties();
  const values = config || {};

  if (values.notifyEmail) {
    props.setProperty('NOTIFY_EMAIL', String(values.notifyEmail));
  }
  if (values.kakaoRestApiKey) {
    props.setProperty('KAKAO_REST_API_KEY', String(values.kakaoRestApiKey));
  }
  if (values.kakaoClientSecret) {
    props.setProperty('KAKAO_CLIENT_SECRET', String(values.kakaoClientSecret));
  }
  if (values.kakaoRefreshToken) {
    props.setProperty('KAKAO_REFRESH_TOKEN', String(values.kakaoRefreshToken));
  }

  return {
    ok: true,
    notifyEmail: Boolean(props.getProperty('NOTIFY_EMAIL')),
    kakaoRestApiKey: Boolean(props.getProperty('KAKAO_REST_API_KEY')),
    kakaoClientSecret: Boolean(props.getProperty('KAKAO_CLIENT_SECRET')),
    kakaoRefreshToken: Boolean(props.getProperty('KAKAO_REFRESH_TOKEN')),
  };
}

function setWebhookSecret(secret) {
  const value = String(secret || '').trim();
  if (value.length < 24) {
    throw new Error('Webhook secret은 24자 이상이어야 합니다.');
  }
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_SECRET', value);
  return { ok: true };
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    assertServerAuthorized_(params.server_secret);
    const alias = normalizeSheetAlias_(params.sheet || 'requests');
    const sheet = getSheet_(alias);
    ensureHeader_(sheet, HEADERS[alias]);
    const rows = readRows_(sheet);
    const requestId = params.request_id || params.requestId || '';

    const filteredRows = requestId
      ? rows.filter(function (row) {
          return String(row.request_id || row['신청ID'] || row['요청ID'] || '') === requestId;
        })
      : rows;

    return json_({
      ok: true,
      sheet: alias,
      sheetName: SHEETS[alias],
      rows: filteredRows,
    });
  } catch (error) {
    return json_({
      ok: false,
      field: error && error.field ? error.field : 'appsScript',
      message: errorMessage_(error),
    });
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    assertServerAuthorized_(payload.server_secret);

    if (payload.action === 'setup_db') {
      return json_(setupPetroomOperatingDb());
    }

    const alias = normalizeSheetAlias_(payload.sheet || 'requests');

    if (payload.action === 'delete') {
      return json_(deleteByRequestId_(alias, payload.request_id || payload.requestId));
    }

    if (payload.action === 'delete_by_id') {
      return json_(deleteRowById_(alias, payload.id || payload.bidId || payload.assignmentId || payload.request_id || payload.requestId));
    }

    if (payload.action === 'update') {
      return json_(updateRowById_(alias, payload.id || payload.request_id || payload.requestId || payload.bidId || payload.assignmentId, payload.values || {}));
    }

    if (alias === 'requests') {
      return json_(handleRequest_(payload.values || {}));
    }

    if (alias === 'bids') {
      return json_(handleBid_(payload.values || {}));
    }

    if (alias === 'assignments') {
      return json_(handleAssignment_(payload.values || {}));
    }

    if (alias === 'customer_actions') {
      return json_(handleCustomerAction_(payload.values || {}));
    }

    const sheet = getSheet_(alias);
    const row = mapValuesToHeaders_(payload.values || {}, HEADERS[alias]);
    sheet.appendRow(row);

    return json_({
      ok: true,
      sheet: alias,
      sheetName: SHEETS[alias],
    });
  } catch (error) {
    return json_({
      ok: false,
      field: error && error.field ? error.field : 'appsScript',
      message: errorMessage_(error),
    });
  }
}

function handleRequest_(values) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const requestSheet = getOrCreateSheet_(ss, 'requests');
  const imageSheet = getOrCreateSheet_(ss, 'images');
  ensureHeader_(requestSheet, HEADERS.requests);
  ensureHeader_(imageSheet, HEADERS.images);

  const now = nowText_();
  const requestId = buildNextRequestId_(requestSheet);
  const customerToken = value_(values, ['customer_token', '고객접근토큰']) || buildCustomerToken_();
  const resultBaseUrl = String(value_(values, ['customer_result_base_url']) || 'https://petroom-app.vercel.app').replace(/\/+$/, '');
  const customerResultUrl = resultBaseUrl + '/requests/' + encodeURIComponent(requestId) + '?token=' + encodeURIComponent(customerToken);
  const cityDistrict = value_(values, ['city_district', 'areaName', '시군구']);
  const adminDong = value_(values, ['admin_dong', 'dongName', '행정동']);
  const region = [cityDistrict, adminDong].filter(Boolean).join(' ') || value_(values, ['region', 'location', '시공지역']);
  const requiredPhotos = values.requiredPhotos && typeof values.requiredPhotos === 'object' ? values.requiredPhotos : {};
  const optionalPhotos = Array.isArray(values.optionalPhotos) ? values.optionalPhotos : [];
  const savedImages = [];
  const fullSpacePhotos = normalizePhotoList_(requiredPhotos.fullSpace);
  const damageRangePhotos = normalizePhotoList_(requiredPhotos.damageRange);
  const closeUpPhotos = normalizePhotoList_(requiredPhotos.closeUp);
  const additionalPhotos = normalizePhotoList_(optionalPhotos);
  const totalPhotoCount = fullSpacePhotos.length + damageRangePhotos.length + closeUpPhotos.length + additionalPhotos.length;

  if (fullSpacePhotos.length < 1 || damageRangePhotos.length < 1 || closeUpPhotos.length < 1) {
    throw new Error('필수 사진 3종은 각 항목별로 최소 1장씩 필요합니다.');
  }

  if (
    fullSpacePhotos.length > 10 ||
    damageRangePhotos.length > 15 ||
    closeUpPhotos.length > 15 ||
    additionalPhotos.length > 10 ||
    totalPhotoCount > 30
  ) {
    throw new Error('사진은 전체 최대 30장까지 업로드할 수 있습니다.');
  }

  let photoOrder = 1;
  fullSpacePhotos.forEach(function (photo) {
    savedImages.push(savePhoto_(requestId, '전체공간', photo, photoOrder));
    photoOrder += 1;
  });
  damageRangePhotos.forEach(function (photo) {
    savedImages.push(savePhoto_(requestId, '훼손범위', photo, photoOrder));
    photoOrder += 1;
  });
  closeUpPhotos.forEach(function (photo) {
    savedImages.push(savePhoto_(requestId, '근접사진', photo, photoOrder));
    photoOrder += 1;
  });
  additionalPhotos.forEach(function (photo) {
    savedImages.push(savePhoto_(requestId, '추가사진', photo, photoOrder));
    photoOrder += 1;
  });

  savedImages.forEach(function (image) {
    imageSheet.appendRow([
      image.imageId,
      requestId,
      now,
      image.type,
      image.fileName,
      image.fileId,
      image.url,
      image.thumbnailUrl,
      image.type === '업체견적캡쳐' ? 'N' : 'Y',
      'Y',
      image.order,
      '',
    ]);
  });

  const fullSpaceUrl = findImageUrls_(savedImages, '전체공간');
  const damageRangeUrl = findImageUrls_(savedImages, '훼손범위');
  const closeUpUrl = findImageUrls_(savedImages, '근접사진');
  const optionalUrls = findImageUrls_(savedImages, '추가사진');

  requestSheet.appendRow([
    requestId,
    now,
    value_(values, ['source', '접수채널']) || 'PET ROOM 앱',
    value_(values, ['request_type', 'requestType', '신청유형']),
    value_(values, ['customer_name', 'user_name', 'userName', '고객명']),
    value_(values, ['user_contact', 'userContact', '연락처']),
    value_(values, ['contact_method', 'contact_preference', 'contactPreference', '연락수단']),
    region,
    cityDistrict,
    adminDong,
    value_(values, ['detail_address_collected', '상세주소수집여부']) || 'N',
    value_(values, ['housing_type', 'housingType', '주거유형']),
    value_(values, ['business_type', 'businessType', '운영공간유형']),
    value_(values, ['situation', '현재상황']),
    value_(values, ['damage_parts', 'damage_type', 'damageParts', '손상부위']),
    value_(values, ['damage_parts_other', 'damagePartsOther', '손상부위_직접입력']),
    value_(values, ['budget', '희망예산']),
    value_(values, ['work_window', 'workWindow', '시공가능시간']),
    value_(values, ['schedule', '희망시기']),
    value_(values, ['schedule_date', 'scheduleDate', '희망날짜']),
    value_(values, ['user_memo', 'memo', '추가요청사항']),
    fullSpaceUrl,
    damageRangeUrl,
    closeUpUrl,
    optionalUrls,
    savedImages.length,
    value_(values, ['estimated_min', '예상최소금액']),
    value_(values, ['estimated_max', '예상최대금액']),
    value_(values, ['confidence', '신뢰도']),
    value_(values, ['confidence_label', '신뢰도라벨']),
    'RECEIVED',
    '',
    customerToken,
    customerResultUrl,
    value_(values, ['consent_result_notice', '결과안내수신동의']) || 'N',
    value_(values, ['kakao_notice_available', '카카오안내가능여부']) || 'N',
    value_(values, ['customer_email', '이메일']),
    '미안내',
    '',
  ]);

  const notificationText = buildNotificationText_(requestId, values, {
    fullSpaceUrl: fullSpaceUrl,
    damageRangeUrl: damageRangeUrl,
    closeUpUrl: closeUpUrl,
  });

  const notificationResults = [];
  notificationResults.push(runNotification_('EMAIL', getNotifyEmail_(), requestId, notificationText, function () {
    sendEmailNotification_(requestId, notificationText);
  }));
  notificationResults.push(runNotification_('KAKAO_ME', 'me', requestId, notificationText, function () {
    sendKakaoMeNotification_(notificationText);
  }));

  return {
    ok: true,
    requestId: requestId,
    customerToken: customerToken,
    customerResultUrl: customerResultUrl,
    imageCount: savedImages.length,
    photoUrls: {
      fullSpace: fullSpaceUrl,
      damageRange: damageRangeUrl,
      closeUp: closeUpUrl,
      optional: optionalUrls,
    },
    notificationResults: notificationResults,
  };
}

function handleBid_(values) {
  const sheet = getSheet_('bids');
  ensureHeader_(sheet, HEADERS.bids);
  const now = nowText_();
  const bidId = value_(values, ['bid_id', '견적ID']) || 'BID-' + Utilities.formatDate(new Date(), TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 1000);

  sheet.appendRow([
    bidId,
    value_(values, ['request_id', '신청ID']),
    value_(values, ['submitted_at', '제출일시']) || now,
    value_(values, ['contractor_id', '업체ID']),
    value_(values, ['contractor_name', '업체명']),
    value_(values, ['contractor_contact', '업체연락처']),
    value_(values, ['platform', '플랫폼']),
    value_(values, ['bid_amount', '견적금액']),
    value_(values, ['bid_amount_display', '견적금액표시']),
    value_(values, ['work_scope', '작업범위']),
    value_(values, ['included_items', '포함항목']),
    value_(values, ['excluded_items', '제외항목', '불포함항목']),
    value_(values, ['extra_cost_conditions', '추가비용조건']),
    value_(values, ['visit_required', '방문필요여부']),
    value_(values, ['available_date', '가능일정']),
    value_(values, ['bid_status', '견적상태']) || '검수대기',
    value_(values, ['customer_visible', '고객노출여부']) || 'N',
    value_(values, ['customer_display_name', '고객노출명']),
    value_(values, ['contractor_memo', '내부메모', '업체메모']),
    value_(values, ['partial_repair_available', '부분시공가능여부']),
    value_(values, ['estimated_work_time', '예상작업시간']),
    value_(values, ['admin_comment', '관리자코멘트']),
    value_(values, ['recommended', '추천여부']) || 'N',
  ]);

  return {
    ok: true,
    bidId: bidId,
  };
}

function handleAssignment_(values) {
  const sheet = getSheet_('assignments');
  ensureHeader_(sheet, HEADERS.assignments);
  const assignmentId = value_(values, ['assignment_id', '배정ID']) || buildNextAssignmentId_(sheet);

  sheet.appendRow([
    assignmentId,
    value_(values, ['request_id', 'requestId', '신청ID']),
    value_(values, ['contractor_id', 'contractorId', '업체ID']),
    value_(values, ['assigned_at', '배정일시']) || nowText_(),
    value_(values, ['assignment_status', '배정상태']) || '배정완료',
    value_(values, ['request_memo', '견적요청메모']),
    value_(values, ['contractor_checked', '업체확인여부']) || 'N',
    value_(values, ['estimate_submitted', '견적제출여부']) || 'N',
    value_(values, ['internal_memo', '내부메모']),
  ]);

  return {
    ok: true,
    assignmentId: assignmentId,
  };
}

function handleCustomerAction_(values) {
  const requestId = value_(values, ['request_id', '신청ID']);
  const customerToken = value_(values, ['customer_token', '고객접근토큰']);
  const actionType = value_(values, ['action_type', '액션유형']);
  const selectedQuoteId = value_(values, ['selected_quote_id', '선택견적ID']);
  const allowedActions = ['CONNECT_REQUESTED', 'CONSULT_REQUESTED', 'DECIDED_LATER'];

  if (!requestId || !customerToken || allowedActions.indexOf(actionType) < 0) {
    throw new Error('고객 액션 정보가 올바르지 않습니다.');
  }

  const requestRows = readRows_(getSheet_('requests'));
  const requestRow = requestRows.find(function (row) {
    return String(row.request_id || row['신청ID'] || '') === String(requestId);
  });

  if (!requestRow || String(requestRow.customer_token || requestRow['고객접근토큰'] || '') !== String(customerToken)) {
    throw new Error('고객 결과 링크 인증에 실패했습니다.');
  }

  if (actionType === 'CONNECT_REQUESTED') {
    const quoteRows = readRows_(getSheet_('bids'));
    const selectedQuote = quoteRows.find(function (row) {
      const sameRequest = String(row.request_id || row['신청ID'] || '') === String(requestId);
      const sameQuote = String(row.bid_id || row['견적ID'] || '') === String(selectedQuoteId);
      const visible = String(row.customer_visible || row['고객노출여부'] || '').toUpperCase() === 'Y';
      return sameRequest && sameQuote && visible;
    });
    if (!selectedQuote) {
      throw new Error('연결 요청할 견적을 확인할 수 없습니다.');
    }
  }

  const sheet = getSheet_('customer_actions');
  ensureHeader_(sheet, HEADERS.customer_actions);
  const actionId = buildNextActionId_(sheet);
  const actionLabelMap = {
    CONNECT_REQUESTED: '이 업체로 연결 요청하기',
    CONSULT_REQUESTED: '추가 상담 요청하기',
    DECIDED_LATER: '아직 결정하지 않기',
  };

  sheet.appendRow([
    actionId,
    requestId,
    customerToken,
    selectedQuoteId,
    actionType,
    value_(values, ['action_label', '액션명']) || actionLabelMap[actionType],
    String(requestRow.user_contact || requestRow['연락처'] || ''),
    nowText_(),
    value_(values, ['user_agent', '사용자환경']),
    value_(values, ['memo', '메모']),
  ]);

  if (actionType === 'CONNECT_REQUESTED') {
    updateRowById_('requests', requestId, {
      status: 'CONNECT_REQUESTED',
      진행상태: 'CONNECT_REQUESTED',
    });
  }

  return {
    ok: true,
    actionId: actionId,
    actionType: actionType,
  };
}

function runNotification_(type, recipient, requestId, content, fn) {
  try {
    fn();
    appendNotificationLog_(requestId, type, recipient, '성공', content, '');
    return { type: type, ok: true };
  } catch (error) {
    appendNotificationLog_(requestId, type, recipient, '실패', content, errorMessage_(error));
    return { type: type, ok: false, error: errorMessage_(error) };
  }
}

function appendNotificationLog_(requestId, type, recipient, status, content, errorText) {
  const sheet = getSheet_('notification_logs');
  ensureHeader_(sheet, HEADERS.notification_logs);
  sheet.appendRow([
    'LOG-' + Utilities.formatDate(new Date(), TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 10000),
    requestId,
    nowText_(),
    type,
    recipient,
    status,
    content,
    errorText,
  ]);
}

function sendEmailNotification_(requestId, content) {
  MailApp.sendEmail({
    to: getNotifyEmail_(),
    subject: '[PET ROOM] 신규 견적 신청 접수 - ' + requestId,
    body: content,
  });
}

function sendKakaoMeNotification_(content) {
  const props = PropertiesService.getScriptProperties();
  const restApiKey = props.getProperty('KAKAO_REST_API_KEY');
  const refreshToken = props.getProperty('KAKAO_REFRESH_TOKEN');

  if (!restApiKey || !refreshToken) {
    throw new Error('Kakao Script Properties가 없습니다.');
  }

  const accessToken = refreshKakaoAccessToken_();
  const response = UrlFetchApp.fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
    payload: {
      template_object: JSON.stringify({
        object_type: 'text',
        text: content.slice(0, 950),
        link: {
          web_url: SpreadsheetApp.openById(SPREADSHEET_ID).getUrl(),
          mobile_web_url: SpreadsheetApp.openById(SPREADSHEET_ID).getUrl(),
        },
        button_title: '운영DB 열기',
      }),
    },
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Kakao send failed: ' + statusCode + ' ' + response.getContentText());
  }
}

function refreshKakaoAccessToken_() {
  const props = PropertiesService.getScriptProperties();
  const restApiKey = props.getProperty('KAKAO_REST_API_KEY');
  const refreshToken = props.getProperty('KAKAO_REFRESH_TOKEN');
  const clientSecret = props.getProperty('KAKAO_CLIENT_SECRET');
  const payload = {
    grant_type: 'refresh_token',
    client_id: restApiKey,
    refresh_token: refreshToken,
  };

  if (clientSecret) {
    payload.client_secret = clientSecret;
  }

  const response = UrlFetchApp.fetch('https://kauth.kakao.com/oauth/token', {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true,
  });
  const statusCode = response.getResponseCode();
  const text = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Kakao token refresh failed: ' + statusCode + ' ' + text);
  }

  const data = JSON.parse(text);
  if (!data.access_token) {
    throw new Error('Kakao access_token이 없습니다.');
  }
  if (data.refresh_token) {
    props.setProperty('KAKAO_REFRESH_TOKEN', data.refresh_token);
  }

  return data.access_token;
}

function buildNotificationText_(requestId, values, urls) {
  const requestType = value_(values, ['request_type', 'requestType', '신청유형']);
  const cityDistrict = value_(values, ['city_district', 'areaName', '시군구']);
  const adminDong = value_(values, ['admin_dong', 'dongName', '행정동']);
  const lines = [
    '[PET ROOM 신규 견적 신청]',
    '',
    '신청ID: ' + requestId,
    '신청유형: ' + requestType,
    '고객명/업체명: ' + value_(values, ['customer_name', 'user_name', 'userName', '고객명']),
    '연락처: ' + value_(values, ['user_contact', 'userContact', '연락처']),
    '시공지역: ' + [cityDistrict, adminDong].filter(Boolean).join(' '),
    '손상부위: ' + value_(values, ['damage_parts', 'damage_type', 'damageParts', '손상부위']),
    '희망시기: ' + value_(values, ['schedule', '희망시기']),
    '추가요청사항: ' + value_(values, ['user_memo', 'memo', '추가요청사항']),
  ];

  if (requestType === '운영 공간') {
    lines.push('운영공간유형: ' + value_(values, ['business_type', 'businessType', '운영공간유형']));
    lines.push('희망예산: ' + value_(values, ['budget', '희망예산']));
    lines.push('시공가능시간: ' + value_(values, ['work_window', 'workWindow', '시공가능시간']));
  } else {
    lines.push('주거유형: ' + value_(values, ['housing_type', 'housingType', '주거유형']));
    lines.push('현재상황: ' + value_(values, ['situation', '현재상황']));
  }

  lines.push('');
  lines.push('필수사진_전체공간: ' + urls.fullSpaceUrl);
  lines.push('필수사진_훼손범위: ' + urls.damageRangeUrl);
  lines.push('필수사진_근접: ' + urls.closeUpUrl);
  lines.push('');
  lines.push('운영DB: ' + SpreadsheetApp.openById(SPREADSHEET_ID).getUrl());

  return lines.join('\n');
}

function savePhoto_(requestId, type, photo, order) {
  const folder = getPhotoFolder_();
  const parsed = parseDataUrl_(photo);
  const extension = mimeToExtension_(parsed.mimeType);
  const safeName = sanitizeFileName_(photo.fileName || type + '.' + extension);
  const fileName = requestId + '_' + order + '_' + type + '_' + safeName;
  const blob = Utilities.newBlob(parsed.bytes, parsed.mimeType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    imageId: 'IMG-' + requestId + '-' + String(order).padStart(2, '0'),
    type: type,
    fileName: fileName,
    fileId: file.getId(),
    url: file.getUrl(),
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId(),
    order: order,
  };
}

function parseDataUrl_(photo) {
  const dataUrl = String((photo && photo.dataUrl) || '');
  const match = dataUrl.match(/^data:([^;,]*)(?:;[^,]*)?;base64,(.+)$/);
  if (!match) {
    const error = new Error('사진 dataURL 형식이 올바르지 않습니다.');
    error.field = 'requiredPhotos';
    throw error;
  }

  const mimeType = match[1] || inferMimeType_(photo);

  return {
    mimeType: mimeType || 'application/octet-stream',
    bytes: Utilities.base64Decode(String(match[2] || '').replace(/\s/g, '')),
  };
}

function getPhotoFolder_() {
  const folderName = 'PETROOM_신청관리_운영DB_사진';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function buildNextRequestId_(sheet) {
  const year = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy');
  const values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  let maxNumber = 0;

  values.forEach(function (row) {
    const text = String(row[0] || '');
    const match = text.match(new RegExp('^PR-' + year + '-(\\d{4})$'));
    if (match) {
      maxNumber = Math.max(maxNumber, Number(match[1]));
    }
  });

  return 'PR-' + year + '-' + String(maxNumber + 1).padStart(4, '0');
}

function buildNextAssignmentId_(sheet) {
  const year = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy');
  const values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  let maxNumber = 0;

  values.forEach(function (row) {
    const text = String(row[0] || '');
    const match = text.match(new RegExp('^AS-' + year + '-(\\d{4})$'));
    if (match) {
      maxNumber = Math.max(maxNumber, Number(match[1]));
    }
  });

  return 'AS-' + year + '-' + String(maxNumber + 1).padStart(4, '0');
}

function buildNextActionId_(sheet) {
  return 'ACT-' + Utilities.formatDate(new Date(), TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 10000);
}

function buildCustomerToken_() {
  return (Utilities.getUuid().replace(/-/g, '') + Math.floor(Math.random() * 100000000).toString(36)).slice(0, 24);
}

function assertServerAuthorized_(providedSecret) {
  const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!expectedSecret || String(providedSecret || '') !== expectedSecret) {
    throw new Error('서버 인증에 실패했습니다.');
  }
}

function deleteByRequestId_(alias, requestId) {
  if (!requestId) {
    throw new Error('삭제할 신청ID가 없습니다.');
  }

  const sheet = getSheet_(alias);
  const headers = getHeaders_(sheet);
  const requestIdColumn = findHeaderIndex_(headers, ['신청ID', 'request_id', '요청ID']);

  if (requestIdColumn < 0) {
    throw new Error('신청ID 컬럼을 찾지 못했습니다.');
  }

  let deleted = 0;
  for (let row = sheet.getLastRow(); row >= 2; row -= 1) {
    if (String(sheet.getRange(row, requestIdColumn + 1).getValue()) === requestId) {
      sheet.deleteRow(row);
      deleted += 1;
    }
  }

  return {
    ok: true,
    deleted: deleted,
  };
}

function deleteRowById_(alias, id) {
  if (!id) {
    throw new Error('삭제할 ID가 없습니다.');
  }

  const sheet = getSheet_(alias);
  ensureHeader_(sheet, HEADERS[alias]);
  const headers = getHeaders_(sheet);
  const idColumn = findIdColumn_(alias, headers);

  if (idColumn < 0) {
    throw new Error('ID 컬럼을 찾지 못했습니다: ' + alias);
  }

  for (let row = sheet.getLastRow(); row >= 2; row -= 1) {
    if (String(sheet.getRange(row, idColumn + 1).getValue()) === String(id)) {
      sheet.deleteRow(row);
      return {
        ok: true,
        sheet: alias,
        id: id,
        deleted: 1,
      };
    }
  }

  return {
    ok: false,
    sheet: alias,
    id: id,
    deleted: 0,
    message: '삭제할 행을 찾지 못했습니다.',
  };
}

function updateRowById_(alias, id, values) {
  if (!id) {
    throw new Error('수정할 ID가 없습니다.');
  }

  const sheet = getSheet_(alias);
  ensureHeader_(sheet, HEADERS[alias]);
  const headers = getHeaders_(sheet);
  const idColumn = findIdColumn_(alias, headers);

  if (idColumn < 0) {
    throw new Error('ID 컬럼을 찾지 못했습니다: ' + alias);
  }

  for (let row = 2; row <= sheet.getLastRow(); row += 1) {
    if (String(sheet.getRange(row, idColumn + 1).getValue()) === String(id)) {
      headers.forEach(function (header, index) {
        const english = englishKey_(header);
        if (values[header] !== undefined) {
          sheet.getRange(row, index + 1).setValue(values[header]);
        } else if (values[english] !== undefined) {
          sheet.getRange(row, index + 1).setValue(values[english]);
        }
      });

      return {
        ok: true,
        sheet: alias,
        id: id,
        updated: 1,
      };
    }
  }

  return {
    ok: false,
    sheet: alias,
    id: id,
    updated: 0,
    message: '수정할 행을 찾지 못했습니다.',
  };
}

function findIdColumn_(alias, headers) {
  if (alias === 'requests') {
    return findHeaderIndex_(headers, ['신청ID', 'request_id']);
  }
  if (alias === 'bids') {
    return findHeaderIndex_(headers, ['견적ID', 'bid_id']);
  }
  if (alias === 'assignments') {
    return findHeaderIndex_(headers, ['배정ID', 'assignment_id']);
  }
  if (alias === 'contractors') {
    return findHeaderIndex_(headers, ['업체ID', 'contractor_id']);
  }
  if (alias === 'customer_actions') {
    return findHeaderIndex_(headers, ['액션ID', 'action_id']);
  }
  return 0;
}

function findHeaderIndex_(headers, candidates) {
  for (let i = 0; i < candidates.length; i += 1) {
    const target = String(candidates[i]);
    const index = headers.findIndex(function (header) {
      return header === target || englishKey_(header) === target;
    });
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

function readRows_(sheet) {
  const headers = getHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues()
    .map(function (row) {
      const item = {};
      headers.forEach(function (header, index) {
        item[header] = row[index];
        item[englishKey_(header)] = row[index];
      });
      return item;
    });
}

function getSheet_(alias) {
  return getOrCreateSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), alias);
}

function getOrCreateSheet_(ss, alias) {
  const sheetName = SHEETS[alias];
  if (!sheetName) {
    throw new Error('알 수 없는 sheet alias입니다: ' + alias);
  }
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function ensureHeader_(sheet, headers) {
  const existing = getHeaders_(sheet);
  const same = headers.length === existing.length && headers.every(function (header, index) {
    return header === existing[index];
  });

  if (!same) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getHeaders_(sheet) {
  if (sheet.getLastColumn() === 0) {
    return [];
  }
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (header) {
    return String(header || '').trim();
  });
}

function styleHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount).setBackground('#08285A').setFontColor('#FFFFFF').setFontWeight('bold');
}

function seedStatuses_() {
  const sheet = getSheet_('statuses');
  ensureHeader_(sheet, HEADERS.statuses);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.statuses.length).clearContent();
  }
  sheet.getRange(2, 1, DEFAULT_STATUSES.length, HEADERS.statuses.length).setValues(DEFAULT_STATUSES);
}

function mapValuesToHeaders_(values, headers) {
  return headers.map(function (header) {
    return value_(values, [header, englishKey_(header)]);
  });
}

function value_(values, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
      return values[key];
    }
  }
  return '';
}

function findImageUrl_(images, type) {
  const image = images.find(function (item) {
    return item.type === type;
  });
  return image ? image.url : '';
}

function findImageUrls_(images, type) {
  return images
    .filter(function (item) {
      return item.type === type;
    })
    .map(function (item) {
      return item.url;
    })
    .join('\n');
}

function normalizePhotoList_(value) {
  if (Array.isArray(value)) {
    return value.filter(function (photo) {
      return photo && photo.dataUrl;
    });
  }

  if (value && value.dataUrl) {
    return [value];
  }

  return [];
}

function normalizeSheetAlias_(alias) {
  const text = String(alias || 'requests');
  const found = Object.keys(SHEETS).find(function (key) {
    return key === text || SHEETS[key] === text;
  });
  if (!found) {
    throw new Error('지원하지 않는 시트입니다: ' + text);
  }
  return found;
}

function englishKey_(header) {
  const map = {
    신청ID: 'request_id',
    접수일시: 'created_at',
    접수채널: 'source',
    신청유형: 'request_type',
    고객명: 'user_name',
    연락처: 'user_contact',
    연락수단: 'contact_preference',
    시공지역: 'region',
    시군구: 'city_district',
    행정동: 'admin_dong',
    상세주소수집여부: 'detail_address_collected',
    주거유형: 'housing_type',
    운영공간유형: 'business_type',
    현재상황: 'situation',
    손상부위: 'damage_parts',
    손상부위_직접입력: 'damage_parts_other',
    희망예산: 'budget',
    시공가능시간: 'work_window',
    희망시기: 'schedule',
    희망날짜: 'schedule_date',
    추가요청사항: 'user_memo',
    사진개수: 'image_count',
    예상최소금액: 'estimated_min',
    예상최대금액: 'estimated_max',
    신뢰도: 'confidence',
    신뢰도라벨: 'confidence_label',
    진행상태: 'status',
    담당메모: 'admin_memo',
    고객접근토큰: 'customer_token',
    고객결과URL: 'customer_result_url',
    결과안내수신동의: 'consent_result_notice',
    카카오안내가능여부: 'kakao_notice_available',
    이메일: 'customer_email',
    결과안내상태: 'result_notice_status',
    결과안내일시: 'result_notice_at',
    견적ID: 'bid_id',
    제출일시: 'submitted_at',
    업체ID: 'contractor_id',
    업체명: 'contractor_name',
    업체연락처: 'contractor_contact',
    플랫폼: 'platform',
    견적금액: 'bid_amount',
    견적금액표시: 'bid_amount_display',
    작업범위: 'work_scope',
    포함항목: 'included_items',
    제외항목: 'excluded_items',
    추가비용조건: 'extra_cost_conditions',
    방문필요여부: 'visit_required',
    가능일정: 'available_date',
    견적상태: 'bid_status',
    고객노출여부: 'customer_visible',
    고객노출명: 'customer_display_name',
    내부메모: 'contractor_memo',
    부분시공가능여부: 'partial_repair_available',
    예상작업시간: 'estimated_work_time',
    관리자코멘트: 'admin_comment',
    추천여부: 'recommended',
    업체접근토큰: 'access_token',
    업체전용링크: 'contractor_link',
    활성여부: 'active',
    배정ID: 'assignment_id',
    배정일시: 'assigned_at',
    배정상태: 'assignment_status',
    견적요청메모: 'request_memo',
    업체확인여부: 'contractor_checked',
    견적제출여부: 'estimate_submitted',
    액션ID: 'action_id',
    고객접근토큰: 'customer_token',
    선택견적ID: 'selected_quote_id',
    액션유형: 'action_type',
    액션명: 'action_label',
    고객연락처: 'customer_phone',
    생성일시: 'created_at',
    사용자환경: 'user_agent',
    메모: 'memo',
  };
  return map[header] || header;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  return JSON.parse(e.postData.contents);
}

function getNotifyEmail_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || 'choijh1988@gmail.com';
}

function nowText_() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function mimeToExtension_(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return map[mimeType] || 'jpg';
}

function inferMimeType_(photo) {
  const fileType = String((photo && photo.fileType) || '').toLowerCase();
  if (fileType) {
    return fileType;
  }

  const fileName = String((photo && photo.fileName) || '').toLowerCase();
  if (fileName.match(/\.heic$/)) return 'image/heic';
  if (fileName.match(/\.heif$/)) return 'image/heif';
  if (fileName.match(/\.jpe?g$/)) return 'image/jpeg';
  if (fileName.match(/\.png$/)) return 'image/png';
  if (fileName.match(/\.webp$/)) return 'image/webp';
  return 'application/octet-stream';
}

function sanitizeFileName_(name) {
  return String(name || 'photo.jpg')
    .replace(/[\\/:*?"<>|#%{}~&]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

function errorMessage_(error) {
  return error && error.message ? error.message : String(error);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
