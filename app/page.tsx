'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = {
  value: string;
  description: string;
};

type FormState = {
  userName: string;
  userContact: string;
  contactPreference: string;
  damageType: string;
  damageRange: string;
  area: string;
  layout: string;
  housingType: string;
  stuff: string;
  schedule: string;
  location: string;
  sameMaterial: string;
  damagePosition: string;
  repairIntent: string;
  memo: string;
  images: string[];
};

type FieldStep = {
  type: 'select' | 'input' | 'textarea';
  field: keyof Omit<FormState, 'images'>;
  title: string;
  description: string;
  placeholder?: string;
  optional?: boolean;
  options?: SelectOption[];
};

type SpecialStep = {
  type: 'photos' | 'contact' | 'review';
  title: string;
  description: string;
  optional?: boolean;
};

type Step = FieldStep | SpecialStep;

const initialForm: FormState = {
  userName: '',
  userContact: '',
  contactPreference: '',
  damageType: '',
  damageRange: '',
  area: '',
  layout: '',
  housingType: '',
  stuff: '',
  schedule: '',
  location: '',
  sameMaterial: '',
  damagePosition: '',
  repairIntent: '',
  memo: '',
  images: [],
};

const steps: Step[] = [
  {
    type: 'select',
    field: 'damageType',
    title: '어느 부분이 훼손됐나요?',
    description: '여러 곳이 함께 훼손됐다면 벽지+장판을 선택해주세요.',
    options: [
      { value: '벽지', description: '벽면 종이, 실크벽지, 벽 하단 훼손' },
      { value: '장판', description: '바닥 찍힘, 들뜸, 찢김, 오염' },
      { value: '벽지+장판', description: '벽과 바닥이 함께 훼손됨' },
    ],
  },
  {
    type: 'select',
    field: 'damageRange',
    title: '파손 범위는 어느 정도인가요?',
    description: '정확하지 않아도 괜찮아요. 사진으로 함께 확인합니다.',
    options: [
      { value: '손바닥 크기', description: '작게 뜯기거나 긁힌 정도' },
      { value: 'A4 크기', description: '종이 한 장 정도의 훼손' },
      { value: '벽/장판 일부', description: '한쪽 면이나 바닥 일부만 훼손' },
      { value: '방 절반', description: '한 공간의 절반 정도가 영향 있음' },
      { value: '방 전체', description: '방 전체 시공 가능성이 있음' },
      { value: '잘 모르겠음', description: '사진으로 판단이 필요해요' },
    ],
  },
  {
    type: 'input',
    field: 'area',
    title: '복구가 필요한 공간은 어느 정도인가요?',
    description: '대략적인 평수를 입력해주세요. 모르면 원룸, 작은방처럼 적어도 됩니다.',
    placeholder: '예: 6평, 원룸, 작은방',
    optional: true,
  },
  {
    type: 'select',
    field: 'layout',
    title: '공간 구조는 어떻게 되나요?',
    description: '복구가 필요한 공간의 구조를 선택해주세요.',
    options: [
      { value: '원룸', description: '방과 생활공간이 하나인 구조' },
      { value: '2룸 이상', description: '방이 2개 이상인 구조' },
      { value: '잘 모르겠음', description: '정확한 구조를 모르는 경우' },
    ],
  },
  {
    type: 'select',
    field: 'housingType',
    title: '어떤 집에서 복구가 필요한가요?',
    description: '현재 거주 중인 집의 유형을 선택해주세요.',
    options: [
      { value: '아파트', description: '아파트 단지 또는 공동주택' },
      { value: '빌라·연립', description: '빌라, 다세대, 연립주택' },
      { value: '오피스텔', description: '오피스텔 또는 도시형 생활주택' },
      { value: '기타', description: '위 항목에 해당하지 않음' },
    ],
  },
  {
    type: 'select',
    field: 'sameMaterial',
    title: '같은 자재가 남아 있나요?',
    description: '같은 벽지나 장판이 있으면 부분 복구 가능성이 높아집니다.',
    options: [
      { value: '있음', description: '남은 벽지나 장판 자재가 있어요' },
      { value: '없음', description: '같은 자재가 따로 없어요' },
      { value: '모르겠음', description: '있는지 확인이 필요해요' },
    ],
  },
  {
    type: 'select',
    field: 'damagePosition',
    title: '파손 위치는 어디에 가깝나요?',
    description: '훼손이 주로 어느 높이나 위치에 있는지 선택해주세요.',
    options: [
      { value: '하단', description: '바닥 가까이, 반려동물이 닿기 쉬운 위치' },
      { value: '중단', description: '벽 가운데나 생활 높이 주변' },
      { value: '상단', description: '천장 가까이 또는 높은 위치' },
      { value: '혼합', description: '여러 위치에 함께 훼손됨' },
    ],
  },
  {
    type: 'select',
    field: 'repairIntent',
    title: '어떤 방식으로 복구하고 싶나요?',
    description: '부분 복구만 원하는지, 전체 시공도 고려 가능한지 선택해주세요.',
    options: [
      { value: '부분만 원함', description: '훼손된 부분만 최소 복구하고 싶어요' },
      { value: '전체도 가능', description: '색 차이나 자재 문제면 전체 시공도 고려해요' },
    ],
  },
  {
    type: 'select',
    field: 'stuff',
    title: '작업 공간에 짐이 있나요?',
    description: '짐이 있으면 이동 시간이나 추가비가 생길 수 있습니다.',
    options: [
      { value: '없음', description: '작업 공간이 거의 비어 있어요' },
      { value: '일부 있음', description: '작은 가구나 짐이 조금 있어요' },
      { value: '많음', description: '가구 이동이나 정리가 필요해요' },
    ],
  },
  {
    type: 'select',
    field: 'schedule',
    title: '언제까지 작업이 필요하신가요?',
    description: '급한 일정은 견적이 높아질 수 있습니다.',
    options: [
      { value: '3일 이내', description: '퇴거가 임박해 빠른 작업이 필요해요' },
      { value: '1주일 이내', description: '이번 주 안에 작업하고 싶어요' },
      { value: '여유 있음', description: '일정 조율에 여유가 있어요' },
      { value: '협의 가능', description: '업체 가능 일정에 맞출 수 있어요' },
    ],
  },
  {
    type: 'input',
    field: 'location',
    title: '지역은 어디인가요?',
    description: '시공 가능 업체를 찾기 위해 시/구 단위로 입력해주세요.',
    placeholder: '예: 성남시 분당구',
  },
  {
    type: 'photos',
    title: '파손 사진을 올려주세요',
    description: '가까이 찍은 사진과 전체 공간 사진을 최소 2장 이상 권장합니다.',
  },
  {
    type: 'contact',
    title: '견적을 받을 연락처를 남겨주세요',
    description: '업체 견적이 도착하면 안내받을 연락처입니다.',
  },
  {
    type: 'textarea',
    field: 'memo',
    title: '업체에게 전달할 내용이 있나요?',
    description: '퇴거일, 원하는 복구 방식, 방문 견적 선호 여부 등을 자유롭게 적어주세요.',
    placeholder: '예: 퇴거일 전까지 부분 복구를 원합니다.',
    optional: true,
  },
  {
    type: 'review',
    title: '입력한 내용을 확인해주세요',
    description: '견적 요청을 보내면 예상 범위와 업체 입찰 대기 화면으로 이동합니다.',
  },
];

