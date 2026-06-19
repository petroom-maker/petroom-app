'use client';

import Image from 'next/image';
import { LineIcon, type LineIconName } from './icons';
import type { AppScreen, RequestTarget } from './types';

const serviceSteps: { title: string; description: string; icon: LineIconName }[] = [
  {
    title: '사진 업로드',
    description: '훼손된 공간을 올려주세요.',
    icon: 'camera',
  },
  {
    title: '1차 견적 정리',
    description: '확인 후 견적을 정리해요.',
    icon: 'document',
  },
  {
    title: '업체 연결',
    description: '시공 업체를 연결해드려요.',
    icon: 'check',
  },
];

const repairItems: { title: string; description: string; icon: LineIconName }[] = [
  {
    title: '벽지',
    description: '뜯김·오염·긁힘',
    icon: 'brush',
  },
  {
    title: '장판',
    description: '찢김·들뜸·손상',
    icon: 'tiles',
  },
  {
    title: '문·몰딩',
    description: '모서리·표면 손상',
    icon: 'door',
  },
];

const caseImages = [
  {
    src: '/images/cases/bangbae-before-wall.jpg',
    alt: '방배동 원룸 벽지 복구 전',
    label: '시공 전',
  },
  {
    src: '/images/cases/bangbae-after-wall.jpg',
    alt: '방배동 원룸 벽지 복구 후',
    label: '시공 후',
  },
  {
    src: '/images/cases/bangbae-before-floor.jpg',
    alt: '방배동 원룸 장판 복구 전',
    label: '시공 전',
  },
  {
    src: '/images/cases/bangbae-after-floor.jpg',
    alt: '방배동 원룸 장판 복구 후',
    label: '시공 후',
  },
];

