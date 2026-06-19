'use client';

export const IntroScreen = ({ onStart }: { onStart: () => void }) => {
  const averages = [
    { label: '벽지', value: '5~15만원' },
    { label: '장판', value: '10~30만원' },
    { label: '복합', value: '20~50만원' },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-5 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[480px] flex-col justify-center">
        <header className="mb-10 text-center">
          <img src="/petroom-logo-transparent.png" alt="" className="mx-auto h-16 w-16 object-contain" />
          <p className="mt-3 text-lg font-black tracking-[0.08em] text-navy">새집다오</p>
        </header>

        <section className="text-center">
          <h1 className="break-keep text-[28px] font-black leading-[1.3] tracking-tight text-[#1A1A1A]">
            반려동물이 훼손한 공간,
            <br />
            원상복구까지 연결해요
          </h1>
          <p className="mt-3 break-keep text-base leading-relaxed text-warm-muted">
            사진과 몇 가지 정보만 보내주시면 시공 가능 범위와 견적 기준을 정리해드립니다.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-coral-pink bg-coral-pale p-5">
          <p className="text-sm font-black text-navy">실제 평균 수리비</p>
          <dl className="mt-4 space-y-3">
            {averages.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[15px]">
                <dt className="font-bold text-warm-muted">{item.label}</dt>
                <dd className="font-black text-accent">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <p className="mt-2 text-center text-xs font-medium text-warm-caption">사진 기반 1차 견적 기준이며 실제 비용은 달라질 수 있어요.</p>

        <div className="mt-10 space-y-4">
          <button
            type="button"
            onClick={onStart}
            className="petroom-cta h-[52px] w-full rounded-xl px-6 text-base font-black text-white"
          >
            원상복구 견적 요청하기
          </button>
          <button type="button" onClick={onStart} className="w-full text-center text-sm font-bold text-warm-caption">
            일반 가정과 운영 공간 모두 요청할 수 있어요
          </button>
        </div>
      </div>
    </main>
  );
};
