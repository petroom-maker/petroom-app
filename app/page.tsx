'use client';
import { ChangeEvent, useState } from 'react';
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

export default function PetRoomForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
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
    images: [] as string[],
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mainColor = '#1a4a5e';

  const card = {
    background: '#fff',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
  };

  const label = {
    fontWeight: '700',
    marginBottom: '6px',
    display: 'block',
    color: mainColor,
    fontSize: '17px',
  };

  const helpText = {
    margin: '0 0 12px',
    color: '#64748b',
    fontSize: '13px',
    lineHeight: 1.55,
  };

  const btn = (active: boolean) => ({
    padding: '13px 14px',
    minHeight: '72px',
    borderRadius: '12px',
    border: active ? '2px solid #16a34a' : '1px solid #e5e7eb',
    background: active ? '#f0fdf4' : '#fff',
    cursor: 'pointer',
    textAlign: 'left' as const,
  });

  const selectBox = (field: keyof Omit<FormState, 'images'>, options: SelectOption[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
      {options.map((opt) => (
        <div
          key={opt.value}
          onClick={() => setForm({ ...form, [field]: opt.value })}
          style={btn(form[field] === opt.value)}
        >
          <strong
            style={{
              display: 'block',
              color: '#0f172a',
              fontSize: '14px',
              lineHeight: 1.25,
              marginBottom: '5px',
            }}
          >
            {opt.value}
          </strong>
          <span
            style={{
              display: 'block',
              color: '#64748b',
              fontSize: '12px',
              lineHeight: 1.35,
            }}
          >
            {opt.description}
          </span>
        </div>
      ))}
    </div>
  );

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

  const handleSubmit = async () => {
    const requiredFields: Array<keyof Pick<
      FormState,
      | 'userName'
      | 'userContact'
      | 'contactPreference'
      | 'damageType'
      | 'damageRange'
      | 'layout'
      | 'sameMaterial'
      | 'damagePosition'
      | 'repairIntent'
      | 'stuff'
      | 'schedule'
    >> = [
      'userName',
      'userContact',
      'contactPreference',
      'damageType',
      'damageRange',
      'layout',
      'sameMaterial',
      'damagePosition',
      'repairIntent',
      'stuff',
      'schedule',
    ];

    const hasMissingRequiredField = requiredFields.some((field) => !form[field]);

    if (hasMissingRequiredField || !form.location.trim() || form.images.length < 2) {
      alert('견적 요청을 위해 필수 정보를 입력하고 사진을 최소 2장 이상 첨부해주세요.');
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

  return (
    <main style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ width: '120px', marginBottom: '10px' }}
          />

          <h2 style={{ margin: 0 }}>PET ROOM</h2>

          <p style={{ fontSize: '13px', color: '#64748b' }}>
            입력 정보를 기반으로 견적 범위를 제공합니다
          </p>
        </div>

        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontWeight: 600,
          }}
        >
          💡 <b>정확하게 입력할수록 실제 견적과의 오차가 줄어듭니다</b><br />
          입력 정보가 부족하면 현장에서 추가 비용이 발생할 수 있습니다.
        </div>

        <div style={card}>
          <label style={label}>0. 견적 받을 연락처</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            <input
              placeholder="이름 또는 닉네임"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
              }}
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
            />
            <input
              placeholder="연락처"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
              }}
              value={form.userContact}
              onChange={(e) => setForm({ ...form, userContact: e.target.value })}
            />
            {selectBox('contactPreference', [
              { value: '문자', description: '문자로만 연락받고 싶어요' },
              { value: '전화 가능', description: '필요하면 전화 상담도 가능해요' },
            ])}
          </div>
        </div>

        <div style={card}>
          <label style={label}>1. 파손 유형</label>
          <p style={helpText}>
            어느 부분이 훼손되었는지 선택해주세요. 여러 곳이 함께 훼손된 경우에는
            벽지+장판을 선택하면 됩니다.
          </p>
          {selectBox('damageType', [
            { value: '벽지', description: '벽면 종이, 실크벽지, 벽 하단 훼손' },
            { value: '장판', description: '바닥 찍힘, 들뜸, 찢김, 오염' },
            { value: '벽지+장판', description: '벽과 바닥이 함께 훼손됨' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>2. 파손 범위</label>
          <p style={helpText}>
            훼손된 크기와 범위를 가장 비슷한 항목으로 선택해주세요. 정확하지 않아도 괜찮고,
            사진으로 함께 확인합니다.
          </p>
          {selectBox('damageRange', [
            { value: '손바닥 크기', description: '작게 뜯기거나 긁힌 정도' },
            { value: 'A4 크기', description: '종이 한 장 정도의 훼손' },
            { value: '벽/장판 일부', description: '한쪽 면이나 바닥 일부만 훼손' },
            { value: '방 절반', description: '한 공간의 절반 정도가 영향 있음' },
            { value: '방 전체', description: '방 전체 시공 가능성이 있음' },
            { value: '잘 모르겠음', description: '사진으로 판단이 필요해요' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>3. 면적</label>
          <p style={helpText}>
            복구가 필요한 방이나 공간의 대략적인 평수를 입력해주세요. 모르면 원룸, 작은방처럼
            적어도 됩니다.
          </p>
          <input
            placeholder="예: 6평, 원룸, 작은방"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
        </div>

        <div style={card}>
          <label style={label}>4. 공간 구조</label>
          <p style={helpText}>복구가 필요한 공간이 어떤 구조인지 선택해주세요.</p>
          {selectBox('layout', [
            { value: '원룸', description: '방과 생활공간이 하나인 구조' },
            { value: '2룸 이상', description: '방이 2개 이상인 구조' },
            { value: '잘 모르겠음', description: '정확한 구조를 모르는 경우' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>5. 주거 유형</label>
          <p style={helpText}>현재 거주 중인 집의 유형을 선택해주세요.</p>
          {selectBox('housingType', [
            { value: '아파트', description: '아파트 단지 또는 공동주택' },
            { value: '빌라·연립', description: '빌라, 다세대, 연립주택' },
            { value: '오피스텔', description: '오피스텔 또는 도시형 생활주택' },
            { value: '기타', description: '위 항목에 해당하지 않음' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>6. 동일 자재 여부</label>
          <p style={helpText}>같은 벽지나 장판 자재가 있으면 부분 복구 가능성이 높아집니다.</p>
          {selectBox('sameMaterial', [
            { value: '있음', description: '남은 벽지나 장판 자재가 있어요' },
            { value: '없음', description: '같은 자재가 따로 없어요' },
            { value: '모르겠음', description: '있는지 확인이 필요해요' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>7. 파손 위치</label>
          <p style={helpText}>훼손이 주로 어느 높이나 위치에 있는지 선택해주세요.</p>
          {selectBox('damagePosition', [
            { value: '하단', description: '바닥 가까이, 반려동물이 닿기 쉬운 위치' },
            { value: '중단', description: '벽 가운데나 생활 높이 주변' },
            { value: '상단', description: '천장 가까이 또는 높은 위치' },
            { value: '혼합', description: '여러 위치에 함께 훼손됨' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>8. 복구 방식</label>
          <p style={helpText}>
            훼손된 부분만 고치고 싶은지, 색 차이나 자재 문제 때문에 전체 시공도 고려 가능한지
            선택해주세요.
          </p>
          {selectBox('repairIntent', [
            { value: '부분만 원함', description: '훼손된 부분만 최소 복구하고 싶어요' },
            { value: '전체도 가능', description: '색 차이나 자재 문제면 전체 시공도 고려해요' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>9. 짐 여부</label>
          <p style={helpText}>작업 공간에 짐이 있으면 이동 시간이나 추가비가 생길 수 있습니다.</p>
          {selectBox('stuff', [
            { value: '없음', description: '작업 공간이 거의 비어 있어요' },
            { value: '일부 있음', description: '작은 가구나 짐이 조금 있어요' },
            { value: '많음', description: '가구 이동이나 정리가 필요해요' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>10. 일정</label>
          <p style={helpText}>작업이 필요한 시점을 선택해주세요. 급한 일정은 비용이 높아질 수 있습니다.</p>
          {selectBox('schedule', [
            { value: '3일 이내', description: '퇴거가 임박해 빠른 작업이 필요해요' },
            { value: '1주일 이내', description: '이번 주 안에 작업하고 싶어요' },
            { value: '여유 있음', description: '일정 조율에 여유가 있어요' },
            { value: '협의 가능', description: '업체 가능 일정에 맞출 수 있어요' },
          ])}
        </div>

        <div style={card}>
          <label style={label}>11. 지역</label>
          <input
            placeholder="예: 성남시 분당구"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        <div style={card}>
          <label style={label}>12. 업체에게 전달할 메모</label>
          <textarea
            placeholder="예: 퇴거일 전까지 부분 복구를 원합니다. 방문 견적보다 사진 견적을 먼저 받고 싶습니다."
            style={{
              width: '100%',
              minHeight: '96px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              resize: 'vertical',
            }}
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </div>

        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '12px',
            fontWeight: 600,
          }}
        >
          📸 <b>사진이 많을수록 견적 오차를 줄일 수 있습니다</b><br />
          ✔ 가까이 찍은 사진<br />
          ✔ 전체 공간 사진<br />
          최소 2장 이상 권장
        </div>

        <div style={card}>
          <input type="file" multiple onChange={handleImage} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`업로드한 사진 미리보기 ${i + 1}`}
                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '18px',
            background: isSubmitting ? '#94a3b8' : '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? '견적 요청 저장 중...' : '예상 견적 범위 확인하기'}
        </button>
      </div>
    </main>
  );
}
