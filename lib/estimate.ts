export type EstimateInput = {
  area?: string;
  damageType: string;
  damageRange: string;
  housingType?: string;
  layout?: string;
  location?: string;
  sameMaterial: string;
  stuff: string;
  schedule: string;
  damagePosition: string;
  repairIntent: string;
  imageCount?: number;
};

export type EstimateResult = {
  minPrice: number;
  maxPrice: number;
  confidence: number;
  confidenceLabel: string;
  cautionMessage: string | null;
  reasons: string[];
  confidenceReasons: string[];
};

export const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export const getAreaNumber = (area = '') => {
  const match = area.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

export const getTrustScore = ({
  imageCount = 0,
  area,
  housingType,
  layout,
  location,
  sameMaterial,
  stuff,
  schedule,
}: Pick<
  EstimateInput,
  'area' | 'housingType' | 'layout' | 'location' | 'sameMaterial' | 'stuff' | 'schedule' | 'imageCount'
>) => {
  if (imageCount === 0) {
    return 0;
  }

  let score = 35;

  score += Math.min(imageCount, 6) * 5;

  if (area && getAreaNumber(area) !== null) {
    score += 10;
  } else if (area) {
    score += 5;
  }

  if (housingType) {
    score += 5;
  }

  if (layout && layout !== '잘 모르겠음') {
    score += 5;
  }

  if (location) {
    score += 5;
  }

  if (sameMaterial && sameMaterial !== '모르겠음') {
    score += 7;
  }

  if (stuff) {
    score += 4;
  }

  if (schedule) {
    score += 4;
  }

  return Math.min(score, 90);
};

export const getTrustLabel = (trustScore: number) => {
  if (trustScore === 0) {
    return '산출 불가';
  }

  if (trustScore < 60) {
    return '보통';
  }

  if (trustScore < 80) {
    return '양호';
  }

  return '높음';
};

const isFullReplacement = (damageRange: string, repairIntent: string) =>
  damageRange.includes('전체') || repairIntent.includes('전체');

const indicatesPartialOrSmallDamage = (damageRange: string) =>
  damageRange.includes('부분') ||
  damageRange.includes('일부') ||
  damageRange.includes('손바닥') ||
  damageRange.includes('A4');

const isWallpaperPartialRepair = ({
  damageType,
  damageRange,
  repairIntent,
}: Pick<EstimateInput, 'damageType' | 'damageRange' | 'repairIntent'>) =>
  damageType === '벽지' &&
  (repairIntent === '부분만 원함' || indicatesPartialOrSmallDamage(damageRange));

const hasMultipleDamagedAreas = (
  damageType: string,
  damageRange: string,
  damagePosition: string,
) =>
  damageType.includes('+') ||
  damageRange.includes('절반') ||
  damageRange.includes('전체') ||
  damagePosition === '혼합';

const getPartialRepairRange = ({
  areaNumber,
  damageType,
  damageRange,
  sameMaterial,
  stuff,
  schedule,
  damagePosition,
  repairIntent,
}: EstimateInput & { areaNumber: number | null }) => {
  let adjustment = 0;
  const reasons = ['기본 부분 복구 범위 18만~25만원에서 시작합니다.'];

  if (sameMaterial === '없음' || sameMaterial === '모르겠음') {
    adjustment += 15000;
    reasons.push('동일 자재가 없거나 불확실해 자재 매칭 비용 가능성을 반영했습니다.');
  }

  if (stuff === '일부 있음') {
    adjustment += 10000;
    reasons.push('작업 공간에 일부 짐이 있어 이동 시간을 일부 반영했습니다.');
  } else if (stuff === '많음') {
    adjustment += 20000;
    reasons.push('작업 공간에 짐이 많아 이동·정리 시간을 반영했습니다.');
  }

  if (schedule === '3일 이내') {
    adjustment += 15000;
    reasons.push('3일 이내 급한 일정으로 긴급 작업 가능성을 반영했습니다.');
  }

  if (hasMultipleDamagedAreas(damageType, damageRange, damagePosition)) {
    adjustment += 20000;
    reasons.push('훼손 범위가 여러 위치이거나 넓어 추가 작업 가능성을 반영했습니다.');
  }

  if (isWallpaperPartialRepair({ damageType, damageRange, repairIntent })) {
    const minBase = areaNumber !== null && areaNumber >= 10 ? 200000 : 180000;
    const uncappedMaxPrice = 250000 + adjustment;

    return {
      minPrice: Math.min(minBase, 250000),
      maxPrice: 250000,
      reasons,
      cautionMessage:
        uncappedMaxPrice > 250000
          ? '부분 보수 기준을 초과할 수 있어 전체 시공 또는 현장 확인이 필요할 수 있습니다.'
          : null,
    };
  }

  return {
    minPrice: 180000 + Math.round(adjustment * 0.5),
    maxPrice: Math.min(250000 + adjustment, 320000),
    reasons,
    cautionMessage: null,
  };
};

const getFullReplacementRange = (areaNumber: number | null) => {
  const area = areaNumber ?? 6;
  const minUnitPrice = 42000;
  const maxUnitPrice = 60000;

  return {
    minPrice: Math.max(Math.round((area * minUnitPrice) / 10000) * 10000, 250000),
    maxPrice: Math.max(Math.round((area * maxUnitPrice) / 10000) * 10000, 360000),
    reasons: [
      '방 전체 또는 전체 시공 가능성이 있어 평당 단가 기준으로 계산했습니다.',
      `입력 면적은 ${area}평 기준으로 반영했습니다.`,
    ],
    cautionMessage: null,
  };
};

const getConfidenceReasons = (input: EstimateInput) => {
  const reasons = [`사진 ${input.imageCount ?? 0}장 기준으로 현장 판단 신뢰도를 반영했습니다.`];

  if (input.area && getAreaNumber(input.area) !== null) {
    reasons.push('면적이 숫자로 입력되어 단가 계산 정확도가 올라갑니다.');
  } else if (input.area) {
    reasons.push('면적이 텍스트로 입력되어 대략 범위만 반영했습니다.');
  } else {
    reasons.push('면적 정보가 없어 기본 면적 기준을 사용했습니다.');
  }

  if (input.sameMaterial === '모르겠음') {
    reasons.push('동일 자재 여부가 불확실해 신뢰도가 제한됩니다.');
  }

  return reasons;
};

export const getEstimateRange = (input: EstimateInput): EstimateResult => {
  const areaNumber = getAreaNumber(input.area);
  const partialRepairRange = getPartialRepairRange({
    ...input,
    areaNumber,
  });
  const range = isWallpaperPartialRepair(input)
    ? partialRepairRange
    : isFullReplacement(input.damageRange, input.repairIntent)
      ? getFullReplacementRange(areaNumber)
      : partialRepairRange;
  const confidence = getTrustScore(input);

  return {
    ...range,
    confidence,
    confidenceLabel: getTrustLabel(confidence),
    confidenceReasons: getConfidenceReasons(input),
  };
};
