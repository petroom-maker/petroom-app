'use client';

import { useState } from 'react';
import type { AuthProvider } from './types';

const inputClassName =
  'h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy outline-none focus:border-accent';

const petTypes = ['강아지', '고양이', '기타'];
const regions = ['서울', '경기', '인천', '부산', '기타'];

type Term = {
  label: string;
  checked: boolean;
  setter: (value: boolean) => void;
  badge: '필수' | '선택';
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Some in-app browser contexts can block localStorage. Keep the UI flow working.
  }
};

export const OnboardingScreen = ({
  provider,
  onComplete,
}: {
  provider: AuthProvider;
  onComplete: (profile: { nickname: string; phone: string; region: string; petType: string }) => void;
}) => {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [petType, setPetType] = useState('');
  const [requiredTerms, setRequiredTerms] = useState(false);
  const [locationTerms, setLocationTerms] = useState(false);
  const [marketingTerms, setMarketingTerms] = useState(false);

  const terms: Term[] = [
    {
      label: '이용약관 및 개인정보 처리방침 동의',
      checked: requiredTerms,
      setter: setRequiredTerms,
      badge: '필수',
    },
    {
      label: '위치기반서비스 이용약관 동의',
      checked: locationTerms,
      setter: setLocationTerms,
      badge: '필수',
    },
    {
      label: '이벤트 및 마케팅 알림 수신 동의',
      checked: marketingTerms,
      setter: setMarketingTerms,
      badge: '선택',
    },
  ];

  const goNext = () => {
    if (step === 0 && (!phone.trim() || code.trim().length < 4)) {
      alert('휴대폰 번호와 인증번호를 입력해주세요.');
      return;
    }

    if (step === 1 && (!nickname.trim() || !region || !petType)) {
      alert('닉네임, 거주 지역, 반려동물 정보를 입력해주세요.');
      return;
    }

    if (step === 2 && (!requiredTerms || !locationTerms)) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    if (step < 2) {
      setStep((prev) => prev + 1);
      return;
    }

    writeStorage(
      'petroom_profile',
      JSON.stringify({ nickname, phone, region, petType, provider, marketingTerms }),
    );
    writeStorage('petroom_phone_verified', 'true');
    writeStorage('petroom_onboarded', 'true');
    writeStorage('petroom_logged_in', 'true');
    onComplete({ nickname, phone, region, petType });
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-[400px]">
        <header className="mb-8">
          <img src="/petroom-logo-transparent.png" alt="PET ROOM" className="mb-4 h-12 w-12 object-contain" />
          <p className="mb-2 text-xs font-extrabold text-slate-400">{provider} 로그인 완료</p>
          <h1 className="text-2xl font-extrabold leading-snug text-navy">
            안전한 이용을 위해
            <br />
            조금만 확인할게요
          </h1>
        </header>

        <div className="mb-6 flex gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-navy' : 'bg-slate-100'}`}
            />
          ))}
        </div>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-900/5">
          {step === 0 && (
            <div className="space-y-3">
              <h2 className="mb-1 text-xl font-extrabold text-navy">휴대폰 인증</h2>
              <p className="mb-2 text-sm leading-relaxed text-slate-400">
                견적·상담 알림을 안전하게 확인하기 위한 단계예요.
              </p>
              <input
                inputMode="tel"
                placeholder="휴대폰 번호"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClassName}
              />
              <input
                inputMode="numeric"
                placeholder="인증번호 4자리"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={inputClassName}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <h2 className="mb-1 text-xl font-extrabold text-navy">기본 정보</h2>
              <input
                placeholder="닉네임"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                className={inputClassName}
              />
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className={inputClassName}
              >
                <option value="">거주 지역 선택</option>
                {regions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                {petTypes.map((item) => {
                  const selected = petType === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPetType(item)}
                      className={`h-12 rounded-2xl text-sm font-extrabold ${
                        selected ? 'border-2 border-accent bg-blue-50 text-accent' : 'border border-slate-200 text-navy'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="mb-1 text-xl font-extrabold text-navy">약관 동의</h2>
              {terms.map(({ label, checked, setter, badge }) => (
                <label
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-navy"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => setter(event.target.checked)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="flex-1">{label}</span>
                  <span className={`text-xs font-extrabold ${badge === '필수' ? 'text-navy' : 'text-slate-400'}`}>
                    {badge}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <div className={`mt-4 grid gap-3 ${step > 0 ? 'grid-cols-[96px_1fr]' : 'grid-cols-1'}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="h-14 rounded-2xl border border-slate-200 text-sm font-extrabold text-navy"
            >
              이전
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="h-14 rounded-2xl bg-accent text-sm font-extrabold text-white"
          >
            {step === 2 ? '펫룸 시작하기' : '다음'}
          </button>
        </div>
      </div>
    </main>
  );
};
