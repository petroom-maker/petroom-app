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

export const normalizeRequest = (row: Record<string, unknown>): RequestRecord => ({
  request_id: toStringValue(row.request_id),
  created_at: toStringValue(row.created_at),
  user_name: toStringValue(row.user_name),
  user_contact: toStringValue(row.user_contact),
  contact_preference: toStringValue(row.contact_preference),
  region: toStringValue(row.region),
  damage_type: toStringValue(row.damage_type),
  damage_scope: toStringValue(row.damage_scope),
  housing_type: toStringValue(row.housing_type),
  room_type: toStringValue(row.room_type),
  area_text: toStringValue(row.area_text),
  material_match: toStringValue(row.material_match),
  damage_position: toStringValue(row.damage_position),
  repair_intent: toStringValue(row.repair_intent),
  furniture_level: toStringValue(row.furniture_level),
  schedule: toStringValue(row.schedule),
  user_memo: toStringValue(row.user_memo),
  image_count: toNumberValue(row.image_count),
  estimated_min: toNumberValue(row.estimated_min),
  estimated_max: toNumberValue(row.estimated_max),
  confidence: toNumberValue(row.confidence),
  confidence_label: toStringValue(row.confidence_label),
  status: toStringValue(row.status || '입찰대기'),
});

export const normalizeBid = (row: Record<string, unknown>): BidRecord => ({
  bid_id: toStringValue(row.bid_id),
  request_id: toStringValue(row.request_id),
  submitted_at: toStringValue(row.submitted_at),
  contractor_name: toStringValue(row.contractor_name),
  contractor_contact: toStringValue(row.contractor_contact),
  bid_amount: toStringValue(row.bid_amount),
  work_scope: toStringValue(row.work_scope),
  included_items: toStringValue(row.included_items),
  excluded_items: toStringValue(row.excluded_items),
  extra_cost_conditions: toStringValue(row.extra_cost_conditions),
  available_date: toStringValue(row.available_date),
  visit_required: toStringValue(row.visit_required),
  above_range_reason: toStringValue(row.above_range_reason),
  bid_status: toStringValue(row.bid_status || '제출'),
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
