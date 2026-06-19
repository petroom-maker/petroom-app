'use client';

import { LineIcon, type LineIconName } from './icons';
import type { AppScreen, RequestTarget } from './types';

const stats: { label: string; value: string; sub: string; icon: LineIconName }[] = [
  { label: '누적 요청 건수', value: '12건', sub: '신규 서비스 오픈', icon: 'document' },
  { label: '평균 견적 회신', value: '48시간 이내', sub: '빠른 견적 회신', icon: 'clock' },
];

const quickMenus: { label: string; icon: LineIconName; action: 'request' | 'progress' | 'reviews' }[] = [
  { label: '견적 요청', icon: 'edit', action: 'request' },
  { label: '진행 조회', icon: 'search', action: 'progress' },
  { label: '견적 확인', icon: 'document', action: 'progress' },
  { label: '시공 사례', icon: 'star', action: 'reviews' },
];

const reviewCards: { title: string; price: string; region: string; icon: LineIconName }[] = [
  { title: '벽지 부분 복구', price: '38만원', region: '서울 강남구', icon: 'brush' },
  { title: '장판 보수', price: '45만원', region: '경기 성남시', icon: 'tiles' },
  { title: '문틀 복원', price: '23만원', region: '서울 서초구', icon: 'door' },
];

export const HomeScreen = ({
  onChange,
  onStartRequest,
}: {
  onChange: (screen: AppScreen) => void;
  onStartRequest: (target?: RequestTarget) => void;
}) => {
  const handleQuickMenu = (action: (typeof quickMenus)[number]['action']) => {
    if (action === 'request') {
      onStartRequest();
      return;
    }

    if (action === 'reviews') {
      document.getElementById('home-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    onChange(action);
  };

  return (
    <div className="-mx-5 -mt-4 min-h-[calc(100vh-80px)] bg-white px-5 pb-5 pt-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/PETROOM_app_icon_256.png" alt="새집다오" className="h-16 w-16 object-contain" />
          <span className="text-[22px] font-black tracking-tight text-[#0F172A]">새집다오</span>
        </div>
        <div className="flex items-center gap-4 text-[#0F172A]">
          <button type="button" className="relative" aria-label="알림">
            <LineIcon name="bell" size={24} />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#0066FF]" />
          </button>
          <button type="button" onClick={() => onChange('profile')} aria-label="마이페이지">
            <LineIcon name="user" size={24} />
          </button>
        </div>
      </header>

      <section className="pt-10">
        <h1 className="break-keep text-[36px] font-black leading-[1.14] tracking-[-0.02em] text-[#0F172A]">
          반려동물이
          <br />
          훼손한 집,
          <br />
          견적부터 시공까지
          <br />
          <span className="text-[#0066FF]">한 번에.</span>
        </h1>
        <p className="mt-5 break-keep text-[15px] font-semibold leading-relaxed text-[#475569]">
          여러 업체를 비교하고,
          <br />
          실제 시공까지 간편하게 해결하세요.
        </p>
        <button
          type="button"
          onClick={() => onStartRequest()}
          className="mt-6 flex h-14 w-full items-center justify-between rounded-[16px] bg-[#0066FF] px-5 text-[16px] font-black text-white shadow-[0_10px_22px_rgba(0,102,255,0.24)]"
        >
          무료 견적 요청하기
          <span className="text-2xl leading-none">→</span>
        </button>
      </section>

      <section className="mt-6 grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
        {stats.map((item, index) => (
          <div key={item.label} className={`flex gap-3 p-4 ${index === 0 ? 'border-r border-[#E2E8F0]' : ''}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#0066FF] text-white">
              <LineIcon name={item.icon} size={25} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold text-[#64748B]">{item.label}</span>
              <strong className="mt-1 block text-[20px] font-black tracking-tight text-[#0F172A]">{item.value}</strong>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#64748B]">{item.sub}</span>
            </span>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="text-[18px] font-black text-[#0F172A]">빠른 메뉴</h2>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {quickMenus.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleQuickMenu(item.action)}
              className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[18px] border border-[#E2E8F0] bg-white text-center shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
            >
              <span className="text-[#0066FF]">
                <LineIcon name={item.icon} size={28} />
              </span>
              <span className="text-[12px] font-black text-[#0F172A]">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="home-reviews" className="mt-7 scroll-mt-20">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-black text-[#0F172A]">실제 견적 후기</h2>
          <button type="button" className="text-[13px] font-bold text-[#0066FF]">
            전체 보기 〉
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {reviewCards.map((item) => (
            <article key={item.title} className="rounded-[18px] border border-[#E2E8F0] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              <div className="mb-3 text-[#0066FF]">
                <LineIcon name={item.icon} size={30} />
              </div>
              <p className="break-keep text-[12px] font-semibold leading-snug text-[#475569]">{item.title}</p>
              <strong className="mt-1 block text-[20px] font-black tracking-tight text-[#0F172A]">{item.price}</strong>
              <span className="mt-2 inline-flex rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-bold text-[#64748B]">{item.region}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
