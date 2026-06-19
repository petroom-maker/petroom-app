'use client';

import Image from 'next/image';
import { LineIcon } from './icons';
import type { AppScreen, RequestTarget } from './types';

const serviceSteps = [
  {
    title: '사진 업로드',
    description: '훼손된 공간 사진을 올려주세요.',
    image: '/images/home/step-upload.png',
    imageAlt: '사진 업로드 카메라',
  },
  {
    title: '1차 견적 정리',
    description: '전문가 확인 후 1차 견적을 정리해요.',
    image: '/images/home/step-estimate.png',
    imageAlt: '1차 견적 체크리스트',
  },
  {
    title: '업체 연결',
    description: '믿을 수 있는 업체를 연결해드려요.',
    image: '/images/home/step-connect-service.png',
    imageAlt: '새집다오 업체 연결',
  },
];

const repairItems = [
  {
    title: '벽지',
    description: '뜯김·오염·긁힘',
    image: '/images/home/item-wallpaper.png',
    imageAlt: '벽지 복구',
  },
  {
    title: '장판',
    description: '찢김·들뜸·손상',
    image: '/images/home/item-flooring.png',
    imageAlt: '장판 복구',
  },
  {
    title: '문·몰딩',
    description: '모서리·표면 손상',
    image: '/images/home/item-door.png',
    imageAlt: '문과 몰딩 복구',
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
    <div className="-mx-5 -mt-4 min-h-[calc(100vh-80px)] bg-[#F8FAFC] pb-8">
      <header className="flex h-[70px] items-center justify-between bg-white px-5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo/saejipdao-logo.png"
            alt=""
            width={42}
            height={42}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="text-[20px] font-black text-[#111827]">새집다오</span>
        </div>
        <div className="flex items-center gap-3 text-[#111827]">
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

      <section className="px-4 pb-2 pt-2">
        <div className="relative overflow-hidden rounded-[28px] border border-[#E5EAF2] bg-white px-5 pb-5 pt-7 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <h1 className="relative z-10 break-keep text-[32px] font-black leading-[1.16] text-[#111827]">
            반려동물이 훼손한 집,
            <br />
            견적부터 시공까지
            <br />
            <span className="text-[#006BFF]">한 번에.</span>
          </h1>

          <div className="relative mt-2 h-[210px]">
            <p className="absolute left-0 top-7 z-20 max-w-[165px] break-keep text-[14px] font-semibold leading-[1.65] text-[#6B7280]">
              여러 업체를 비교하고,
              <br />
              실제 시공까지 간편하게 해결하세요.
            </p>

            <div className="absolute -right-3 -top-5 z-10 h-[202px] w-[202px]">
              <Image
                src="/images/home/hero-logo.png"
                alt="새집다오 자수 패치 로고"
                fill
                sizes="202px"
                className="object-contain"
                priority
              />
            </div>

            <div className="absolute bottom-0 right-[108px] z-20 h-[84px] w-[84px] overflow-hidden rounded-[22px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
              <Image
                src="/images/home/hero-camera.png"
                alt="사진 업로드 카메라"
                fill
                sizes="84px"
                className="scale-[1.18] object-cover"
                priority
              />
            </div>

            <div className="absolute -bottom-1 right-7 z-20 h-[82px] w-[82px] overflow-hidden rounded-[22px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
              <Image
                src="/images/home/hero-clipboard.png"
                alt="견적 정리 체크리스트"
                fill
                sizes="82px"
                className="scale-[1.18] object-cover"
                priority
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartRequest()}
            className="flex h-14 w-full items-center justify-between rounded-[18px] bg-[#006BFF] px-5 text-[16px] font-black text-white shadow-[0_12px_26px_rgba(0,107,255,0.24)] transition-transform active:scale-[0.98]"
          >
            무료 견적 요청하기
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xl leading-none" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="rounded-[28px] border border-[#E5EAF2] bg-white px-4 pb-5 pt-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <h2 className="text-[21px] font-black text-[#111827]">간편한 3단계 과정</h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {serviceSteps.map((step, index) => (
              <article
                key={step.title}
                className="relative flex min-w-0 flex-col items-center px-1 text-center"
              >
                <span className="absolute left-1 top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#006BFF] text-[12px] font-black text-white shadow-[0_5px_12px_rgba(0,107,255,0.25)]">
                  {index + 1}
                </span>

                <div className="relative h-[94px] w-full overflow-hidden rounded-[20px] bg-white">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="110px"
                    className={index === 2 ? 'scale-[0.88] object-contain' : 'scale-[1.22] object-cover'}
                  />
                </div>

                {index < serviceSteps.length - 1 ? (
                  <span className="absolute -right-2 top-[43px] z-30 text-[22px] font-bold text-[#94A3B8]" aria-hidden="true">
                    ›
                  </span>
                ) : null}

                <h3 className="mt-2 break-keep text-[13px] font-black leading-snug text-[#111827]">{step.title}</h3>
                <p className="mt-1 break-keep text-[10px] font-semibold leading-[1.5] text-[#6B7280]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-[21px] font-black text-[#111827]">실제 견적 사례</h2>
            <p className="mt-1.5 text-[12px] font-semibold text-[#6B7280]">실제 접수부터 시공까지 진행한 사례예요.</p>
          </div>
          <span className="pb-0.5 text-[12px] font-bold text-[#64748B]">대표 사례</span>
        </div>

        <article className="overflow-hidden rounded-[26px] border border-[#E5EAF2] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
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
            <h3 className="mt-1.5 text-[21px] font-black text-[#111827]">벽지 + 장판 부분 복구</h3>

            <dl className="mt-5 space-y-3 border-y border-[#EDF1F6] py-4">
              <div className="flex items-center justify-between">
                <dt className="text-[14px] font-semibold text-[#475569]">벽지 부분 도배</dt>
                <dd className="text-[15px] font-black text-[#111827]">25만원</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[14px] font-semibold text-[#475569]">장판 부분 교체</dt>
                <dd className="text-[15px] font-black text-[#111827]">15만원</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-end justify-between">
              <span className="text-[14px] font-black text-[#111827]">총 진행 금액</span>
              <strong className="text-[32px] font-black leading-none text-[#006BFF]">40만원</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="px-4 pb-8 pt-4">
        <div className="overflow-hidden rounded-[28px] border border-[#DCEBFF] bg-[#EAF3FF] px-4 pb-5 pt-5 shadow-[0_12px_30px_rgba(0,107,255,0.08)]">
          <h2 className="text-[21px] font-black text-[#111827]">도와드리는 복구 항목</h2>
          <p className="mt-1.5 break-keep text-[12px] font-semibold leading-[1.55] text-[#64748B]">
            자주 요청되는 훼손 항목을 빠르게 접수할 수 있어요.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {repairItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onStartRequest()}
                className="flex min-w-0 flex-col items-center text-center transition-transform active:scale-[0.98]"
              >
                <span className="relative block aspect-square w-full overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_8px_20px_rgba(15,23,42,0.07)]">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="110px"
                    className="scale-[1.18] object-cover"
                  />
                </span>
                <strong className="mt-2.5 rounded-full bg-white px-4 py-1.5 text-[13px] font-black text-[#111827] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                  {item.title}
                </strong>
                <span className="mt-1 text-[9px] font-semibold text-[#64748B]">{item.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
