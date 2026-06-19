'use client';

import { useEffect, useState } from 'react';
import type { BidRecord, RequestRecord } from '@/lib/petroom-data';
import { LineIcon } from './icons';
import type { AppScreen } from './types';

type ChatState = { kind: 'empty' } | { kind: 'bidsReady' } | { kind: 'active'; contractorName: string };

export const ChatScreen = ({ onChange }: { onChange: (screen: AppScreen) => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<ChatState>({ kind: 'empty' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const requestsResponse = await fetch('/api/requests');
        const requestsResult = await requestsResponse.json();
        const requests: RequestRecord[] = requestsResult.requests ?? [];

        let activeContractor: string | null = null;
        let hasUnselectedBids = false;

        for (const item of requests) {
          const bidsResponse = await fetch(
            `/api/bids?requestId=${encodeURIComponent(item.request_id)}&customerVisible=Y`,
          );
          const bidsResult = await bidsResponse.json();
          const bids: BidRecord[] = bidsResult.bids ?? [];
          const selectedBidId =
            typeof window !== 'undefined' ? window.localStorage.getItem(`petroom_selected_${item.request_id}`) : null;
          const selectedBid = bids.find((bid) => bid.bid_id === selectedBidId);

          if (selectedBid) {
            activeContractor = selectedBid.customer_display_name || selectedBid.contractor_name;
            break;
          }

          if (bids.length > 0) {
            hasUnselectedBids = true;
          }
        }

        if (cancelled) {
          return;
        }

        if (activeContractor) {
          setState({ kind: 'active', contractorName: activeContractor });
        } else if (hasUnselectedBids) {
          setState({ kind: 'bidsReady' });
        } else {
          setState({ kind: 'empty' });
        }
      } catch {
        if (!cancelled) {
          setState({ kind: 'empty' });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-sm font-bold text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  if (state.kind === 'active') {
    return (
      <div className="flex min-h-[75vh] flex-col">
        <header className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-accent">
            <LineIcon name="chat" size={20} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-navy">{state.contractorName}</p>
            <p className="text-xs font-bold text-slate-400">상담 중</p>
          </div>
        </header>
        <div className="flex-1 space-y-3">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-navy">
            안녕하세요! 보내주신 사진 확인했습니다. 말씀해주신 부분은 부분 보수로 깔끔하게 마무리해 드릴게요.
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-navy">
            편하신 방문 일정 알려주시면 일정 조율해드릴게요.
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
          메시지 보내기 (준비 중)
        </div>
      </div>
    );
  }

  if (state.kind === 'bidsReady') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-accent">
          <LineIcon name="chat" size={26} />
        </div>
        <p className="text-base font-extrabold text-navy">상담은 견적 확인 후 열려요.</p>
        <p className="text-sm leading-relaxed text-slate-400">
          펫룸이 사진과 진행 가능성을 확인한 뒤, 시공 가능한 업체와 상담을 연결해드립니다.
        </p>
        <button
          type="button"
          onClick={() => onChange('myQuotes')}
          className="mt-2 w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
        >
          내 견적 확인하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-accent">
        <LineIcon name="chat" size={26} />
      </div>
      <p className="text-base font-extrabold text-navy">상담은 견적 확인 후 열려요.</p>
      <p className="text-sm leading-relaxed text-slate-400">
        펫룸이 사진과 진행 가능성을 확인한 뒤, 시공 가능한 업체와 상담을 연결해드립니다.
      </p>
      <button
        type="button"
        onClick={() => onChange('myQuotes')}
        className="mt-2 w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
      >
        견적 진행상황 보기
      </button>
    </div>
  );
};
