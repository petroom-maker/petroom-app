'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStatusLabel, type RequestRecord } from '@/lib/petroom-data';
import type { AppScreen } from './types';

const timelineSteps = ['신청 완료', '매칭 중', '견적 도착', '업체 선택', '시공 완료'];

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '신청일 확인 중';
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const getTimelineIndex = (request: RequestRecord) => {
  if (request.status === '완료') {
    return 4;
  }

  if (request.status === '보완요청') {
    return 1;
  }

  return 1;
};

const Timeline = ({ activeIndex }: { activeIndex: number }) => (
  <ol className="mt-5 space-y-0">
    {timelineSteps.map((step, index) => {
      const done = index < activeIndex;
      const active = index === activeIndex;
      const upcoming = index > activeIndex;

      return (
        <li key={step} className="grid grid-cols-[22px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`mt-0.5 h-3.5 w-3.5 rounded-full ${
                done ? 'bg-success' : active ? 'petroom-live-dot bg-accent' : 'border border-[#C4BDB8] bg-white'
              }`}
            />
            {index !== timelineSteps.length - 1 && (
              <span className={`mt-1 h-7 border-l border-dashed ${upcoming ? 'border-[#E8E6E1]' : 'border-success/40'}`} />
            )}
          </div>
          <p className={`pb-4 text-sm font-black ${done || active ? 'text-[#1A1A1A]' : 'text-[#C4BDB8]'}`}>{step}</p>
        </li>
      );
    })}
  </ol>
);

export const ReceivedQuotesScreen = ({ onChangeScreen }: { onChangeScreen: (screen: AppScreen) => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RequestRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const storedIds =
      typeof window === 'undefined'
        ? []
        : JSON.parse(window.localStorage.getItem('petroom_recent_request_ids') ?? '[]');
    const requestIds = Array.isArray(storedIds) ? storedIds.filter((item) => typeof item === 'string') : [];

    if (requestIds.length === 0) {
      setRequests([]);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    Promise.all(
      requestIds.map((requestId) =>
        fetch(`/api/requests/${encodeURIComponent(requestId)}`)
          .then((response) => response.json())
          .then((result) => result.request as RequestRecord | null)
          .catch(() => null),
      ),
    )
      .then((result) => {
        if (!cancelled) {
          setRequests(result.filter(Boolean) as RequestRecord[]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeRequests = requests.filter((item) => item.status !== '완료');
  const completedRequests = requests.filter((item) => item.status === '완료');

  return (
    <div className="space-y-6">
      <header className="-mx-5 -mt-4 flex h-14 items-center border-b border-warm-border bg-white px-5">
        <h1 className="text-lg font-black text-navy">내 견적 현황</h1>
      </header>

      {isLoading && <p className="text-sm font-bold text-warm-caption">견적 현황을 불러오는 중...</p>}

      {!isLoading && requests.length === 0 && (
        <section className="petroom-card rounded-2xl p-6 text-center">
          <p className="text-base font-black text-navy">아직 진행 중인 견적이 없어요</p>
          <p className="mt-2 text-sm leading-relaxed text-warm-muted">훼손 사진을 올리면 펫룸이 먼저 확인하고 1차 견적 범위를 안내드려요.</p>
          <button
            type="button"
            onClick={() => onChangeScreen('estimate')}
            className="petroom-cta mt-5 h-[52px] w-full rounded-xl px-6 text-base font-black text-white"
          >
            견적 신청하기
          </button>
        </section>
      )}

      {activeRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px] font-black text-navy">진행 중인 견적 {activeRequests.length}건</h2>
          <div className="space-y-3">
            {activeRequests.map((request) => (
              <Link key={request.request_id} href={`/requests/${request.request_id}`} className="petroom-card block rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-[#1A1A1A]">
                      {request.damage_type} 훼손 · {request.region || '지역 확인 중'}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-warm-caption">신청일 {formatDate(request.created_at)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-coral-pale px-3 py-1 text-xs font-black text-accent">
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <Timeline activeIndex={getTimelineIndex(request)} />
                <div className="mt-1 rounded-xl bg-coral-pale px-4 py-3">
                  <p className="text-xs font-bold leading-relaxed text-warm-muted">
                    담당자가 사진과 진행 가능성을 확인한 뒤, 시공 가능한 업체 기준으로 견적 범위를 정리해드려요.
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {completedRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px] font-black text-[#1A1A1A]">완료된 견적 {completedRequests.length}건</h2>
          <div className="space-y-2">
            {completedRequests.map((request) => (
              <Link
                key={request.request_id}
                href={`/requests/${request.request_id}`}
                className="flex items-center justify-between rounded-xl border border-warm-border bg-white px-4 py-4"
              >
                <span>
                  <strong className="block text-sm font-black text-[#1A1A1A]">{request.damage_type} 복구</strong>
                  <span className="mt-0.5 block text-xs font-semibold text-warm-caption">{formatDate(request.created_at)}</span>
                </span>
                <span className="text-sm font-black text-success">완료</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
