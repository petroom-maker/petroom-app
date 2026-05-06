'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RequestRecord } from '@/lib/petroom-data';

const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export default function ContractorRequestsPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [source, setSource] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      const response = await fetch('/api/requests', { cache: 'no-store' });
      const result = await response.json();

      setRequests(result.requests ?? []);
      setSource(result.source ?? '');
      setIsLoading(false);
    };

    loadRequests().catch(() => {
      setRequests([]);
      setSource('error');
      setIsLoading(false);
    });
  }, []);

  const card = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
  };

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '22px' }}>
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ display: 'block', width: '96px', margin: '0 auto 8px' }}
          />
          <h1 style={{ margin: 0, color: '#1a4a5e', fontSize: '26px', lineHeight: 1.2 }}>
            업체 요청함
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
            유저가 입력한 조건을 보고 실제 가능한 견적을 제출해주세요.
          </p>
        </header>

        {source === 'demo' && (
          <section
            style={{
              ...card,
              marginBottom: '14px',
              background: '#fff7ed',
              borderColor: '#fed7aa',
              color: '#9a3412',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            Google Sheets 읽기 설정 전이라 데모 요청을 표시하고 있습니다. Apps Script에 읽기
            기능을 추가하면 실제 접수 요청이 이 화면에 표시됩니다.
          </section>
        )}

        <section style={{ display: 'grid', gap: '12px' }}>
          {isLoading && (
            <div style={{ ...card, color: '#64748b', fontSize: '14px' }}>요청서를 불러오는 중입니다.</div>
          )}

          {!isLoading && requests.length === 0 && (
            <div style={{ ...card, color: '#64748b', fontSize: '14px' }}>
              아직 입찰 가능한 요청서가 없습니다.
            </div>
          )}

          {requests.map((request) => (
            <Link
              key={request.request_id}
              href={`/contractor/requests/${request.request_id}`}
              style={{ textDecoration: 'none' }}
            >
              <article style={card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#16a34a', fontSize: '12px', fontWeight: 800 }}>
                      {request.status || '입찰대기'}
                    </p>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '19px', lineHeight: 1.35 }}>
                      {request.region} · {request.damage_type}
                    </h2>
                  </div>
                  <strong style={{ color: '#1a4a5e', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    상세 보기
                  </strong>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px',
                    color: '#475569',
                    fontSize: '13px',
                    lineHeight: 1.45,
                  }}
                >
                  <span>범위: {request.damage_scope}</span>
                  <span>공간: {request.room_type || request.area_text}</span>
                  <span>일정: {request.schedule}</span>
                  <span>사진: {request.image_count}장</span>
                </div>

                <p style={{ margin: '12px 0 0', color: '#16a34a', fontSize: '18px', fontWeight: 900 }}>
                  {formatWon(request.estimated_min)} ~ {formatWon(request.estimated_max)}
                </p>
              </article>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
