export type EstimateInput = {
  area?: string;
  damageType: string;
  damageRange: string;
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
};

export const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export const getAreaNumber = (area = '') => {
  const match = area.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

export const getTrustScore = (imageCount = 0) => {
  if (imageCount === 0) {
    return 0;
  }

  if (imageCount <= 2) {
    return 50;
  }

  if (imageCount <= 5) {
    return 70;
  }

  return 82;
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

  if (sameMaterial === '없음' || sameMaterial === '모르겠음') {
    adjustment += 15000;
  }

  if (stuff === '일부 있음') {
    adjustment += 10000;
  } else if (stuff === '많음') {
    adjustment += 20000;
  }

  if (schedule === '3일 이내') {
    adjustment += 15000;
  }

  if (hasMultipleDamagedAreas(damageType, damageRange, damagePosition)) {
    adjustment += 20000;
  }

  if (isWallpaperPartialRepair({ damageType, damageRange, repairIntent })) {
    const minBase = areaNumber !== null && areaNumber >= 10 ? 200000 : 180000;
    const uncappedMaxPrice = 250000 + adjustment;

    return {
      minPrice: Math.min(minBase, 250000),
      maxPrice: 250000,
      cautionMessage:
        uncappedMaxPrice > 250000
          ? '부분 보수 기준을 초과할 수 있어 전체 시공 또는 현장 확인이 필요할 수 있습니다.'
          : null,
    };
  }

  return {
    minPrice: 180000 + Math.round(adjustment * 0.5),
    maxPrice: Math.min(250000 + adjustment, 320000),
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
    cautionMessage: null,
  };
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
  const confidence = getTrustScore(input.imageCount);

  return {
    ...range,
    confidence,
    confidenceLabel: getTrustLabel(confidence),
  };
};
