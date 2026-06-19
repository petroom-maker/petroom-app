export type RequestRecord = {
  request_id: string;
  created_at: string;
  user_name: string;
  user_contact: string;
  contact_preference: string;
  region: string;
  damage_type: string;
  damage_scope: string;
  housing_type: string;
  room_type: string;
  area_text: string;
  material_match: string;
  damage_position: string;
  repair_intent: string;
  furniture_level: string;
  schedule: string;
  user_memo: string;
  image_count: number;
  photo_urls: string;
  estimated_min: number;
  estimated_max: number;
  confidence: number;
  confidence_label: string;
  status: string;
  customer_result_url?: string;
  consent_result_notice?: string;
  kakao_notice_available?: string;
  customer_email?: string;
  result_notice_status?: string;
  result_notice_at?: string;
};

export type BidRecord = {
  bid_id: string;
  request_id: string;
  submitted_at: string;
  contractor_id: string;
  contractor_name: string;
  contractor_contact: string;
  contractor_region: string;
  platform: string;
  is_verified: boolean;
  rating: number;
  review_count: number;
  completed_count: number;
  bid_amount: string;
  bid_amount_display: string;
  work_scope: string;
  included_items: string;
  excluded_items: string;
  extra_cost_conditions: string;
  available_date: string;
  visit_required: string;
  above_range_reason: string;
  contractor_memo: string;
  bid_status: string;
  customer_visible: boolean;
  customer_display_name: string;
  partial_repair_available?: string;
  estimated_work_time?: string;
  admin_comment?: string;
  recommended?: boolean;
};

export type ContractorRecord = {
  contractor_id: string;
  contractor_name: string;
  representative_name: string;
  contractor_contact: string;
  service_regions: string;
  service_scopes: string;
  wallpaper_available: string;
  floor_available: string;
  doorframe_available: string;
  molding_available: string;
  business_available: string;
  average_response_speed: string;
  rating: number;
  status: string;
  memo: string;
  access_token: string;
  contractor_link: string;
  customer_display_name: string;
  active: string;
};

export type AssignmentRecord = {
  assignment_id: string;
  request_id: string;
  contractor_id: string;
  assigned_at: string;
  assignment_status: string;
  request_memo: string;
  contractor_checked: string;
  estimate_submitted: string;
  internal_memo: string;
};

export type CustomerActionRecord = {
  action_id: string;
  request_id: string;
  selected_quote_id: string;
  action_type: 'CONNECT_REQUESTED' | 'CONSULT_REQUESTED' | 'DECIDED_LATER' | string;
  action_label: string;
  created_at: string;
  memo: string;
};

const toStringValue = (value: unknown) => (value === undefined || value === null ? '' : String(value));
const toNumberValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const pickValue = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }

  return '';
};

const joinValues = (row: Record<string, unknown>, ...keys: string[]) =>
  keys
    .map((key) => toStringValue(row[key]).trim())
    .filter(Boolean)
    .join('\n');

export const normalizeRequest = (row: Record<string, unknown>): RequestRecord => ({
  request_id: toStringValue(pickValue(row, 'request_id', '신청ID', '요청ID')),
  created_at: toStringValue(pickValue(row, 'created_at', '접수일시', '요청일시')),
  user_name: toStringValue(pickValue(row, 'user_name', '고객명')),
  user_contact: toStringValue(pickValue(row, 'user_contact', '연락처', '고객연락처')),
  contact_preference: toStringValue(pickValue(row, 'contact_preference', '연락수단', '선호연락방식')),
  region: toStringValue(pickValue(row, 'region', '시공지역', '지역')),
  damage_type: toStringValue(pickValue(row, 'damage_parts', 'damage_type', '손상부위', '파손유형')),
  damage_scope: toStringValue(pickValue(row, 'situation', 'damage_scope', '현재상황', '희망예산', '파손범위')),
  housing_type: toStringValue(pickValue(row, 'housing_type', '주거유형')),
  room_type: toStringValue(pickValue(row, 'business_type', 'room_type', '운영공간유형', '공간구조')),
  area_text: toStringValue(pickValue(row, 'area_text', '면적')),
  material_match: toStringValue(pickValue(row, 'material_match', '동일자재여부')),
  damage_position: toStringValue(pickValue(row, 'damage_position', '파손위치')),
  repair_intent: toStringValue(pickValue(row, 'repair_intent', '복구방식')),
  furniture_level: toStringValue(pickValue(row, 'work_window', 'furniture_level', '시공가능시간', '짐여부')),
  schedule: toStringValue(pickValue(row, 'schedule', '희망시기', '희망일정')),
  user_memo: toStringValue(pickValue(row, 'user_memo', '추가요청사항', '고객메모')),
  image_count: toNumberValue(pickValue(row, 'image_count', '사진개수', '사진수')),
  photo_urls:
    toStringValue(pickValue(row, 'photo_urls', '사진URL')) ||
    joinValues(row, '필수사진_전체공간_URL', '필수사진_훼손범위_URL', '필수사진_근접_URL', '추가사진_URL'),
  estimated_min: toNumberValue(pickValue(row, 'estimated_min', '예상최소금액')),
  estimated_max: toNumberValue(pickValue(row, 'estimated_max', '예상최대금액')),
  confidence: toNumberValue(pickValue(row, 'confidence', '신뢰도')),
  confidence_label: toStringValue(pickValue(row, 'confidence_label', '신뢰도라벨')),
  status: normalizeStatusCode(toStringValue(pickValue(row, 'status', '진행상태', '상태') || 'RECEIVED')),
  customer_result_url: toStringValue(pickValue(row, 'customer_result_url', '고객결과URL')),
  consent_result_notice: toStringValue(pickValue(row, 'consent_result_notice', '결과안내수신동의')),
  kakao_notice_available: toStringValue(pickValue(row, 'kakao_notice_available', '카카오안내가능여부')),
  customer_email: toStringValue(pickValue(row, 'customer_email', '이메일')),
  result_notice_status: toStringValue(pickValue(row, 'result_notice_status', '결과안내상태')),
  result_notice_at: toStringValue(pickValue(row, 'result_notice_at', '결과안내일시')),
});

