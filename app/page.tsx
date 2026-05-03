'use client';
import { useState } from 'react';

type DamagePart = {
  name: string;
  scale: string;
};

export default function PetRoomApp() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: '빌라/원룸',
    repairType: '경제적',
    parts: [] as DamagePart[],
    wallSize: '',
    wallWidth: '',
    wallHeight: '',
    damageLocation: '',
    damageWidth: '',
    damageHeight: '',
    wallpaperType: '모름',
    wallpaperSame: '모름',
    furnitureMove: '',
    moveDate: '',
    contactMethod: '채팅 선호',
    hasEstimate: '없음',
    estimatePrice: '',
    images: [] as string[],
    extra: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const GOOGLE_URL =
    'https://script.google.com/macros/s/AKfycby0vCbBK7cQgEDyFX2URPFxrgZoHlupQP142mDj0_6ZmBi-1iJxKLVgrkIFgmMfwBsO/exec';

  const mainColor = '#1a4a5e';

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '15px',
    border: '1px solid #e2e8f0',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '15px',
    fontWeight: 'bold',
    color: mainColor,
    marginBottom: '12px',
    lineHeight: '1.4',
  };

  const guideStyle = {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '12px',
    lineHeight: '1.5',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    marginBottom: '10px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  };

  const btnStyle = (isSelected: boolean) => ({
    padding: '12px 6px',
    textAlign: 'center' as const,
    borderRadius: '10px',
    cursor: 'pointer',
    border: `2px solid ${isSelected ? mainColor : '#f1f5f9'}`,
    backgroundColor: isSelected ? '#f0f9ff' : '#fff',
    color: isSelected ? mainColor : '#94a3b8',
    fontSize: '13px',
    fontWeight: 'bold',
  });

  const selectOptions = (
    field: keyof typeof formData,
    options: string[],
    columns = 2
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '8px',
      }}
    >
      {options.map((option) => (
        <div
          key={option}
          onClick={() => setFormData({ ...formData, [field]: option })}
          style={btnStyle(formData[field] === option)}
        >
          {option}
        </div>
      ))}
    </div>
  );

  const togglePart = (partName: string) => {
    const exists = formData.parts.find((p) => p.name === partName);

    if (exists) {
      setFormData({
        ...formData,
        parts: formData.parts.filter((p) => p.name !== partName),
      });
    } else {
      setFormData({
        ...formData,
        parts: [...formData.parts, { name: partName, scale: '손바닥 2~3개' }],
      });
    }
  };

  const updatePartScale = (partName: string, scale: string) => {
    setFormData({
      ...formData,
      parts: formData.parts.map((p) =>
        p.name === partName ? { ...p, scale } : p
      ),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (formData.images.length + files.length > 5) {
      alert('사진은 최대 5장까지만 업로드 가능합니다.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, result],
        }));
        setPreviews((prev) => [...prev, result]);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert('성함과 연락처를 입력해주세요.');
      return;
    }

    if (formData.parts.length === 0) {
      alert('최소 하나 이상의 파손 부위를 선택해주세요.');
      return;
    }

    if (formData.images.length === 0) {
      alert('사진을 최소 1장 이상 첨부해주세요.');
      return;
    }

    setIsLoading(true);

    const payload = {
      name: formData.name,
      phone: formData.phone,
      type: formData.type,
      repairType: formData.repairType,
      partsDetail: formData.parts
        .map((p) => `${p.name}(${p.scale})`)
        .join(', '),
      wallSize: formData.wallSize,
      wallWidth: formData.wallWidth,
      wallHeight: formData.wallHeight,
      damageLocation: formData.damageLocation,
      damageScale: formData.parts.map((p) => `${p.name}:${p.scale}`).join(', '),
      damageWidth: formData.damageWidth,
      damageHeight: formData.damageHeight,
      wallpaperType: formData.wallpaperType,
      wallpaperSame: formData.wallpaperSame,
      furnitureMove: formData.furnitureMove,
      moveDate: formData.moveDate,
      contactMethod: formData.contactMethod,
      hasEstimate: formData.hasEstimate,
      estimatePrice: formData.estimatePrice,
      extra: formData.extra,
      images: formData.images,
    };

    try {
      await fetch(GOOGLE_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      alert('접수 완료! 입력하신 정보를 바탕으로 예상 비용 범위를 안내드리겠습니다.');

      setFormData({
        name: '',
        phone: '',
        type: '빌라/원룸',
        repairType: '경제적',
        parts: [],
        wallSize: '',
        wallWidth: '',
        wallHeight: '',
        damageLocation: '',
        damageWidth: '',
        damageHeight: '',
        wallpaperType: '모름',
        wallpaperSame: '모름',
        furnitureMove: '',
        moveDate: '',
        contactMethod: '채팅 선호',
        hasEstimate: '없음',
        estimatePrice: '',
        images: [],
        extra: '',
      });

      setPreviews([]);
    } catch (err) {
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const damageScaleOptions = [
    '손바닥 1개 이하',
    '손바닥 2~3개',
    'A4 1장 정도',
    'A4 2~3장',
    '하단 가로로 길게',
    '벽면/바닥 30% 이상',
  ];

  return (
    <main style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        input, textarea {
          font-family: inherit;
        }
      `}</style>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ width: '140px', height: 'auto', marginBottom: '10px' }}
          />

          <h1
            style={{
              color: mainColor,
              fontSize: '26px',
              fontWeight: '900',
              margin: '0',
            }}
          >
            PET ROOM
          </h1>

          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
            원상복구, 기준부터 확인하세요
          </p>

          <p
            style={{
              color: '#334155',
              fontSize: '13px',
              marginTop: '10px',
              lineHeight: '1.6',
              fontWeight: '600',
            }}
          >
            사진과 간단한 정보만 입력하면
            <br />
            적정 비용 범위를 안내드립니다
          </p>
        </header>

        <div
          style={{
            backgroundColor: '#eef6f9',
            border: '1px solid #cfe3ea',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            color: mainColor,
            fontSize: '13px',
            lineHeight: '1.6',
            fontWeight: '600',
          }}
        >
          정확한 수치를 몰라도 괜찮습니다.
          <br />
          대략 선택 + 사진만으로도 예상 견적을 안내드립니다.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={cardStyle}>
            <label style={labelStyle}>1. 기본 정보</label>

            <input
              style={inputStyle}
              placeholder="성함"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <input
              style={{ ...inputStyle, marginBottom: '0' }}
              placeholder="연락처"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>2. 거주 형태</label>
            {selectOptions('type', ['빌라/원룸', '오피스텔', '아파트'], 3)}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>3. 원하는 복구 방식</label>
            <p style={guideStyle}>
              경제적 복구는 티가 조금 나더라도 비용을 줄이는 방식입니다.
              완벽 복구는 집주인 확인이나 퇴거 분쟁 가능성을 줄이는 방식입니다.
            </p>

            {selectOptions('repairType', ['경제적', '완벽'], 2)}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>4. 파손 부위와 크기</label>
            <p style={guideStyle}>
              먼저 파손 부위를 선택한 뒤, 각 부위별 크기를 손바닥/A4 기준으로 선택해주세요.
            </p>

            {['벽지', '장판/바닥', '몰딩/문짝'].map((partName) => {
              const selectedPart = formData.parts.find((p) => p.name === partName);

              return (
                <div
                  key={partName}
                  style={{
                    marginBottom: '14px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '14px',
                  }}
                >
                  <div
                    onClick={() => togglePart(partName)}
                    style={{
                      ...btnStyle(!!selectedPart),
                      width: '100%',
                      boxSizing: 'border-box',
                      marginBottom: selectedPart ? '10px' : '0',
                    }}
                  >
                    {partName} {selectedPart ? '✅' : ''}
                  </div>

                  {selectedPart && (
                    <div>
                      <p
                        style={{
                          ...guideStyle,
                          marginBottom: '8px',
                          fontWeight: 'bold',
                        }}
                      >
                        {partName} 파손 크기
                      </p>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '8px',
                        }}
                      >
                        {damageScaleOptions.map((scale) => (
                          <div
                            key={scale}
                            onClick={() => updatePartScale(partName, scale)}
                            style={btnStyle(selectedPart.scale === scale)}
                          >
                            {scale}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>5. 벽면 크기</label>
            <p style={guideStyle}>
              정확히 몰라도 괜찮습니다. 대략적인 느낌으로 선택해주세요.
              가능하다면 줄자나 휴대폰 측정 앱으로 가로/세로를 입력해주세요.
            </p>

            {selectOptions(
              'wallSize',
              [
                '잘 모르겠음',
                '작은 벽면',
                '보통 벽면',
                '큰 벽면',
                '창문 있는 벽',
                '방 한 면 전체',
              ],
              2
            )}

            <div style={{ marginTop: '10px' }}>
              <input
                style={inputStyle}
                placeholder="벽면 가로 cm (선택)"
                value={formData.wallWidth}
                onChange={(e) =>
                  setFormData({ ...formData, wallWidth: e.target.value })
                }
              />

              <input
                style={{ ...inputStyle, marginBottom: '0' }}
                placeholder="벽면 세로 cm (선택)"
                value={formData.wallHeight}
                onChange={(e) =>
                  setFormData({ ...formData, wallHeight: e.target.value })
                }
              />
            </div>
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>6. 파손 위치</label>
            <p style={guideStyle}>
              파손 부위가 어디에 가까운지 선택해주세요. 하단 손상은 부분 보수 가능성 판단에 중요합니다.
            </p>

            {selectOptions(
              'damageLocation',
              ['하단', '중간', '상단', '모서리', '창문 주변', '전체적으로 분산'],
              2
            )}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>7. 정확한 파손 크기 (선택)</label>
            <p style={guideStyle}>
              정확한 크기를 알면 입력해주세요. 모르면 비워두셔도 됩니다.
            </p>

            <input
              style={inputStyle}
              placeholder="파손 가로 cm (선택)"
              value={formData.damageWidth}
              onChange={(e) =>
                setFormData({ ...formData, damageWidth: e.target.value })
              }
            />

            <input
              style={{ ...inputStyle, marginBottom: '0' }}
              placeholder="파손 세로 cm (선택)"
              value={formData.damageHeight}
              onChange={(e) =>
                setFormData({ ...formData, damageHeight: e.target.value })
              }
            />
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>8. 벽지 정보</label>
            <p style={guideStyle}>
              벽지 종류를 몰라도 괜찮습니다. 모르면 ‘모름’을 선택해주세요.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ ...guideStyle, marginBottom: '8px', fontWeight: 'bold' }}>
                벽지 종류
              </p>
              {selectOptions('wallpaperType', ['합지', '실크', '모름'], 3)}
            </div>

            <div>
              <p style={{ ...guideStyle, marginBottom: '8px', fontWeight: 'bold' }}>
                같은 벽지 보유 여부
              </p>
              {selectOptions('wallpaperSame', ['있음', '없음', '모름'], 3)}
            </div>
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>9. 작업 환경</label>
            <p style={guideStyle}>
              가구 이동이 많으면 작업 시간과 비용이 달라질 수 있습니다.
            </p>

            {selectOptions('furnitureMove', ['없음', '일부 있음', '많음', '모름'], 2)}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>10. 퇴거 예정일</label>
            <p style={guideStyle}>
              퇴거일이 가까울수록 가능한 일정과 비용이 달라질 수 있습니다.
            </p>

            <input
              type="date"
              style={{ ...inputStyle, marginBottom: '0' }}
              value={formData.moveDate}
              onChange={(e) => setFormData({ ...formData, moveDate: e.target.value })}
            />
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>11. 상담 방식</label>
            <p style={guideStyle}>
              전화가 부담스러우면 채팅 상담을 선택하세요.
            </p>

            {selectOptions('contactMethod', ['채팅 선호', '전화 가능', '상관 없음'], 3)}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>12. 기존 견적 여부</label>
            <p style={guideStyle}>
              이미 받은 견적이 있다면 입력해주세요.
              적정한 가격인지 판단해드립니다.
            </p>

            {selectOptions('hasEstimate', ['있음', '없음'], 2)}

            {formData.hasEstimate === '있음' && (
              <input
                style={{ ...inputStyle, marginTop: '10px', marginBottom: '0' }}
                placeholder="예: 25만원 / 벽지 20만원 + 장판 15만원"
                value={formData.estimatePrice}
                onChange={(e) =>
                  setFormData({ ...formData, estimatePrice: e.target.value })
                }
              />
            )}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>13. 사진 첨부 (최대 5장)</label>
            <p style={guideStyle}>
              가까운 사진 + 전체 사진을 함께 올려주세요.
              정확도가 크게 올라갑니다.
            </p>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ fontSize: '13px', marginBottom: '10px', width: '100%' }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '5px',
              }}
            >
              {previews.map((src, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1/1',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <img
                    src={src}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="미리보기"
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>14. 추가 설명</label>
            <p style={guideStyle}>
              파손 원인, 집주인 요청사항, 원하는 예산, 이미 들은 견적 내용을 자유롭게 적어주세요.
            </p>

            <textarea
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                height: '110px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="예: 강아지가 벽지 하단을 물어뜯었습니다. 퇴거 전 원상복구만 깔끔하게 하고 싶습니다."
              value={formData.extra}
              onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
            />
          </div>

          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '15px',
              padding: '0 4px',
            }}
          >
            ※ 실제 시공이 아닌 예상 비용 안내입니다.
            <br />
            ※ 과도한 견적 여부를 판단할 수 있습니다.
            <br />
            ※ 기본 정보만으로 초기 상담 없이도 견적 범위를 확인할 수 있습니다.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: isLoading ? '#94a3b8' : mainColor,
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                ></div>
                전송 중...
              </>
            ) : (
              '예상 비용 확인하기'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}