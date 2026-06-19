'use client';

import { LineIcon } from './icons';
import type { AppScreen } from './types';

const menuRows = ['내 정보', '연락처', '주소 관리', '반려동물 정보', '사업장 정보', '요청 내역', '완료된 시공', '알림 설정', '고객센터', '약관 및 개인정보 처리방침'];

const householdInfo = [
  ['이름', '김**'],
  ['연락처', '010-****-1988'],
  ['주거 지역', '성남시 분당구'],
  ['주거 형태', '월세'],
  ['반려동물 종류', '강아지'],
  ['반려동물 마릿수', '1마리'],
];

const businessInfo = [
  ['담당자명', '최**'],
  ['연락처', '010-****-1988'],
  ['사업장명', '펫룸 애견유치원'],
  ['사업장 유형', '애견유치원'],
  ['사업장 주소', '경기 광주'],
  ['운영 시간', '09:00~19:00'],
  ['휴무일', '일요일'],
  ['사업자 여부', '확인 예정'],
  ['반복 손상 부위', '문틀, 장판'],
];

export const ProfileScreen = ({ onChangeScreen }: { onChangeScreen: (screen: AppScreen) => void }) => {
  return (
    <div className="space-y-5">
      <header className="-mx-5 -mt-4 flex h-14 items-center gap-3 border-b border-warm-border bg-white px-5">
        <button type="button" onClick={() => onChangeScreen('home')} className="text-xl font-black text-navy">←</button>
        <h1 className="text-lg font-black text-navy">마이페이지</h1>
      </header>

      <section className="petroom-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral-pale text-accent">
            <LineIcon name="user" size={28} />
          </div>
          <div>
            <p className="text-lg font-black text-[#1A1A1A]">새집다오 사용자</p>
            <p className="mt-1 text-xs font-bold text-warm-caption">일반 가정 / 사업장 정보를 함께 관리할 수 있어요.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <InfoCard title="일반 가정 유저 정보" rows={householdInfo} />
        <InfoCard title="사업자 유저 정보" rows={businessInfo} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-warm-border bg-white shadow-card">
        {menuRows.map((row, index) => (
          <button
            key={row}
            type="button"
            className={`flex h-12 w-full items-center justify-between px-4 text-left text-sm font-black text-[#1A1A1A] ${
              index !== menuRows.length - 1 ? 'border-b border-warm-border' : ''
            }`}
          >
            {row}
            <span className="text-warm-caption">›</span>
          </button>
        ))}
      </section>
    </div>
  );
};

const InfoCard = ({ title, rows }: { title: string; rows: string[][] }) => (
  <article className="petroom-card rounded-2xl p-4">
    <h2 className="break-keep text-sm font-black text-navy">{title}</h2>
    <dl className="mt-3 space-y-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-black text-warm-caption">{label}</dt>
          <dd className="mt-0.5 break-keep text-xs font-bold leading-relaxed text-[#1A1A1A]">{value}</dd>
        </div>
      ))}
    </dl>
  </article>
);
