'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LineIcon } from '@/components/petroom/icons';
import { getStatusLabel, type RequestRecord } from '@/lib/petroom-data';

type CustomerBid = {
  bid_id: string;
  customer_display_name: string;
  bid_amount: string;
  bid_amount_display: string;
  work_scope: string;
  included_items: string;
  excluded_items: string;
  extra_cost_conditions: string;
  available_date: string;
  visit_required: string;
  partial_repair_available?: string;
  estimated_work_time?: string;
  admin_comment?: string;
  recommended?: boolean;
};

type CustomerImage = {
  image_id: string;
  image_type: string;
  url: string;
  thumbnail_url: string;
};

type CustomerAction = {
  action_id: string;
  selected_quote_id: string;
  action_type: string;
  action_label: string;
  created_at: string;
};

const formatWon = (bid: CustomerBid) => {
  if (bid.bid_amount_display) return bid.bid_amount_display;
  const amount = Number(String(bid.bid_amount).replace(/\D/g, ''));
  return amount > 0 ? `${amount.toLocaleString('ko-KR')}원` : '금액 확인 중';
};

const getAmount = (bid: CustomerBid) => Number(String(bid.bid_amount).replace(/\D/g, '')) || 0;

const statusMessages: Record<string, string> = {
  RECEIVED: '신청이 접수되었습니다. 새집다오가 사진과 요청 내용을 확인 중입니다.',
  REVIEWING: '사진과 요청 내용을 확인하고 있습니다.',
  CONTACTING_CONTRACTORS: '업체 견적을 확인하고 있습니다.',
  QUOTE_READY: '새집다오가 확인한 견적 결과가 도착했습니다.',
  RESULT_SENT: '새집다오가 확인한 견적 결과가 도착했습니다.',
  CONNECT_REQUESTED: '업체 연결 요청이 접수되었습니다.',
  COMPLETED: '원상복구 시공이 완료되었습니다.',
  CLOSED: '요청이 종료되었습니다.',
};

const actionMessages: Record<string, string> = {
  CONNECT_REQUESTED: '업체 연결 요청이 접수되었습니다. 새집다오가 확인 후 안내드리겠습니다.',
  CONSULT_REQUESTED: '추가 상담 요청이 접수되었습니다. 확인 후 연락드리겠습니다.',
  DECIDED_LATER: '결정 보류로 저장되었습니다.',
};

