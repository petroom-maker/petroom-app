'use client';
import { useState } from 'react';

export default function PetRoomForm() {
  const [form, setForm] = useState({
    damageType: '',
    damageRange: '',
    layout: '',
    stuff: '',
    schedule: '',
    location: '',
    sameMaterial: '',
    damagePosition: '',
    repairIntent: '',
    images: [] as string[],
  });

  const [previews, setPreviews] = useState<string[]>([]);

  const mainColor = '#1a4a5e';

  const card = {
    background: '#fff',
    padding: '18px',
    borderRadius: '14px',
    marginBottom: '14px',
    border: '1px solid #e5e7eb',
  };

  const label = {
    fontWeight: '700',
    marginBottom: '10px',
    display: 'block',
    color: mainColor,
  };

  const btn = (active: boolean) => ({
    padding: '12px',
    borderRadius: '10px',
    border: active ? '2px solid #16a34a' : '1px solid #e5e7eb',
    background: active ? '#f0fdf4' : '#fff',
    cursor: 'pointer',
    textAlign: 'center' as const,
    fontWeight: '600',
    fontSize: '13px',
  });

  const selectBox = (field: string, options: string[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
      {options.map((opt) => (
        <div
          key={opt}
          onClick={() => setForm({ ...form, [field]: opt })}
          style={btn((form as any)[field] === opt)}
        >
          {opt}
        </div>
      ))}
    </div>
  );

  const handleImage = (e: any) => {
    const files = Array.from(e.target.files);
    files.forEach((file: any) => {
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
          <label style={label}>1. 파손 유형</label>
          {selectBox('damageType', ['벽지', '장판', '벽지+장판', '문/몰딩'])}
        </div>

        <div style={card}>
          <label style={label}>2. 파손 범위</label>
          {selectBox('damageRange', [
            '손바닥 크기',
            'A4 크기',
            '벽/바닥 일부',
            '방 절반',
            '방 전체',
            '잘 모르겠음',
          ])}
        </div>

        <div style={card}>
          <label style={label}>3. 공간 구조</label>
          {selectBox('layout', ['원룸', '2룸 이상', '잘 모르겠음'])}
        </div>

        <div style={card}>
          <label style={label}>4. 동일 자재 여부</label>
          {selectBox('sameMaterial', ['있음', '없음', '모르겠음'])}
        </div>

        <div style={card}>
          <label style={label}>5. 파손 위치</label>
          {selectBox('damagePosition', ['하단', '중단', '상단', '혼합'])}
        </div>

        <div style={card}>
          <label style={label}>6. 복구 방식</label>
          {selectBox('repairIntent', ['부분만 원함', '전체도 가능', '잘 모르겠음'])}
        </div>

        <div style={card}>
          <label style={label}>7. 짐 여부</label>
          {selectBox('stuff', ['없음', '일부 있음', '많음'])}
        </div>

        <div style={card}>
          <label style={label}>8. 일정</label>
          {selectBox('schedule', ['3일 이내', '1주일 이내', '여유 있음', '협의 가능'])}
        </div>

        <div style={card}>
          <label style={label}>9. 지역</label>
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
              <img key={i} src={src} style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
            ))}
          </div>
        </div>

        <button
          style={{
            width: '100%',
            padding: '18px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '16px',
          }}
        >
          예상 견적 범위 확인하기
        </button>
      </div>
    </main>
  );
}