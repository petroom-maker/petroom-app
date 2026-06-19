'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import type { AppScreen } from './types';

type WizardForm = {
  damageType: string;
  damageRange: string;
  housingType: string;
  layout: string;
  repairIntent: string;
  location: string;
  contactPreference: string;
};

const initialForm: WizardForm = {
  damageType: '',
  damageRange: '',
  housingType: '',
  layout: '',
  repairIntent: '',
  location: '',
  contactPreference: '',
};

const resizeImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('사진을 처리할 수 없습니다.'));
    };
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('사진을 처리할 수 없습니다.'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.src = objectUrl;
  });

const damageTypeOptions = ['벽지', '장판', '문', '몰딩', '여러 곳', '잘 모르겠어요'];
const damageTypeDescriptions: Record<string, string> = {
  벽지: '뜯김 · 오염 · 스크래치',
  장판: '찍힘 · 들뜸 · 긁힘',
  문: '긁힘 · 물어뜯음 · 파손',
  몰딩: '긁힘 · 뜯김 · 파손',
  '여러 곳': '벽지+장판 등',
  '잘 모르겠어요': '사진 보고 확인 요청',
};
const damageRangeOptions = ['손바닥 1개 이하', '손바닥 2~3개', '한 벽면 일부', '방 전체', '잘 모르겠어요'];
const housingTypeOptions = ['원룸', '오피스텔', '아파트', '빌라'];
const repairIntentOptions = ['퇴거 예정', '집주인 협의', '보증금 걱정', '생활 중 수리', '시공 범위 확인'];
const contactOptions = ['전화 가능', '문자만 가능', '앱 알림으로 확인'];

const stepHelp: Record<number, string> = {
  0: '정확히 몰라도 괜찮아요. 사진을 보고 펫룸이 다시 확인해드려요.',
  1: '가까이 찍은 사진 1장, 전체 공간 사진 1장을 올리면 견적이 더 정확해져요.',
  4: '퇴거 예정이면 집주인 협의에 필요한 견적 기준도 함께 안내드려요.',
  5: '시공 가능 업체를 찾기 위해 필요해요.',
};

const TOTAL_STEPS = 8;

