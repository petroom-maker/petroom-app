'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type BidForm = {
  requestId: string;
  contractorName: string;
  contractorContact: string;
  bidAmount: string;
  workScope: string;
  includedItems: string;
  excludedItems: string;
  extraCostConditions: string;
  availableDate: string;
  visitRequired: string;
  aboveRangeReason: string;
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
};

function ContractorContent() {
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId') ?? '';
  const min = searchParams.get('min');
  const max = searchParams.get('max');
  const [form, setForm] = useState<BidForm>({
    requestId: initialRequestId,
    contractorName: '',
    contractorContact: '',
    bidAmount: '',
    workScope: '',
    includedItems: '',
    excludedItems: '',
    extraCostConditions: '',
    availableDate: '',
    visitRequired: '',
    aboveRangeReason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const card = {
    background: '#fff',
    padding: '18px',
    borderRadius: '14px',
    marginBottom: '14px',
    border: '1px solid #e5e7eb',
  };
  const label = {
    display: 'block',
    marginBottom: '8px',
    color: '#1a4a5e',
    fontSize: '14px',
    fontWeight: 800,
  };

  const update = (field: keyof BidForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitBid = async () => {
    if (
      !form.requestId.trim() ||
      !form.contractorName.trim() ||
      !form.contractorContact.trim() ||
      !form.bidAmount.trim() ||
      !form.workScope.trim()
    ) {
      alert('요청 ID, 업체명, 연락처, 견적 금액, 작업 범위는 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const response = await fetch('/api/bids', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(form),
    });
    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '견적 제출 중 문제가 발생했습니다.');
      return;
    }

    setMessage(`견적이 제출되었습니다. 견적 ID: ${result.bidId}`);
  };

  return (
    <main style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ display: 'block', width: '96px', margin: '0 auto 8px' }}
          />
          <h1 style={{ margin: 0, color: '#1a4a5e', fontSize: '24px' }}>업체 견적 입력</h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
            유저가 입력한 요청서를 기준으로 실제 가능한 견적을 남겨주세요.
          </p>
        </header>

        {min && max && (
          <section
            style={{
              ...card,
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
              color: '#166534',
              fontWeight: 700,
            }}
          >
            펫룸 예상 범위: {Number(min).toLocaleString('ko-KR')}원 ~{' '}
            {Number(max).toLocaleString('ko-KR')}원
          </section>
        )}

        <section style={card}>
          <label style={label}>요청 ID</label>
          <input
            style={inputStyle}
            value={form.requestId}
            onChange={(e) => update('requestId', e.target.value)}
            placeholder="예: req_xxxxx"
          />
        </section>

        <section style={card}>
          <label style={label}>업체 정보</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            <input
              style={inputStyle}
              value={form.contractorName}
              onChange={(e) => update('contractorName', e.target.value)}
              placeholder="업체명 또는 담당자명"
            />
            <input
              style={inputStyle}
              value={form.contractorContact}
              onChange={(e) => update('contractorContact', e.target.value)}
              placeholder="연락처"
            />
          </div>
        </section>

        <section style={card}>
          <label style={label}>견적 금액</label>
          <input
            style={inputStyle}
            value={form.bidAmount}
            onChange={(e) => update('bidAmount', e.target.value)}
            placeholder="예: 240000"
            inputMode="numeric"
          />
        </section>

        <section style={card}>
          <label style={label}>작업 범위</label>
          <textarea
            style={{ ...inputStyle, minHeight: '84px', resize: 'vertical' }}
            value={form.workScope}
            onChange={(e) => update('workScope', e.target.value)}
            placeholder="예: 훼손된 벽 하단 부분 도배, 색상 차이 가능성 안내"
          />
        </section>

        <section style={card}>
          <label style={label}>포함 / 불포함 / 추가비 조건</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.includedItems}
              onChange={(e) => update('includedItems', e.target.value)}
              placeholder="포함 항목"
            />
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.excludedItems}
              onChange={(e) => update('excludedItems', e.target.value)}
              placeholder="불포함 항목"
            />
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.extraCostConditions}
              onChange={(e) => update('extraCostConditions', e.target.value)}
              placeholder="추가비 발생 가능 조건"
            />
          </div>
        </section>

        <section style={card}>
          <label style={label}>일정 / 방문 여부</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            <input
              style={inputStyle}
              value={form.availableDate}
              onChange={(e) => update('availableDate', e.target.value)}
              placeholder="예: 5월 12일 오후 가능"
            />
            <select
              style={inputStyle}
              value={form.visitRequired}
              onChange={(e) => update('visitRequired', e.target.value)}
            >
              <option value="">방문 필요 여부</option>
              <option value="사진 견적 가능">사진 견적 가능</option>
              <option value="방문 확인 필요">방문 확인 필요</option>
              <option value="상황에 따라 협의">상황에 따라 협의</option>
            </select>
          </div>
        </section>

        <section style={card}>
          <label style={label}>예상 범위보다 높은 경우 사유</label>
          <textarea
            style={{ ...inputStyle, minHeight: '84px', resize: 'vertical' }}
            value={form.aboveRangeReason}
            onChange={(e) => update('aboveRangeReason', e.target.value)}
            placeholder="예: 자재 수급 필요, 전체 시공 필요, 짐 이동 필요 등"
          />
        </section>

        <button
          onClick={submitBid}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            borderRadius: '14px',
            background: isSubmitting ? '#94a3b8' : '#1a4a5e',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? '견적 제출 중...' : '견적 제출하기'}
        </button>

        {message && (
          <p style={{ color: '#166534', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

export default function ContractorPage() {
  return (
    <Suspense fallback={null}>
      <ContractorContent />
    </Suspense>
  );
}
