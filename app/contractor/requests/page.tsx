'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BidRecord, RequestRecord } from '@/lib/petroom-data';

const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;
const bidWindowMs = 1000 * 60 * 60 * 24;

const getCreatedTime = (request: RequestRecord) => {
  const time = new Date(request.created_at).getTime();

  return Number.isFinite(time) ? time : 0;
};

const formatRequestDate = (value: string) => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return '요청일시 확인 필요';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const formatRemainingTime = (createdAt: string, now: number) => {
  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) {
    return '시간 확인 필요';
  }

  const remainingMs = createdTime + bidWindowMs - now;

  if (remainingMs <= 0) {
    return '마감';
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  return `${hours}시간 ${minutes}분 ${seconds.toString().padStart(2, '0')}초`;
};

export default function ContractorRequestsPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [source, setSource] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [contractorContact] = useState(() =>
    typeof window === 'undefined' ? '' : window.localStorage.getItem('petroom_contractor_contact') ?? '',
  );

  useEffect(() => {
    const loadRequests = async () => {
      const [requestsResponse, bidsResponse] = await Promise.all([
        fetch('/api/requests', { cache: 'no-store' }),
        fetch('/api/bids', { cache: 'no-store' }),
      ]);
      const result = await requestsResponse.json();
      const bidsResult = await bidsResponse.json();

      setRequests(result.requests ?? []);
      setBids(bidsResult.bids ?? []);
      setSource(result.source ?? '');
      setIsLoading(false);
    };

    loadRequests().catch(() => {
      setRequests([]);
      setBids([]);
      setSource('error');
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const orderedRequests = [...requests].sort((a, b) => getCreatedTime(a) - getCreatedTime(b));
  const myBids = contractorContact
    ? bids.filter((bid) => bid.contractor_contact === contractorContact)
    : bids;
  const completedRequestIds = new Set(myBids.map((bid) => bid.request_id));
  const pendingRequests = orderedRequests.filter((request) => !completedRequestIds.has(request.request_id));
  const completedRequests = orderedRequests.filter((request) => completedRequestIds.has(request.request_id));

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

        <section style={{ display: 'grid', gap: '16px' }}>
          {isLoading && (
            <div style={{ ...card, color: '#64748b', fontSize: '14px' }}>요청서를 불러오는 중입니다.</div>
          )}

          {!isLoading && requests.length === 0 && (
            <div style={{ ...card, color: '#64748b', fontSize: '14px' }}>
              아직 입찰 가능한 요청서가 없습니다.
            </div>
          )}

          {!isLoading && requests.length > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '6px',
                  border: '1px solid #dbe3ea',
                  borderRadius: '14px',
                  background: '#eef4f8',
                }}
              >
                {[
                  { key: 'pending' as const, label: '입찰대기 건', count: pendingRequests.length },
                  { key: 'completed' as const, label: '입찰완료 건', count: completedRequests.length },
                ].map((tab) => {
                  const active = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 10px',
                        background: active ? '#fff' : 'transparent',
                        color: active ? '#1a4a5e' : '#64748b',
                        fontSize: '14px',
                        fontWeight: 900,
                        boxShadow: active ? '0 8px 18px rgba(15, 23, 42, 0.08)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label} <span style={{ color: active ? '#16a34a' : '#94a3b8' }}>{tab.count}</span>
                    </button>
                  );
                })}
              </div>

              {activeTab === 'pending' && (
                <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h2 style={{ margin: 0, color: '#1a4a5e', fontSize: '18px' }}>입찰대기 건</h2>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 800 }}>{pendingRequests.length}건</span>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pendingRequests.length === 0 ? (
                    <div style={{ ...card, color: '#64748b', fontSize: '14px' }}>
                      현재 새로 입찰할 요청이 없습니다.
                    </div>
                  ) : (
                    pendingRequests.map((request, index) => (
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
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <strong
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '999px',
                        background: '#e0f2fe',
                        color: '#1a4a5e',
                        fontSize: '15px',
                        flex: '0 0 auto',
                      }}
                    >
                      {index + 1}
                    </strong>
                    <div>
                    <p style={{ margin: '0 0 6px', color: '#16a34a', fontSize: '12px', fontWeight: 800 }}>
                      {request.status || '입찰대기'}
                    </p>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '19px', lineHeight: 1.35 }}>
                      {request.region} · {request.damage_type}
                    </h2>
                    <p style={{ margin: '7px 0 0', color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                      요청일자: {formatRequestDate(request.created_at)}
                    </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#1a4a5e', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      상세 보기
                    </strong>
                    <p
                      style={{
                        margin: '8px 0 0',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 900,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      입찰 마감까지 {formatRemainingTime(request.created_at, now)}
                    </p>
                  </div>
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
                    ))
                  )}
                </div>
              </div>
              )}

              {activeTab === 'completed' && (
                <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 0 10px' }}>
                  <h2 style={{ margin: 0, color: '#1a4a5e', fontSize: '18px' }}>입찰완료 건</h2>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 800 }}>{completedRequests.length}건</span>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {completedRequests.length === 0 ? (
                    <div style={{ ...card, color: '#64748b', fontSize: '14px' }}>
                      아직 입찰완료로 분류된 요청이 없습니다.
                    </div>
                  ) : (
                    completedRequests.map((request, index) => (
                      <Link
                        key={request.request_id}
                        href={`/contractor/requests/${request.request_id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <article style={{ ...card, borderColor: '#bbf7d0', background: '#f7fef9' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '12px',
                              alignItems: 'flex-start',
                              marginBottom: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                              <strong
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '999px',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontSize: '15px',
                                  flex: '0 0 auto',
                                }}
                              >
                                {index + 1}
                              </strong>
                              <div>
                                <p style={{ margin: '0 0 6px', color: '#15803d', fontSize: '12px', fontWeight: 900 }}>
                                  입찰완료
                                </p>
                                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '19px', lineHeight: 1.35 }}>
                                  {request.region} · {request.damage_type}
                                </h2>
                                <p style={{ margin: '7px 0 0', color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                                  요청일자: {formatRequestDate(request.created_at)}
                                </p>
                              </div>
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
                    ))
                  )}
                </div>
              </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