const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const OptionList = ({
  options,
  value,
  onSelect,
  descriptions,
}: {
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  descriptions?: Record<string, string>;
}) => (
  <div className="space-y-3">
    {options.map((option) => {
      const selected = value === option;

      return (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`w-full rounded-2xl border px-4 py-4 text-left text-sm font-bold transition-colors ${
            selected ? 'border-accent bg-blue-50 text-accent' : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <span className="block">{option}</span>
          {descriptions?.[option] && (
            <span className={`mt-1 block text-xs font-medium ${selected ? 'text-accent/70' : 'text-slate-400'}`}>
              {descriptions[option]}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const EstimateWizard = ({
  onChangeScreen,
  initialDamageType,
}: {
  onChangeScreen: (screen: AppScreen) => void;
  initialDamageType?: string;
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>({ ...initialForm, damageType: initialDamageType ?? '' });
  const [closeUpPhoto, setCloseUpPhoto] = useState<string | null>(null);
  const [wideShotPhoto, setWideShotPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState<{ min: number; max: number } | null>(null);

  const update = <K extends keyof WizardForm>(field: K, value: WizardForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const photoCount = [closeUpPhoto, wideShotPhoto].filter(Boolean).length;

  const canProceed = () => {
    switch (step) {
      case 0:
        return Boolean(form.damageType);
      case 1:
        return photoCount >= 2;
      case 2:
        return Boolean(form.damageRange);
      case 3:
        return Boolean(form.housingType);
      case 4:
        return Boolean(form.repairIntent);
      case 5:
        return Boolean(form.location.trim());
      case 6:
        return Boolean(form.contactPreference);
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!canProceed()) {
      alert(step === 1 ? '사진을 2장 모두 올려주세요.' : '항목을 선택해주세요.');
      return;
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    if (step === 0) {
      onChangeScreen('home');
      return;
    }

    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handlePhotoChange = async (slot: 'close' | 'wide', e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const resized = await resizeImage(file);

      if (slot === 'close') {
        setCloseUpPhoto(resized);
      } else {
        setWideShotPhoto(resized);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '사진을 처리할 수 없습니다.');
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const images = [closeUpPhoto, wideShotPhoto].filter((value): value is string => Boolean(value));
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          damageType: form.damageType,
          damageRange: form.damageRange,
          housingType: form.housingType,
          layout: form.layout,
          repairIntent: form.repairIntent,
          location: form.location,
          images,
          imageCount: images.length,
          userName: '게스트',
          userContact: '앱에서 확인',
          contactPreference: form.contactPreference,
          area: '',
          sameMaterial: '',
          damagePosition: '',
          stuff: '',
          schedule: '',
          memo: '',
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setSubmitError(result.message ?? '견적 요청 저장 중 문제가 발생했습니다.');
        return;
      }

      setSubmitResult({ min: result.estimate.minPrice, max: result.estimate.maxPrice });
    } catch {
      setSubmitError('네트워크 오류로 견적 요청을 보내지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (step === TOTAL_STEPS - 1 && !submitResult && !submitError && !isSubmitting) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepTitle = (() => {
    switch (step) {
      case 0:
        return '어디가 가장 많이 망가졌나요?';
      case 1:
        return '사진을 올려주세요';
      case 2:
        return '손상 크기는 어느 정도인가요?';
      case 3:
        return '어떤 집인가요?';
      case 4:
        return '왜 견적이 필요하신가요?';
      case 5:
        return '지역을 입력해주세요';
      case 6:
        return '연락 방법을 입력해주세요';
      default:
        return '접수 완료';
    }
  })();

  return (
    <div className="flex min-h-[75vh] flex-col">
      <header className="mb-6 flex items-center justify-between">
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500"
          >
            ←
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
        <span className="text-xs font-extrabold text-slate-400">
          {Math.min(step + 1, TOTAL_STEPS)} / {TOTAL_STEPS}
        </span>
      </header>

      <div className="flex-1">
        <h1 className={`text-xl font-extrabold leading-snug text-navy ${stepHelp[step] ? 'mb-2' : 'mb-6'}`}>
          {stepTitle}
        </h1>
        {stepHelp[step] && <p className="mb-6 text-sm leading-relaxed text-slate-400">{stepHelp[step]}</p>}

        {step === 0 && (
          <OptionList
            options={damageTypeOptions}
            value={form.damageType}
            onSelect={(value) => update('damageType', value)}
            descriptions={damageTypeDescriptions}
          />
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-3">
            {(
              [
                { slot: 'close' as const, label: '가까이 찍은 사진', photo: closeUpPhoto },
                { slot: 'wide' as const, label: '전체 공간 사진', photo: wideShotPhoto },
              ]
            ).map((item) => (
              <label
                key={item.slot}
                className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300"
              >
                {item.photo ? (
                  <img src={item.photo} alt={item.label} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-10 text-slate-400">
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-xs">탭해서 사진 추가</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(item.slot, e)} />
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <OptionList options={damageRangeOptions} value={form.damageRange} onSelect={(value) => update('damageRange', value)} />
        )}

        {step === 3 && (
          <OptionList
            options={housingTypeOptions}
            value={form.housingType}
            onSelect={(value) =>
              setForm((prev) => ({ ...prev, housingType: value, layout: value === '원룸' ? '원룸' : '2룸 이상' }))
            }
          />
        )}

        {step === 4 && (
          <OptionList
            options={repairIntentOptions}
            value={form.repairIntent}
            onSelect={(value) => update('repairIntent', value)}
          />
        )}

        {step === 5 && (
          <input
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="예: 성남시 분당구"
            className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-sm font-bold text-navy outline-none focus:border-accent"
          />
        )}

        {step === 6 && (
          <OptionList
            options={contactOptions}
            value={form.contactPreference}
            onSelect={(value) => update('contactPreference', value)}
          />
        )}

        {step === 7 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            {isSubmitting && <p className="text-sm font-bold text-slate-500">견적 요청을 등록하는 중이에요...</p>}

            {!isSubmitting && submitError && (
              <>
                <p className="mb-4 text-sm font-bold text-slate-500">{submitError}</p>
                <button
                  type="button"
                  onClick={submit}
                  className="w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
                >
                  다시 시도
                </button>
              </>
            )}

            {!isSubmitting && submitResult && (
              <>
                <p className="mb-2 text-sm font-bold text-slate-500">견적 요청이 접수됐어요</p>
                <p className="mb-6 text-2xl font-extrabold text-navy">
                  {formatWon(submitResult.min)} ~ {formatWon(submitResult.max)}
                </p>
                <p className="mb-6 text-xs leading-relaxed text-slate-400">
                  실제 비용은 사진, 면적, 자재, 현장 상태에 따라 달라질 수 있어요.
                  <br />
                  업체 선택 전까지 연락처는 공개되지 않아요.
                </p>
                <button
                  type="button"
                  onClick={() => onChangeScreen('myQuotes')}
                  className="w-full rounded-2xl bg-accent px-5 py-3.5 text-sm font-extrabold text-white"
                >
                  내 견적 보러가기
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {step < TOTAL_STEPS - 1 && (
        <button
          type="button"
          onClick={goNext}
          className="mt-8 w-full rounded-2xl bg-accent px-5 py-4 text-sm font-extrabold text-white"
        >
          {step === TOTAL_STEPS - 2 ? '제출하기' : '다음'}
        </button>
      )}
    </div>
  );
};