export default function CustomerRequestPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [token, setToken] = useState('');
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [bids, setBids] = useState<CustomerBid[]>([]);
  const [images, setImages] = useState<CustomerImage[]>([]);
  const [lastAction, setLastAction] = useState<CustomerAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedBidId, setSelectedBidId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const nextToken = new URLSearchParams(window.location.search).get('token') ?? '';
    setToken(nextToken);

    if (!nextToken) {
      setErrorMessage('견적 결과를 확인할 수 없습니다. 전달받은 링크를 다시 확인해주세요.');
      setIsLoading(false);
      return;
    }

    const loadResult = async () => {
      const response = await fetch(
        `/api/requests/${encodeURIComponent(requestId)}?token=${encodeURIComponent(nextToken)}`,
        { cache: 'no-store' },
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? '견적 결과를 확인할 수 없습니다.');
      }

      setRequest(result.request ?? null);
      setBids(Array.isArray(result.bids) ? result.bids : []);
      setImages(Array.isArray(result.images) ? result.images : []);
      setLastAction(result.lastAction ?? null);
    };

    loadResult()
      .catch((error) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '견적 결과를 확인할 수 없습니다. 전달받은 링크를 다시 확인해주세요.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [requestId]);

  const orderedBids = useMemo(
    () => [...bids].sort((a, b) => getAmount(a) - getAmount(b)),
    [bids],
  );

  const submitAction = async (
    actionType: 'CONNECT_REQUESTED' | 'CONSULT_REQUESTED' | 'DECIDED_LATER',
    quoteId = '',
  ) => {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    setActionMessage('');

    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}/actions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          actionType,
          selectedQuoteId: quoteId,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? '요청을 저장하지 못했습니다.');
      }
      setSelectedBidId(quoteId);
      setLastAction({
        action_id: String(result.actionId ?? ''),
        selected_quote_id: quoteId,
        action_type: actionType,
        action_label: '',
        created_at: new Date().toISOString(),
      });
      setActionMessage(actionMessages[actionType]);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : '요청을 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-5 py-12">
        <p className="mx-auto max-w-[520px] text-center text-sm font-bold text-[#64748B]">견적 결과를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (errorMessage || !request) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-5 py-12">
        <section className="mx-auto max-w-[520px] rounded-[20px] border border-[#E2E8F0] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#EFF6FF] text-[#0066FF]">
            <LineIcon name="shield" size={26} />
          </div>
          <h1 className="mt-4 text-xl font-black text-[#0F172A]">견적 결과를 확인할 수 없습니다.</h1>
          <p className="mt-2 break-keep text-sm font-semibold leading-relaxed text-[#64748B]">
            전달받은 링크를 다시 확인해주세요.
          </p>
          <Link href="/" className="mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-[#0066FF] px-5 text-sm font-black text-white">
            새집다오 홈으로
          </Link>
        </section>
      </main>
    );
  }

  const statusMessage = statusMessages[request.status] ?? '견적 진행 상태를 확인하고 있습니다.';

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-5">
      <div className="mx-auto max-w-[560px] space-y-4">
        <header className="flex items-center justify-between rounded-[20px] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/petroom-logo-transparent.png" alt="새집다오" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-[11px] font-black text-[#0066FF]">원상복구 견적 결과</p>
              <p className="text-[16px] font-black text-[#0F172A]">새집다오</p>
            </div>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[11px] font-black text-[#0066FF]">
            {getStatusLabel(request.status)}
          </span>
        </header>

        <section className="rounded-[22px] bg-[#0F172A] p-6 text-white">
          <p className="text-[12px] font-bold text-white/60">{request.request_id}</p>
          <h1 className="mt-3 break-keep text-[25px] font-black leading-tight">
            새집다오가 확인한
            <br />
            견적 결과입니다.
          </h1>
          <p className="mt-4 break-keep text-[13px] font-semibold leading-relaxed text-white/70">{statusMessage}</p>
        </section>

        {actionMessage && (
          <section className="rounded-[18px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-4 text-sm font-black leading-relaxed text-[#005BFF]">
            {actionMessage}
          </section>
        )}

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-black text-[#0F172A]">신청 요약</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['공간 유형', request.room_type || request.housing_type || '확인 중'],
              ['훼손 부위', request.damage_type || '확인 중'],
              ['지역', request.region || '확인 중'],
              ['희망 시기', request.schedule || '협의 가능'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[16px] bg-[#F8FAFC] p-3">
                <dt className="text-[11px] font-bold text-[#94A3B8]">{label}</dt>
                <dd className="mt-1 break-keep text-[13px] font-black text-[#0F172A]">{value}</dd>
              </div>
            ))}
          </dl>
          {request.user_memo && (
            <div className="mt-3 rounded-[16px] bg-[#F8FAFC] p-3">
              <p className="text-[11px] font-bold text-[#94A3B8]">요청 내용</p>
              <p className="mt-1 whitespace-pre-line break-keep text-[13px] font-semibold leading-relaxed text-[#475569]">
                {request.user_memo}
              </p>
            </div>
          )}
        </section>

        {images.length > 0 && (
          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-black text-[#0F172A]">접수 사진</h2>
              <span className="text-[12px] font-bold text-[#64748B]">{images.length}장</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((image) => (
                <a key={image.image_id} href={image.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-[14px] bg-[#F1F5F9]">
                  <img
                    src={image.thumbnail_url || image.url}
                    alt={image.image_type}
                    className="aspect-square w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-black text-[#0F172A]">견적 요약</h2>
          <div className="mt-4">
            <div className="rounded-[16px] bg-[#EFF6FF] p-4">
              <p className="text-[11px] font-bold text-[#64748B]">확인된 견적</p>
              <p className="mt-1 text-[18px] font-black text-[#0066FF]">{orderedBids.length}건</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[19px] font-black text-[#0F172A]">업체별 견적</h2>
            <p className="text-[12px] font-bold text-[#64748B]">승인된 견적만 표시</p>
          </div>

          {orderedBids.length === 0 ? (
            <div className="rounded-[20px] border border-[#E2E8F0] bg-white px-5 py-8 text-center shadow-sm">
              <p className="text-[16px] font-black text-[#0F172A]">아직 견적을 정리하고 있습니다.</p>
              <p className="mt-2 text-[13px] font-semibold text-[#64748B]">견적이 준비되면 같은 링크에서 확인할 수 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderedBids.map((bid) => {
                const selected = selectedBidId === bid.bid_id || lastAction?.selected_quote_id === bid.bid_id;
                return (
                  <article
                    key={bid.bid_id}
                    className={`rounded-[20px] border bg-white p-5 shadow-sm ${
                      bid.recommended ? 'border-[#0066FF]' : 'border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[17px] font-black text-[#0F172A]">{bid.customer_display_name}</h3>
                          {bid.recommended && (
                            <span className="rounded-full bg-[#0066FF] px-2 py-1 text-[10px] font-black text-white">추천</span>
                          )}
                        </div>
                        <p className="mt-1 text-[12px] font-bold text-[#64748B]">{bid.work_scope || '작업 범위 확인 중'}</p>
                      </div>
                      <strong className="whitespace-nowrap text-[20px] font-black text-[#0066FF]">{formatWon(bid)}</strong>
                    </div>

                    <dl className="mt-4 grid gap-2">
                      {[
                        ['부분시공', bid.partial_repair_available || '업체 확인 필요'],
                        ['방문 여부', bid.visit_required || '업체 확인 필요'],
                        ['작업 시간', bid.estimated_work_time || '업체 확인 필요'],
                        ['가능 일정', bid.available_date || '협의 필요'],
                        ['포함 항목', bid.included_items || '별도 확인'],
                        ['제외 항목', bid.excluded_items || '별도 확인'],
                        ['추가 비용 조건', bid.extra_cost_conditions || '별도 조건 없음'],
                      ].map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[88px_1fr] gap-2 rounded-[12px] bg-[#F8FAFC] px-3 py-2.5">
                          <dt className="text-[11px] font-bold text-[#94A3B8]">{label}</dt>
                          <dd className="break-keep text-[12px] font-bold leading-relaxed text-[#334155]">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    {bid.admin_comment && (
                      <div className="mt-3 rounded-[14px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
                        <p className="text-[11px] font-black text-[#0066FF]">새집다오 코멘트</p>
                        <p className="mt-1 break-keep text-[12px] font-semibold leading-relaxed text-[#334155]">{bid.admin_comment}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => submitAction('CONNECT_REQUESTED', bid.bid_id)}
                      className={`mt-4 h-12 w-full rounded-[14px] text-sm font-black text-white disabled:opacity-50 ${
                        selected ? 'bg-[#0F172A]' : 'bg-[#0066FF]'
                      }`}
                    >
                      {selected ? '연결 요청 접수됨' : '이 업체로 연결 요청하기'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-2 rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submitAction('CONSULT_REQUESTED')}
            className="h-12 rounded-[14px] border border-[#0066FF] bg-white text-sm font-black text-[#0066FF] disabled:opacity-50"
          >
            추가 상담 요청
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submitAction('DECIDED_LATER')}
            className="h-12 rounded-[14px] bg-[#F1F5F9] text-sm font-black text-[#475569] disabled:opacity-50"
          >
            아직 결정하지 않기
          </button>
        </section>

        <p className="px-2 text-center text-[11px] font-semibold leading-relaxed text-[#94A3B8]">
          사진 기반 1차 견적이며, 실제 방문 확인과 자재 조건에 따라 최종 금액은 달라질 수 있습니다.
        </p>
      </div>
    </main>
  );
}