const legacyStatusCodeMap: Record<string, string> = {
  접수: 'RECEIVED',
  사진확인중: 'REVIEWING',
  견적정리중: 'REVIEWING',
  업체문의중: 'CONTACTING_CONTRACTORS',
  견적전달완료: 'RESULT_SENT',
  상담진행중: 'CONSULT_REQUESTED',
  업체연결완료: 'CONNECT_REQUESTED',
  시공완료: 'COMPLETED',
  보류: 'CLOSED',
  취소: 'CLOSED',
};

export const normalizeStatusCode = (status: string) => legacyStatusCodeMap[status] ?? status;

const statusLabelMap: Record<string, string> = {
  접수: '접수 완료',
  입찰대기: '견적 받는 중',
  완료: '시공 예약 완료',
  보완요청: '보완 요청',
  RECEIVED: '접수 완료',
  REVIEWING: '검토 중',
  CONTACTING_CONTRACTORS: '업체 문의 중',
  QUOTE_READY: '견적 준비 완료',
  RESULT_SENT: '결과 안내 완료',
  CONNECT_REQUESTED: '업체 연결 요청',
  CONSULT_REQUESTED: '추가 상담 요청',
  COMPLETED: '시공 완료',
  CLOSED: '종료',
};

export const getStatusLabel = (status: string) => statusLabelMap[normalizeStatusCode(status)] ?? status;

const toBooleanValue = (value: unknown) => {
  const text = toStringValue(value);
  return text === 'true' || text === '인증' || text === 'TRUE' || text === '1' || text.toUpperCase() === 'Y';
};

export const normalizeBid = (row: Record<string, unknown>): BidRecord => ({
  bid_id: toStringValue(pickValue(row, 'bid_id', '견적ID', '입찰ID')),
  request_id: toStringValue(pickValue(row, 'request_id', '신청ID', '요청ID')),
  submitted_at: toStringValue(pickValue(row, 'submitted_at', '제출일시', '입찰일시')),
  contractor_id: toStringValue(pickValue(row, 'contractor_id', '업체ID')),
  contractor_name: toStringValue(pickValue(row, 'contractor_name', '업체명')),
  contractor_contact: toStringValue(pickValue(row, 'contractor_contact', '업체연락처')),
  contractor_region: toStringValue(pickValue(row, 'contractor_region', '업체지역')),
  platform: toStringValue(pickValue(row, 'platform', '플랫폼')),
  is_verified: toBooleanValue(pickValue(row, 'is_verified', '인증여부')),
  rating: toNumberValue(pickValue(row, 'rating', '평점')),
  review_count: toNumberValue(pickValue(row, 'review_count', '후기수')),
  completed_count: toNumberValue(pickValue(row, 'completed_count', '완료건수')),
  bid_amount: toStringValue(pickValue(row, 'bid_amount', '견적금액', '입찰금액')),
  bid_amount_display: toStringValue(pickValue(row, 'bid_amount_display', '견적금액표시')),
  work_scope: toStringValue(pickValue(row, 'work_scope', '작업범위')),
  included_items: toStringValue(pickValue(row, 'included_items', '포함항목')),
  excluded_items: toStringValue(pickValue(row, 'excluded_items', '제외항목', '불포함항목')),
  extra_cost_conditions: toStringValue(pickValue(row, 'extra_cost_conditions', '추가비용조건', '추가비조건')),
  available_date: toStringValue(pickValue(row, 'available_date', '가능일정')),
  visit_required: toStringValue(pickValue(row, 'visit_required', '방문필요여부')),
  above_range_reason: toStringValue(pickValue(row, 'above_range_reason', '범위초과사유')),
  contractor_memo: toStringValue(pickValue(row, 'contractor_memo', '내부메모', '업체메모')),
  bid_status: toStringValue(pickValue(row, 'bid_status', '견적상태', '입찰상태') || '제출'),
  customer_visible: toBooleanValue(pickValue(row, 'customer_visible', '고객노출여부')),
  customer_display_name: toStringValue(pickValue(row, 'customer_display_name', '고객노출명')),
  partial_repair_available: toStringValue(pickValue(row, 'partial_repair_available', '부분시공가능여부')),
  estimated_work_time: toStringValue(pickValue(row, 'estimated_work_time', '예상작업시간')),
  admin_comment: toStringValue(pickValue(row, 'admin_comment', '관리자코멘트')),
  recommended: toBooleanValue(pickValue(row, 'recommended', '추천여부')),
});

