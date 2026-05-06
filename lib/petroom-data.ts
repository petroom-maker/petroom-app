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
  estimated_min: number;
  estimated_max: number;
  confidence: number;
  confidence_label: string;
  status: string;
};

export type BidRecord = {
  bid_id: string;
  request_id: string;
  submitted_at: string;
  contractor_name: string;
  contractor_contact: string;
  bid_amount: string;
  work_scope: string;
  included_items: string;
  excluded_items: string;
  extra_cost_conditions: string;
  available_date: string;
  visit_required: string;
  above_range_reason: string;
  bid_status: string;
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

export const normalizeRequest = (row: Record<string, unknown>): RequestRecord => ({
  request_id: toStringValue(pickValue(row, 'request_id', '요청ID')),
  created_at: toStringValue(pickValue(row, 'created_at', '요청일시')),
  user_name: toStringValue(pickValue(row, 'user_name', '고객명')),
  user_contact: toStringValue(pickValue(row, 'user_contact', '고객연락처')),
  contact_preference: toStringValue(pickValue(row, 'contact_preference', '선호연락방식')),
  region: toStringValue(pickValue(row, 'region', '지역')),
  damage_type: toStringValue(pickValue(row, 'damage_type', '파손유형')),
  damage_scope: toStringValue(pickValue(row, 'damage_scope', '파손범위')),
  housing_type: toStringValue(pickValue(row, 'housing_type', '주거유형')),
  room_type: toStringValue(pickValue(row, 'room_type', '공간구조')),
  area_text: toStringValue(pickValue(row, 'area_text', '면적')),
  material_match: toStringValue(pickValue(row, 'material_match', '동일자재여부')),
  damage_position: toStringValue(pickValue(row, 'damage_position', '파손위치')),
  repair_intent: toStringValue(pickValue(row, 'repair_intent', '복구방식')),
  furniture_level: toStringValue(pickValue(row, 'furniture_level', '짐여부')),
  schedule: toStringValue(pickValue(row, 'schedule', '희망일정')),
  user_memo: toStringValue(pickValue(row, 'user_memo', '고객메모')),
  image_count: toNumberValue(pickValue(row, 'image_count', '사진수')),
  estimated_min: toNumberValue(pickValue(row, 'estimated_min', '예상최소금액')),
  estimated_max: toNumberValue(pickValue(row, 'estimated_max', '예상최대금액')),
  confidence: toNumberValue(pickValue(row, 'confidence', '신뢰도')),
  confidence_label: toStringValue(pickValue(row, 'confidence_label', '신뢰도라벨')),
  status: toStringValue(pickValue(row, 'status', '상태') || '입찰대기'),
});

export const normalizeBid = (row: Record<string, unknown>): BidRecord => ({
  bid_id: toStringValue(pickValue(row, 'bid_id', '입찰ID')),
  request_id: toStringValue(pickValue(row, 'request_id', '요청ID')),
  submitted_at: toStringValue(pickValue(row, 'submitted_at', '입찰일시')),
  contractor_name: toStringValue(pickValue(row, 'contractor_name', '업체명')),
  contractor_contact: toStringValue(pickValue(row, 'contractor_contact', '업체연락처')),
  bid_amount: toStringValue(pickValue(row, 'bid_amount', '입찰금액')),
  work_scope: toStringValue(pickValue(row, 'work_scope', '작업범위')),
  included_items: toStringValue(pickValue(row, 'included_items', '포함항목')),
  excluded_items: toStringValue(pickValue(row, 'excluded_items', '불포함항목')),
  extra_cost_conditions: toStringValue(pickValue(row, 'extra_cost_conditions', '추가비조건')),
  available_date: toStringValue(pickValue(row, 'available_date', '가능일정')),
  visit_required: toStringValue(pickValue(row, 'visit_required', '방문필요여부')),
  above_range_reason: toStringValue(pickValue(row, 'above_range_reason', '범위초과사유')),
  bid_status: toStringValue(pickValue(row, 'bid_status', '입찰상태') || '제출'),
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
    estimated_min: 120000,
    estimated_max: 210000,
    confidence: 64,
    confidence_label: '보통',
    status: '입찰대기',
  },
];
