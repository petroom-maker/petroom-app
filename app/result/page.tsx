'use client';

import { Suspense } from 'react';
import Link from 'next/link';
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
  const minPrice = Number(searchParams.get('estimatedMin') ?? estimate.minPrice);
  const maxPrice = Number(searchParams.get('estimatedMax') ?? estimate.maxPrice);
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
  const card = {
    background: '#fff',
    padding: '18px',
    borderRadius: '22px',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: '0 14px 34px rgba(26, 74, 94, 0.08)',
  };

  const sectionTitle = {
    margin: '0 0 10px',
    color: mainColor,
    fontSize: '16px',
    fontWeight: 700,
  };

  return (
    <main
      style={{
        padding: '18px 16px 28px',
        background: 'linear-gradient(180deg, #e6f2ef 0%, #f8fbfa 48%, #eef4f3 100%)',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/petroom-logo-transparent.png"
              alt="PET ROOM"
              style={{
                display: 'block',
                width: '54px',
                height: '54px',
                objectFit: 'contain',
              }}
            />
            <div>
              <p style={{ margin: '0 0 3px', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                PET ROOM
              </p>
              <h1 style={{ margin: 0, color: mainColor, fontSize: '20px', lineHeight: 1.2 }}>
                견적 결과
              </h1>
            </div>
          </div>
          <span
            style={{
              padding: '8px 10px',
              borderRadius: '999px',
              background: '#e8f6ef',
              color: '#166534',
              fontSize: '12px',
              fontWeight: 900,
              border: '1px solid #bbf7d0',
            }}
          >
            접수 완료
          </span>
        </header>

        <nav
          aria-label="앱 메뉴"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          {[
            ['홈', '/'],
            ['견적함', '/?screen=quotes'],
            ['나눔', '/?screen=market'],
            ['집찾기', '/?screen=homes'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              style={{
                minHeight: '42px',
                border: '1px solid #e7ddc8',
                borderRadius: '16px',
                background: label === '홈' ? '#faf0ca' : '#fffdf7',
                color: mainColor,
                display: 'grid',
                placeItems: 'center',
                fontSize: '13px',
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <section
          style={{
            ...card,
            marginBottom: '14px',
            borderColor: '#1a4a5e',
            background: mainColor,
            color: '#fff',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#bbf7d0',
              fontSize: '14px',
              fontWeight: 900,
            }}
          >
            예상 견적 결과
          </p>

          <h1
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '24px',
              lineHeight: 1.35,
              letterSpacing: 0,
            }}
          >
            지금 조건에서 예상되는 복구비
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              color: '#bbf7d0',
              fontSize: '30px',
              lineHeight: 1.25,
              fontWeight: 900,
              letterSpacing: 0,
            }}
          >
            {formatWon(minPrice)} ~ {formatWon(maxPrice)}
          </p>

          {requestId && (
            <p
              style={{
                margin: '10px 0 0',
                color: '#d9f99d',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              요청 ID: {requestId}
            </p>
          )}
        </section>

        {requestId && (
          <section style={{ ...card, marginBottom: '14px', borderColor: '#bbf7d0' }}>
            <p
              style={{
                margin: '0 0 8px',
                color: '#166534',
                fontSize: '13px',
                fontWeight: 900,
              }}
            >
              앱에서 바로 확인
            </p>
            <h2 style={{ ...sectionTitle, marginBottom: '8px' }}>업체 입찰 대기중</h2>
            <p style={{ margin: '0 0 14px', color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
              업체가 입찰하면 견적 현황에 자동 반영됩니다.
            </p>
            <Link
              href={`/requests/${requestId}`}
              style={{
                display: 'block',
                padding: '15px',
                borderRadius: '14px',
                background: mainColor,
                color: '#fff',
                fontSize: '15px',
                fontWeight: 900,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              실시간 견적 현황 보기
            </Link>
          </section>
        )}

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