export const HomeScreen = ({
  onChange,
  onStartRequest,
}: {
  onChange: (screen: AppScreen) => void;
  onStartRequest: (target?: RequestTarget) => void;
}) => {
  return (
    <div className="-mx-5 -mt-4 min-h-[calc(100vh-80px)] bg-white pb-8">
      <header className="flex h-[72px] items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/petroom-logo-mark.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="text-[20px] font-black tracking-tight text-[#0F172A]">새집다오</span>
        </div>
        <div className="flex items-center gap-4 text-[#0F172A]">
          <button type="button" className="relative flex h-10 w-10 items-center justify-center" aria-label="알림">
            <LineIcon name="bell" size={23} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#006BFF]" />
          </button>
          <button
            type="button"
            onClick={() => onChange('profile')}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="마이페이지"
          >
            <LineIcon name="user" size={23} />
          </button>
        </div>
      </header>

      <section className="overflow-hidden px-5 pb-10 pt-6">
        <div className="relative min-h-[220px]">
          <div className="relative z-10 max-w-[300px]">
            <h1 className="break-keep text-[38px] font-black leading-[1.14] tracking-[-0.02em] text-[#0F172A]">
              반려동물이
              <br />
              훼손한 집,
              <br />
              견적부터 시공까지
              <br />
              <span className="text-[#006BFF]">한 번에.</span>
            </h1>
          </div>

          <div className="pointer-events-none absolute -right-8 top-10 h-[178px] w-[178px] opacity-[0.14]">
            <Image
              src="/petroom-logo-mark.png"
              alt=""
              fill
              sizes="178px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <p className="mt-5 break-keep text-[15px] font-semibold leading-[1.7] text-[#475569]">
          여러 업체를 비교하고,
          <br />
          실제 시공까지 간편하게 해결하세요.
        </p>

        <button
          type="button"
          onClick={() => onStartRequest()}
          className="mt-6 flex h-14 w-full items-center justify-between rounded-[18px] bg-[#006BFF] px-5 text-[16px] font-black text-white shadow-[0_10px_24px_rgba(0,107,255,0.22)] transition-transform active:scale-[0.98]"
        >
          무료 견적 요청하기
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xl leading-none" aria-hidden="true">
            →
          </span>
        </button>
      </section>

      <section className="border-y border-[#EDF1F6] bg-[#F8FAFC] px-5 py-9">
        <div>
          <p className="text-[12px] font-black text-[#006BFF]">HOW IT WORKS</p>
          <h2 className="mt-1 text-[22px] font-black tracking-tight text-[#0F172A]">간편한 3단계 과정</h2>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {serviceSteps.map((step, index) => (
            <article
              key={step.title}
              className="relative min-h-[158px] rounded-[20px] border border-[#E5EAF2] bg-white px-3 py-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EAF2FF] text-[#006BFF]">
                <LineIcon name={step.icon} size={24} />
              </span>
              <span className="mt-4 block text-[10px] font-black text-[#8AAFF8]">0{index + 1}</span>
              <h3 className="mt-0.5 break-keep text-[13px] font-black leading-snug text-[#0F172A]">{step.title}</h3>
              <p className="mt-1 break-keep text-[10px] font-semibold leading-[1.45] text-[#64748B]">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-10">
        <div className="mb-5">
          <p className="text-[12px] font-black text-[#006BFF]">REAL CASE</p>
          <h2 className="mt-1 text-[22px] font-black tracking-tight text-[#0F172A]">실제 견적 사례</h2>
          <p className="mt-2 text-[13px] font-semibold text-[#64748B]">실제 접수부터 시공까지 진행한 사례예요.</p>
        </div>

        <article className="overflow-hidden rounded-[24px] border border-[#E5EAF2] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-2 gap-px bg-[#E5EAF2]">
            {caseImages.map((image, index) => (
              <figure key={image.src} className="relative aspect-[4/3] overflow-hidden bg-[#F1F5F9]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 480px) 50vw, 220px"
                  className="object-cover"
                  priority={index < 2}
                />
                <figcaption
                  className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    image.label === '시공 후' ? 'bg-[#006BFF] text-white' : 'bg-white/95 text-[#0F172A]'
                  }`}
                >
                  {image.label}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="p-5">
            <p className="text-[12px] font-black text-[#006BFF]">서울 방배동 · 원룸</p>
            <h3 className="mt-1.5 text-[21px] font-black tracking-tight text-[#0F172A]">벽지 + 장판 부분 복구</h3>

            <dl className="mt-5 space-y-3 border-y border-[#EDF1F6] py-4">
              <div className="flex items-center justify-between">
                <dt className="text-[14px] font-semibold text-[#475569]">벽지 부분 도배</dt>
                <dd className="text-[15px] font-black text-[#0F172A]">25만원</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[14px] font-semibold text-[#475569]">장판 부분 교체</dt>
                <dd className="text-[15px] font-black text-[#0F172A]">15만원</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-end justify-between">
              <span className="text-[14px] font-black text-[#0F172A]">총 진행 금액</span>
              <strong className="text-[32px] font-black leading-none tracking-tight text-[#006BFF]">40만원</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="bg-[#F8FAFC] px-5 py-10">
        <p className="text-[12px] font-black text-[#006BFF]">REPAIR ITEMS</p>
        <h2 className="mt-1 text-[22px] font-black tracking-tight text-[#0F172A]">도와드리는 복구 항목</h2>
        <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#64748B]">
          자주 요청되는 훼손 항목을 빠르게 접수할 수 있어요.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {repairItems.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onStartRequest()}
              className="flex min-h-[132px] flex-col items-center justify-center rounded-[20px] border border-[#E5EAF2] bg-white px-2 text-center shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-transform active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#EAF2FF] text-[#006BFF]">
                <LineIcon name={item.icon} size={26} />
              </span>
              <strong className="mt-3 text-[14px] font-black text-[#0F172A]">{item.title}</strong>
              <span className="mt-1 text-[10px] font-semibold text-[#64748B]">{item.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
