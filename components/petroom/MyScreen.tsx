'use client';

import { useEffect, useState } from 'react';
import { getStatusLabel, type RequestRecord } from '@/lib/petroom-data';
import { LineIcon } from './icons';
import type { AppScreen } from './types';

type MyView = 'main' | 'report' | 'photos' | 'landlordScript' | 'businessRequests' | 'faq' | 'partner';

const settingsRows: { label: string; screen?: AppScreen; view?: MyView; value?: string }[] = [
  { label: '받은 견적 보기', screen: 'myQuotes' },
  { label: '내 원상복구 리포트', view: 'report' },
  { label: '내가 올린 훼손 사진', view: 'photos' },
  { label: '집주인 협의용 문구', view: 'landlordScript' },
  { label: '업장 보수 요청 내역', view: 'businessRequests' },
  { label: '업체 입점 문의', view: 'partner' },
  { label: '자주 묻는 질문', view: 'faq' },
  { label: '고객센터' },
  { label: '약관 및 정책' },
  { label: '앱 정보', value: 'v0.1.0' },
];

const viewTitles: Record<Exclude<MyView, 'main'>, string> = {
  report: '내 원상복구 리포트',
  photos: '내가 올린 훼손 사진',
  landlordScript: '집주인 협의용 문구',
  businessRequests: '업장 보수 요청 내역',
  faq: '자주 묻는 질문',
  partner: '업체 입점 문의',
};

const landlordScript =
  '반려동물로 인한 벽지 훼손에 대해 도배 시공팀 기준으로 견적을 확인하고 있습니다. 부분복구 가능 여부와 비용 범위를 확인한 뒤 공유드리겠습니다.';

const faqItems = [
  {
    q: '견적 확인까지 비용이 드나요?',
    a: '아니요. 사진을 올리고 예상 견적을 확인하는 단계까지는 비용이 발생하지 않아요.',
  },
  {
    q: '연락처는 언제 공개되나요?',
    a: '상담/예약이 연결되기 전까지 연락처는 공개되지 않아요. 진행이 확정되면 상담을 통해 일정을 조율해요.',
  },
  {
    q: '부분 복구만 받을 수 있나요?',
    a: '네, 가능해요. 손상 범위에 따라 부분 복구 또는 전체 교체 견적을 함께 안내해드려요.',
  },
  {
    q: '사진은 어떻게 찍는 게 좋나요?',
    a: '훼손 부위를 가까이서 찍은 사진 1장과 전체 공간이 보이는 사진 1장을 함께 올려주시면 더 정확한 견적을 받을 수 있어요.',
  },
];

export const MyScreen = ({ onChange }: { onChange: (screen: AppScreen) => void }) => {
  const [view, setView] = useState<MyView>('main');
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/requests')
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled) {
          setRequests(result.requests ?? []);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(landlordScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (view !== 'main') {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('main')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500"
          >
            ←
          </button>
          <h1 className="text-lg font-extrabold text-navy">{viewTitles[view]}</h1>
        </header>

        {view === 'report' &&
          (requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="mb-4 text-sm font-bold text-slate-500">아직 작성된 리포트가 없어요</p>
              <button
                type="button"
                onClick={() => onChange('estimate')}
                className="w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
              >
                견적 요청하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((item) => (
                <div key={item.request_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-accent">
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{item.region}</span>
                  </div>
                  <p className="text-sm font-extrabold text-navy">
                    {item.damage_type} · {item.damage_scope}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    예상 견적 {item.estimated_min.toLocaleString('ko-KR')}원 ~{' '}
                    {item.estimated_max.toLocaleString('ko-KR')}원
                  </p>
                </div>
              ))}
            </div>
          ))}

        {view === 'photos' && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="mb-1 text-sm font-bold text-slate-500">아직 업로드한 사진이 없어요</p>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              견적 요청 시 올린 훼손 사진을 여기에서 다시 확인할 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => onChange('estimate')}
              className="w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
            >
              견적 요청하러 가기
            </button>
          </div>
        )}

        {view === 'landlordScript' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-500">집주인에게 이렇게 말해보세요</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm leading-relaxed text-navy">{landlordScript}</p>
            </div>
            <button
              type="button"
              onClick={copyScript}
              className="w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
            >
              {copied ? '복사했어요' : '문구 복사하기'}
            </button>
          </div>
        )}

        {view === 'businessRequests' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-extrabold text-navy">업장 보수 요청을 한곳에서 확인해요</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              애견유치원·펫호텔·미용실 등 운영 공간 보수 요청 내역을 확인할 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => onChange('estimate')}
              className="mt-4 w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
            >
              업장 보수 견적 요청하기
            </button>
          </div>
        )}

        {view === 'faq' && (
          <div className="space-y-2">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-extrabold text-navy">Q. {item.q}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">A. {item.a}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'partner' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-extrabold text-navy">반려동물 원상복구 시공팀이신가요?</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              펫룸과 함께 반려동물 원상복구 견적 요청을 받아보세요. 입점 문의는 고객센터를 통해 접수할 수 있어요.
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
              문의: petroom.partner@example.com
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-accent">
          <LineIcon name="user" size={28} />
        </div>
        <p className="text-base font-extrabold text-navy">게스트님</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {settingsRows.map((row, index) => (
          <button
            key={row.label}
            type="button"
            onClick={() => {
              if (row.view) {
                setView(row.view);
                return;
              }

              if (row.screen) {
                onChange(row.screen);
              }
            }}
            className={`flex w-full items-center justify-between px-4 py-4 text-left text-sm font-bold text-navy ${
              index !== settingsRows.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <span>{row.label}</span>
            <span className="flex items-center gap-2 text-slate-400">
              {row.value && <span className="text-xs font-bold text-slate-400">{row.value}</span>}
              <span className="text-lg">›</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
};
