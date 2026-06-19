'use client';

import { useEffect, useState } from 'react';
import { getStatusLabel, type RequestRecord } from '@/lib/petroom-data';
import { LineIcon } from './icons';
import type { AppScreen } from './types';

const RECENT_REQUEST_IDS_KEY = 'petroom_recent_request_ids';
const REQUEST_TOKENS_KEY = 'petroom_request_tokens';

const steps = ['접수 완료', '견적 정리 중', '업체 매칭 중', '시공 완료'];

const readRecentRequestIds = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_REQUEST_IDS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string' && Boolean(id.trim())) : [];
  } catch {
    return [];
  }
};

const readRequestTokens = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(REQUEST_TOKENS_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return '접수일 확인 중';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\\. /g, '.')
    .replace(/\\.$/, '');
};

const getRequestTitle = (request: RequestRecord) => {
  const target = request.room_type || request.housing_type || '원상복구';
  const damage = request.damage_type || '손상 부위 확인 중';

  return `${target} ${damage}`;
};

const getCurrentStepIndex = (status: string) => {
  if (status === 'COMPLETED' || status === 'CLOSED') {
    return 3;
  }

  if (status === 'CONNECT_REQUESTED' || status === 'RESULT_SENT' || status === 'QUOTE_READY') {
    return 2;
  }

  if (status === 'CONTACTING_CONTRACTORS' || status === 'REVIEWING') {
    return 1;
  }

  if (status === 'RECEIVED') {
    return 0;
  }

  const label = getStatusLabel(status);

  if (label.includes('시공')) {
    return 3;
  }

  if (label.includes('업체') || label.includes('매칭') || label.includes('입찰')) {
    return 2;
  }

  if (label.includes('견적') || label.includes('정리')) {
    return 1;
  }

  return 0;
};

export const ProgressScreen = ({ onChangeScreen }: { onChangeScreen: (screen: AppScreen) => void }) => {
  const [requestIds, setRequestIds] = useState<string[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const request = requests[0];
  const currentStepIndex = request ? getCurrentStepIndex(request.status) : 0;

  useEffect(() => {
    let active = true;
    const ids = readRecentRequestIds();
    const tokens = readRequestTokens();
    setRequestIds(ids);

    if (ids.length === 0) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const loadRequests = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const token = tokens[id];
            if (!token) {
              return null;
            }
            const response = await fetch(
              `/api/requests/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
              { cache: 'no-store' },
            );

            if (!response.ok) {
              return null;
            }

            const result = await response.json();
            return result.request ? (result.request as RequestRecord) : null;
          }),
        );

        if (!active) {
          return;
        }

        setRequests(results.filter((item): item is RequestRecord => Boolean(item)));
      } catch {
        if (active) {
          setLoadError('진행 중인 요청을 불러오지 못했습니다.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      active = false;
    };
  }, []);

  const openRequestDetail = (requestId: string) => {
    const token = readRequestTokens()[requestId];
    window.location.href = `/requests/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token || '')}`;
  };

  return (
    <div className="-mx-5 -mt-4 min-h-[calc(100vh-96px)] bg-white px-5 pb-6 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-black text-[#0066FF]">진행</p>
          <h1 className="mt-1 text-[24px] font-black tracking-[-0.02em] text-[#0F172A]">요청 상태를 확인해요</h1>
        </div>
        <button
          type="button"
          onClick={() => onChangeScreen('profile')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#0F172A]"
          aria-label="마이페이지"
        >
          <LineIcon name="user" size={20} />
        </button>
      </header>

      {isLoading && (
        <section className="mt-6 rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[14px] font-bold text-[#64748B]">진행 중인 요청을 불러오는 중입니다.</p>
        </section>
      )}

      {!isLoading && requestIds.length === 0 && (
        <section className="mt-6 rounded-[20px] border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#EFF6FF] text-[#0066FF]">
            <LineIcon name="list" size={27} />
          </div>
          <h2 className="mt-4 text-[18px] font-black text-[#0F172A]">아직 진행 중인 요청이 없습니다.</h2>
          <p className="mt-2 break-keep text-[13px] font-semibold leading-relaxed text-[#64748B]">
            원상복구 견적을 요청하면 진행 상태와 도착한 견적을 여기서 확인할 수 있어요.
          </p>
          <button type="button" onClick={() => onChangeScreen('request')} className="pr-cta mt-5">
            무료 견적 요청하기
          </button>
        </section>
      )}

      {!isLoading && requestIds.length > 0 && !request && (
        <section className="mt-6 rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <p className="break-keep text-[14px] font-bold leading-relaxed text-[#64748B]">
            저장된 신청ID가 있지만 요청 정보를 불러오지 못했습니다.
          </p>
          {loadError && <p className="mt-2 text-[12px] font-black text-[#0066FF]">{loadError}</p>}
        </section>
      )}

      {!isLoading && request && (
        <section className="mt-6 space-y-4">
          <article className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-black text-[#0066FF]">{request.request_id}</p>
                <h2 className="mt-2 break-keep text-[20px] font-black leading-snug text-[#0F172A]">{getRequestTitle(request)}</h2>
                <p className="mt-2 text-[13px] font-semibold text-[#64748B]">{formatDate(request.created_at)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-black text-[#0066FF]">
                {getStatusLabel(request.status)}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] bg-[#F8FAFC] p-3">
                <dt className="text-[11px] font-bold text-[#94A3B8]">지역</dt>
                <dd className="mt-1 break-keep text-[13px] font-black text-[#0F172A]">{request.region || '-'}</dd>
              </div>
              <div className="rounded-[16px] bg-[#F8FAFC] p-3">
                <dt className="text-[11px] font-bold text-[#94A3B8]">희망시기</dt>
                <dd className="mt-1 text-[13px] font-black text-[#0F172A]">{request.schedule || '협의 가능'}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => openRequestDetail(request.request_id)}
              className="mt-5 h-12 w-full rounded-[14px] bg-[#0066FF] text-[14px] font-black text-white"
            >
              상세 보기
            </button>
          </article>

          <article className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
            <h2 className="text-[18px] font-black text-[#0F172A]">진행 상태</h2>
            <div className="mt-5 space-y-4">
              {steps.map((step, index) => {
                const active = index <= currentStepIndex;
                const current = index === currentStepIndex;

                return (
                  <div key={step} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? 'border-[#0066FF] bg-[#0066FF] text-white' : 'border-[#CBD5E1] bg-white text-[#CBD5E1]'
                      }`}
                    >
                      <LineIcon name="check" size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[15px] font-black ${active ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{step}</span>
                      {current && <span className="mt-0.5 block text-[12px] font-bold text-[#0066FF]">현재 단계</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      )}
    </div>
  );
};
