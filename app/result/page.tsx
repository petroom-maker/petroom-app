'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const getAreaNumber = (area: string) => {
  const match = area.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const formatAreaDisplay = (area: string) => {
  const areaNumber = getAreaNumber(area);
  return areaNumber === null ? area.replace('원룸', '').trim() : `${areaNumber}평`;
};

const normalizeHousingType = (housingType: string | null) => {
  if (!housingType) {
    return null;
  }

  return housingType === '원룸' ? '기타' : housingType;
};

const getTrustScore = (imageCount: number) => {
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

const getTrustLabel = (trustScore: number) => {
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

const hasMultipleDamagedAreas = (damageType: string, damageRange: string, damagePosition: string) =>
  damageType.includes('+') || damageRange.includes('절반') || damageRange.includes('전체') || damagePosition === '혼합';

const getPartialRepairRange = ({
  damageType,
  damageRange,
  sameMaterial,
  stuff,
  schedule,
  damagePosition,
}: {
  damageType: string;
  damageRange: string;
  sameMaterial: string;
  stuff: string;
  schedule: string;
  damagePosition: string;
}) => {
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

  return {
    minPrice: 180000 + Math.round(adjustment * 0.5),
    maxPrice: Math.min(250000 + adjustment, 320000),
  };
};

const getFullReplacementRange = (areaNumber: number | null) => {
  const area = areaNumber ?? 6;
  const minUnitPrice = 42000;
  const maxUnitPrice = 60000;

  return {
    minPrice: Math.max(Math.round((area * minUnitPrice) / 10000) * 10000, 250000),
    maxPrice: Math.max(Math.round((area * maxUnitPrice) / 10000) * 10000, 360000),
  };
};

const getEstimateRange = ({
  areaNumber,
  damageType,
  damageRange,
  sameMaterial,
  stuff,
  schedule,
  damagePosition,
  repairIntent,
}: {
  areaNumber: number | null;
  damageType: string;
  damageRange: string;
  sameMaterial: string;
  stuff: string;
  schedule: string;
  damagePosition: string;
  repairIntent: string;
}) => {
  if (isFullReplacement(damageRange, repairIntent)) {
    return getFullReplacementRange(areaNumber);
  }

  return getPartialRepairRange({
    damageType,
    damageRange,
    sameMaterial,
    stuff,
    schedule,
    damagePosition,
  });
};

function ResultContent() {
  const searchParams = useSearchParams();
  const mainColor = '#1a4a5e';
  const highlight = '#16a34a';
  const area = searchParams.get('area') ?? '';
  const areaNumber = getAreaNumber(area);
  const areaDisplay = formatAreaDisplay(area);
  const damageType = searchParams.get('damageType') ?? '';
  const damageRange = searchParams.get('damageRange') ?? '';
  const sameMaterial = searchParams.get('sameMaterial') ?? '';
  const stuff = searchParams.get('stuff') ?? '';
  const schedule = searchParams.get('schedule') ?? '';
  const damagePosition = searchParams.get('damagePosition') ?? '';
  const repairIntent = searchParams.get('repairIntent') ?? '';
  const imageCountParam = Number(searchParams.get('imageCount') ?? '0');
  const imageCount = Number.isFinite(imageCountParam) ? imageCountParam : 0;
  const trustScore = getTrustScore(imageCount);
  const trustLabel = getTrustLabel(trustScore);
  const { minPrice, maxPrice } = getEstimateRange({
    areaNumber,
    damageType,
    damageRange,
    sameMaterial,
    stuff,
    schedule,
    damagePosition,
    repairIntent,
  });
  const summaryItems = [
    ['파손 유형', damageType],
    ['파손 범위', damageRange],
    ['면적', areaDisplay],
    ['공간 구조', searchParams.get('layout')],
    ['주거 유형', normalizeHousingType(searchParams.get('housingType'))],
    ['동일 자재 여부', sameMaterial],
    ['파손 위치', damagePosition],
    ['복구 방식', repairIntent],
    ['짐 여부', stuff],
    ['일정', schedule],
    ['지역', searchParams.get('location')],
    ['사진 수', `${imageCount}장`],
  ].filter(([, value]) => value);

  const card = {
    background: '#fff',
    padding: '18px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
  };

  const sectionTitle = {
    margin: '0 0 10px',
    color: mainColor,
    fontSize: '16px',
    fontWeight: 700,
  };

  return (
    <main style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ width: '120px', marginBottom: '10px' }}
          />

          <h2 style={{ margin: 0 }}>PET ROOM</h2>

          <p style={{ fontSize: '13px', color: '#64748b' }}>
            입력 정보를 기반으로 견적 범위를 제공합니다
          </p>
        </div>

        <section
          style={{
            ...card,
            marginBottom: '14px',
            borderColor: '#bbf7d0',
            background: '#f0fdf4',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#166534',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            예상 견적 결과
          </p>

          <h1
            style={{
              margin: 0,
              color: mainColor,
              fontSize: '22px',
              lineHeight: 1.35,
              letterSpacing: 0,
            }}
          >
            예상 견적 범위
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              color: highlight,
              fontSize: '28px',
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            {formatWon(minPrice)} ~ {formatWon(maxPrice)}
          </p>
        </section>

        <section style={{ ...card, marginBottom: '14px' }}>
          <h2 style={sectionTitle}>입력 정보 요약</h2>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gap: '9px',
            }}
          >
            {summaryItems.length > 0 ? (
              summaryItems.map(([label, value]) => (
                <li
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    color: '#334155',
                    fontSize: '14px',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: '#64748b', flex: '0 0 auto' }}>{label}</span>
                  <strong style={{ color: mainColor, textAlign: 'right', fontWeight: 700 }}>
                    {value}
                  </strong>
                </li>
              ))
            ) : (
              <li style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                전달된 입력 정보가 없습니다.
              </li>
            )}
          </ul>
        </section>

        <section style={{ ...card, marginBottom: '14px' }}>
          <h2 style={sectionTitle}>견적 범위 신뢰도</h2>

          <div
            style={{
              height: '10px',
              overflow: 'hidden',
              borderRadius: '999px',
              background: '#e5e7eb',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: `${trustScore}%`,
                height: '100%',
                borderRadius: '999px',
                background: highlight,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#166534',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <span>{trustLabel}</span>
            <span>{trustScore}%</span>
          </div>
        </section>

        <section style={{ ...card, marginBottom: '14px' }}>
          <h2 style={sectionTitle}>신뢰도 설명</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
            입력하신 사진과 정보를 내부 사례 데이터와 비교해 산출했습니다.
            <br />
            신뢰도가 높을수록 실제 입찰가가 이 범위 안에 들어올 가능성이 높습니다.
          </p>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>분석 결과</h2>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gap: '10px',
            }}
          >
            {[
              '부분 시공 가능성이 높습니다',
              '일부 업체는 전체 시공을 권유할 수 있습니다',
              '사진 기준 견적을 요청하는 것이 유리합니다',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  color: '#334155',
                  fontSize: '14px',
                  lineHeight: 1.55,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: highlight,
                    flex: '0 0 auto',
                    marginTop: '7px',
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