export const normalizeContractor = (row: Record<string, unknown>): ContractorRecord => ({
  contractor_id: toStringValue(pickValue(row, 'contractor_id', '업체ID')),
  contractor_name: toStringValue(pickValue(row, 'contractor_name', '업체명')),
  representative_name: toStringValue(pickValue(row, 'representative_name', '대표자명')),
  contractor_contact: toStringValue(pickValue(row, 'contractor_contact', '연락처', '업체연락처')),
  service_regions: toStringValue(pickValue(row, 'service_regions', '가능지역')),
  service_scopes: toStringValue(pickValue(row, 'service_scopes', '가능공정')),
  wallpaper_available: toStringValue(pickValue(row, 'wallpaper_available', '벽지가능')),
  floor_available: toStringValue(pickValue(row, 'floor_available', '장판가능')),
  doorframe_available: toStringValue(pickValue(row, 'doorframe_available', '문틀가능')),
  molding_available: toStringValue(pickValue(row, 'molding_available', '몰딩가능')),
  business_available: toStringValue(pickValue(row, 'business_available', '사업장시공가능')),
  average_response_speed: toStringValue(pickValue(row, 'average_response_speed', '평균응답속도')),
  rating: toNumberValue(pickValue(row, 'rating', '평점')),
  status: toStringValue(pickValue(row, 'status', '상태')),
  memo: toStringValue(pickValue(row, 'memo', '메모')),
  access_token: toStringValue(pickValue(row, 'access_token', '업체접근토큰')),
  contractor_link: toStringValue(pickValue(row, 'contractor_link', '업체전용링크')),
  customer_display_name: toStringValue(pickValue(row, 'customer_display_name', '고객노출명')),
  active: toStringValue(pickValue(row, 'active', '활성여부') || 'Y'),
});

export const normalizeAssignment = (row: Record<string, unknown>): AssignmentRecord => ({
  assignment_id: toStringValue(pickValue(row, 'assignment_id', '배정ID')),
  request_id: toStringValue(pickValue(row, 'request_id', '신청ID')),
  contractor_id: toStringValue(pickValue(row, 'contractor_id', '업체ID')),
  assigned_at: toStringValue(pickValue(row, 'assigned_at', '배정일시')),
  assignment_status: toStringValue(pickValue(row, 'assignment_status', '배정상태') || '배정완료'),
  request_memo: toStringValue(pickValue(row, 'request_memo', '견적요청메모')),
  contractor_checked: toStringValue(pickValue(row, 'contractor_checked', '업체확인여부') || 'N'),
  estimate_submitted: toStringValue(pickValue(row, 'estimate_submitted', '견적제출여부') || 'N'),
  internal_memo: toStringValue(pickValue(row, 'internal_memo', '내부메모')),
});

export const normalizeCustomerAction = (row: Record<string, unknown>): CustomerActionRecord => ({
  action_id: toStringValue(pickValue(row, 'action_id', '액션ID')),
  request_id: toStringValue(pickValue(row, 'request_id', '신청ID')),
  selected_quote_id: toStringValue(pickValue(row, 'selected_quote_id', '선택견적ID')),
  action_type: toStringValue(pickValue(row, 'action_type', '액션유형')),
  action_label: toStringValue(pickValue(row, 'action_label', '액션명')),
  created_at: toStringValue(pickValue(row, 'created_at', '생성일시')),
  memo: toStringValue(pickValue(row, 'memo', '메모')),
});