export default function PetRoomForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mainColor = '#1a4a5e';
  const highlight = '#16a34a';
  const step = steps[currentStep];
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  const summaryItems = useMemo(
    () =>
      [
        ['파손 유형', form.damageType],
        ['파손 범위', form.damageRange],
        ['면적', form.area || '미입력'],
        ['공간 구조', form.layout],
        ['주거 유형', form.housingType],
        ['동일 자재 여부', form.sameMaterial],
        ['파손 위치', form.damagePosition],
        ['복구 방식', form.repairIntent],
        ['짐 여부', form.stuff],
        ['일정', form.schedule],
        ['지역', form.location],
        ['사진 수', `${form.images.length}장`],
        ['연락 방식', form.contactPreference],
      ],
    [form],
  );

  const card = {
    background: '#fff',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #dbe3ea',
    fontSize: '15px',
  };

  const updateField = (field: keyof Omit<FormState, 'images'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result as string],
        }));
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const canProceed = () => {
    if (step.optional) {
      return true;
    }

    if (step.type === 'select' || step.type === 'input' || step.type === 'textarea') {
      return Boolean(form[step.field]?.trim());
    }

    if (step.type === 'photos') {
      return form.images.length >= 2;
    }

    if (step.type === 'contact') {
      return Boolean(form.userName.trim() && form.userContact.trim() && form.contactPreference);
    }

    return true;
  };

  const goNext = () => {
    if (!canProceed()) {
      alert(step.type === 'photos' ? '사진을 최소 2장 이상 첨부해주세요.' : '필수 정보를 입력해주세요.');
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      alert('견적 요청을 위해 필수 정보를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        images: undefined,
        imageCount: form.images.length,
      }),
    });
    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok || !result.ok) {
      alert(result.message ?? '견적 요청 저장 중 문제가 발생했습니다.');
      return;
    }

    const params = new URLSearchParams();

    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set('imageCount', String(value.length));
        return;
      }

      if (value) {
        params.set(key, value);
      }
    });

    params.set('requestId', result.requestId);
    params.set('estimatedMin', String(result.estimate.minPrice));
    params.set('estimatedMax', String(result.estimate.maxPrice));
    params.set('confidence', String(result.estimate.confidence));
    params.set('confidenceLabel', result.estimate.confidenceLabel);

    router.push(`/result?${params.toString()}`);
  };

  const renderSelect = (fieldStep: FieldStep) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
      {fieldStep.options?.map((option) => {
        const active = form[fieldStep.field] === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => updateField(fieldStep.field, option.value)}
            style={{
              minHeight: '78px',
              padding: '13px 14px',
              borderRadius: '14px',
              border: active ? `2px solid ${highlight}` : '1px solid #dbe3ea',
              background: active ? '#f0fdf4' : '#fff',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '5px', color: '#0f172a', fontSize: '14px' }}>
              {option.value}
            </strong>
            <span style={{ display: 'block', color: '#64748b', fontSize: '12px', lineHeight: 1.38 }}>
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderStep = () => {
    if (step.type === 'select') {
      return renderSelect(step);
    }

    if (step.type === 'input') {
      return (
        <input
          placeholder={step.placeholder}
          style={inputStyle}
          value={form[step.field]}
          onChange={(e) => updateField(step.field, e.target.value)}
        />
      );
    }

    if (step.type === 'textarea') {
      return (
        <textarea
          placeholder={step.placeholder}
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
          value={form[step.field]}
          onChange={(e) => updateField(step.field, e.target.value)}
        />
      );
    }

    if (step.type === 'photos') {
      return (
        <div>
          <div
            style={{
              border: '1px dashed #94a3b8',
              borderRadius: '14px',
              padding: '18px',
              background: '#f8fafc',
            }}
          >
            <input type="file" multiple accept="image/*" onChange={handleImage} />
            <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
              가까이 찍은 사진 1장과 공간 전체 사진 1장을 올리면 견적 범위가 더 정확해집니다.
            </p>
          </div>
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {previews.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`업로드한 사진 미리보기 ${index + 1}`}
                  style={{ width: '68px', height: '68px', borderRadius: '10px', objectFit: 'cover' }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (step.type === 'contact') {
      return (
        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            placeholder="이름 또는 닉네임"
            style={inputStyle}
            value={form.userName}
            onChange={(e) => updateField('userName', e.target.value)}
          />
          <input
            placeholder="연락처"
            style={inputStyle}
            value={form.userContact}
            onChange={(e) => updateField('userContact', e.target.value)}
          />
          {renderSelect({
            type: 'select',
            field: 'contactPreference',
            title: '',
            description: '',
            options: [
              { value: '문자', description: '문자로만 연락받고 싶어요' },
              { value: '전화 가능', description: '필요하면 전화 상담도 가능해요' },
            ],
          })}
        </div>
      );
    }

    return (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '9px' }}>
        {summaryItems.map(([label, value]) => (
          <li
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              color: '#334155',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: '#64748b', flex: '0 0 auto' }}>{label}</span>
            <strong style={{ color: mainColor, textAlign: 'right', fontWeight: 700 }}>{value}</strong>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '22px' }}>
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ display: 'block', width: '104px', margin: '0 auto 8px' }}
          />
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px', lineHeight: 1.15 }}>PET ROOM</h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>
            하나씩 답하면 예상 견적 범위를 확인할 수 있어요
          </p>
        </header>

        <section style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: mainColor, fontSize: '13px', fontWeight: 800 }}>
              질문 {currentStep + 1} / {steps.length}
            </span>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ position: 'relative', height: '42px' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '19px',
                height: '8px',
                borderRadius: '999px',
                background: '#e2e8f0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: highlight,
                }}
              />
            </div>
            <img
              src="/shiba-progress.svg"
              alt="진행 중인 시바견"
              style={{
                position: 'absolute',
                left: `clamp(0px, calc(${progress}% - 20px), calc(100% - 40px))`,
                top: 0,
                width: '40px',
                height: '40px',
                transition: 'left 180ms ease',
              }}
            />
          </div>
        </section>

        <section style={card}>
          <p style={{ margin: '0 0 8px', color: highlight, fontSize: '13px', fontWeight: 800 }}>
            PET ROOM이 묻습니다
          </p>
          <h2 style={{ margin: '0 0 8px', color: mainColor, fontSize: '22px', lineHeight: 1.32 }}>
            {step.title}
          </h2>
          <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
            {step.description}
          </p>
          {renderStep()}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: currentStep === 0 ? '1fr' : '110px 1fr', gap: '10px', marginTop: '14px' }}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={goBack}
              style={{
                padding: '15px',
                borderRadius: '14px',
                border: '1px solid #dbe3ea',
                background: '#fff',
                color: '#334155',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              이전
            </button>
          )}
          {step.type === 'review' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                background: isSubmitting ? '#94a3b8' : highlight,
                color: '#fff',
                fontSize: '16px',
                fontWeight: 900,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? '견적 요청 저장 중...' : '입찰 요청하기'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                background: canProceed() ? highlight : '#94a3b8',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {step.optional && !canProceed() ? '건너뛰기' : '다음'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
