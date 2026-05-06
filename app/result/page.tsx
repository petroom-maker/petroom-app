'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getEstimateRange } from '@/lib/estimate';

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

function ResultContent() {
  const searchParams = useSearchParams();
  const mainColor = '#1a4a5e';
  const highlight = '#16a34a';
  const requestId = searchParams.get('requestId') ?? '';
  const area = searchParams.get('area') ?? '';
  const areaDisplay = formatAreaDisplay(area);
  const damageType = searchParams.get('damageType') ?? '';
  const damageRange = searchParams.get('damageRange') ?? '';
  const housingType = searchParams.get('housingType') ?? '';
  const layout = searchParams.get('layout') ?? '';
  const location = searchParams.get('location') ?? '';
  const sameMaterial = searchParams.get('sameMaterial') ?? '';
  const stuff = searchParams.get('stuff') ?? '';
  const schedule = searchParams.get('schedule') ?? '';
  const damagePosition = searchParams.get('damagePosition') ?? '';
  const repairIntent = searchParams.get('repairIntent') ?? '';
  const imageCountParam = Number(searchParams.get('imageCount') ?? '0');
  const imageCount = Number.isFinite(imageCountParam) ? imageCountParam : 0;
  const estimate = getEstimateRange({
    area,
    damageType,
    damageRange,
    housingType,
    layout,
    location,
    sameMaterial,
    stuff,
    schedule,
    damagePosition,
    repairIntent,
    imageCount,
  });
  const trustScore = estimate.confidence;
  const trustLabel = estimate.confidenceLabel;
  const minPrice = Number(searchParams.get('estimatedMin') ?? estimate.minPrice);
  const maxPrice = Number(searchParams.get('estimatedMax') ?? estimate.maxPrice);
  const cautionMessage = estimate.cautionMessage;
  const summaryItems = [
    ['파손 유형', damageType],
    ['파손 범위', damageRange],
    ['면적', areaDisplay],
    ['공간 구조', layout],
    ['주거 유형', normalizeHousingType(housingType)],
    ['동일 자재 여부', sameMaterial],
    ['파손 위치', damagePosition],
    ['복구 방식', repairIntent],
    ['짐 여부', stuff],
    ['일정', schedule],
    ['지역', location],
    ['사진 수', `${imageCount}장`],
  ].filter(([, value]) => value);
  const analysisItems = [
    '부분 시공 가능성이 높습니다',
    '일부 업체는 전체 시공을 권유할 수 있습니다',
    '사진 기준 견적을 요청하는 것이 유리합니다',
    cautionMessage,
  ].filter((item): item is string => Boolean(item));

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

          {requestId && (
            <p
              style={{
                margin: '10px 0 0',
                color: '#166534',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              요청 ID: {requestId}
            </p>
          )}
        </section>

        <section style={{ ...card, marginBottom: '14px' }}>
          <h2 style={sectionTitle}>견적 범위 산정 근거</h2>
          <p style={{ margin: '0 0 12px', color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
            이 금액은 확정가가 아니라, 입력 정보와 현재 가격 기준을 조합한 예상 가드레일입니다.
            업체 입찰가는 현장 조건에 따라 범위 안팎으로 달라질 수 있습니다.
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gap: '10px',
            }}
          >
            {estimate.reasons.map((item) => (
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

        <details style={{ ...card, marginBottom: '14px' }}>
          <summary
            style={{
              ...sectionTitle,
              margin: 0,
              cursor: 'pointer',
              listStyle: 'none',
            }}
          >
            입력 정보 요약 펼쳐보기
          </summary>
          <ul
            style={{
              margin: '14px 0 0',
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
        </details>

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
            신뢰도는 사진 수뿐 아니라 면적, 자재 여부, 주거 유형, 일정 등 견적에 필요한
            정보가 얼마나 구체적인지를 함께 반영합니다.
          </p>
          <ul
            style={{
              margin: '12px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gap: '8px',
            }}
          >
            {estimate.confidenceReasons.map((reason) => (
              <li
                key={reason}
                style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}
              >
                {reason}
              </li>
            ))}
          </ul>
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
            {analysisItems.map((item) => (
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

        {requestId && (
          <section style={{ ...card, marginTop: '14px', borderColor: '#cbd5e1' }}>
            <h2 style={sectionTitle}>업체 견적 입찰 링크</h2>
            <p style={{ margin: '0 0 12px', color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
              시공업체에게 아래 링크와 요청 ID를 전달하면, 같은 요청서를 기준으로 견적을
              제출할 수 있습니다.
            </p>
            <a
              href={`/contractor?requestId=${encodeURIComponent(requestId)}&min=${minPrice}&max=${maxPrice}`}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: mainColor,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 800,
              }}
            >
              업체 견적 입력 화면 열기
            </a>
          </section>
        )}
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