export const demoRequests: RequestRecord[] = [
  {
    request_id: 'req_demo_bundang_wall',
    created_at: new Date().toISOString(),
    user_name: '테스트 고객',
    user_contact: '010-0000-0000',
    contact_preference: '문자',
    region: '성남시 분당구',
    damage_type: '벽지',
    damage_scope: '벽/장판 일부',
    housing_type: '빌라·연립',
    room_type: '원룸',
    area_text: '4평',
    material_match: '없음',
    damage_position: '하단',
    repair_intent: '부분만 원함',
    furniture_level: '일부 있음',
    schedule: '1주일 이내',
    user_memo: '퇴거 전 부분 복구 견적을 먼저 비교하고 싶습니다.',
    image_count: 3,
    photo_urls: '',
    estimated_min: 180000,
    estimated_max: 280000,
    confidence: 72,
    confidence_label: '높음',
    status: '입찰대기',
  },
  {
    request_id: 'req_demo_floor',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    user_name: '테스트 고객',
    user_contact: '010-0000-0000',
    contact_preference: '전화 가능',
    region: '성남시 수정구',
    damage_type: '장판',
    damage_scope: 'A4 크기',
    housing_type: '오피스텔',
    room_type: '원룸',
    area_text: '6평',
    material_match: '모르겠음',
    damage_position: '하단',
    repair_intent: '전체도 가능',
    furniture_level: '없음',
    schedule: '협의 가능',
    user_memo: '사진 기준 견적 가능 여부를 알고 싶습니다.',
    image_count: 2,
    photo_urls: '',
    estimated_min: 120000,
    estimated_max: 210000,
    confidence: 64,
    confidence_label: '보통',
    status: '입찰대기',
  },
  {
    request_id: 'req_demo_molding_needsinfo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    user_name: '테스트 고객',
    user_contact: '010-0000-0000',
    contact_preference: '문자',
    region: '성남시 분당구',
    damage_type: '몰딩',
    damage_scope: '문틀 모서리 일부',
    housing_type: '아파트',
    room_type: '거실',
    area_text: '',
    material_match: '모르겠음',
    damage_position: '하단',
    repair_intent: '시공 범위 확인',
    furniture_level: '없음',
    schedule: '협의 가능',
    user_memo: '문틀 모서리가 뜯겨서 사진을 올렸어요.',
    image_count: 1,
    photo_urls: '',
    estimated_min: 0,
    estimated_max: 0,
    confidence: 0,
    confidence_label: '확인 필요',
    status: '보완요청',
  },
];

export const demoBids: BidRecord[] = [
  {
    bid_id: 'bid_demo_bundang_a',
    request_id: 'req_demo_bundang_wall',
    submitted_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    contractor_id: 'C-DEMO-001',
    contractor_name: '분당 도배장판 시공팀',
    contractor_contact: '010-1234-5678',
    contractor_region: '성남시 분당구',
    platform: '데모',
    is_verified: true,
    rating: 4.8,
    review_count: 32,
    completed_count: 12,
    bid_amount: '180000',
    bid_amount_display: '18만원',
    work_scope: '벽지 부분복구 기준',
    included_items: '도배지, 인건비, 폐자재 처리',
    excluded_items: '몰딩 교체, 곰팡이 제거',
    extra_cost_conditions: '동일 벽지가 단종된 경우 유사 색상으로 진행될 수 있어요.',
    available_date: '이번 주 토요일 오후 가능',
    visit_required: '필요 (실측 10분)',
    above_range_reason: '',
    contractor_memo: '입주 전 깔끔하게 마무리해 드릴게요.',
    bid_status: '제출',
    customer_visible: true,
    customer_display_name: '업체 A',
  },
  {
    bid_id: 'bid_demo_bundang_b',
    request_id: 'req_demo_bundang_wall',
    submitted_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    contractor_id: 'C-DEMO-002',
    contractor_name: '정자동 홈리폼',
    contractor_contact: '010-9876-5432',
    contractor_region: '성남시 분당구',
    platform: '데모',
    is_verified: true,
    rating: 4.6,
    review_count: 18,
    completed_count: 8,
    bid_amount: '250000',
    bid_amount_display: '25만원',
    work_scope: '벽지 전체 교체 기준',
    included_items: '도배지, 시공비, 자재 운반비',
    excluded_items: '가구 이동, 콘센트 커버 교체',
    extra_cost_conditions: '곰팡이가 발견되면 별도 협의 후 진행돼요.',
    available_date: '평일 오전 방문 가능',
    visit_required: '불필요 (사진 기준 진행)',
    above_range_reason: '',
    contractor_memo: '사진만으로도 정확한 견적을 드릴 수 있어요.',
    bid_status: '제출',
    customer_visible: true,
    customer_display_name: '업체 B',
  },
];
