'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { BidRecord, RequestRecord } from '@/lib/petroom-data';

type BidForm = {
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

const emptyBidForm: BidForm = {
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
};

const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export default function ContractorRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [source, setSource] = useState('');
  const [form, setForm] = useState<BidForm>(emptyBidForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const mainColor = '#1a4a5e';
  const highlight = '#16a34a';

  useEffect(() => {
    const loadDetail = async () => {
      const [requestResponse, bidsResponse] = await Promise.all([
        fetch(`/api/requests/${requestId}`, { cache: 'no-store' }),
        fetch(`/api/bids?requestId=${requestId}`, { cache: 'no-store' }),
      ]);
      const requestResult = await requestResponse.json();
      const bidsResult = await bidsResponse.json();

      setRequest(requestResult.request ?? null);
      setSource(requestResult.source ?? '');
      setBids(bidsResult.bids ?? []);
      setIsLoading(false);
    };

    loadDetail().catch(() => {
      setRequest(null);
      setBids([]);
      setIsLoading(false);
    });
  }, [requestId]);

  const summaryItems = useMemo(() => {
    if (!request) {
      return [];
    }

    return [
      ['지역', request.region],
      ['파손 유형', request.damage_type],
      ['파손 범위', request.damage_scope],
      ['공간', request.room_type],
      ['면적', request.area_text],
      ['주거 유형', request.housing_type],
      ['동일 자재', request.material_match],
      ['파손 위치', request.damage_position],
      ['복구 방식', request.repair_intent],
      ['짐 여부', request.furniture_level],
      ['희망 일정', request.schedule],
      ['사진 수', `${request.image_count}장`],
      ['연락 방식', request.contact_preference],
    ].filter(([, value]) => value);
  }, [request]);

  const update = (field: keyof BidForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitBid = async () => {
    if (
      !form.contractorName.trim() ||
      !form.contractorContact.trim() ||
      !form.bidAmount.trim() ||
      !form.workScope.trim()
    ) {
      alert('업체명, 연락처, 견적 금액, 작업 범위는 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const response = await fetch('/api/bids', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        requestId,
      }),
    });
    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '견적 제출 중 문제가 발생했습니다.');
      return;
    }

    setMessage(`견적이 제출되었습니다. 견적 ID: ${result.bidId}`);
    setForm(emptyBidForm);
  };

  const card = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
  };
  const inputStyle = {
    width: '100%',
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #dbe3ea',
    fontSize: '14px',
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: mainColor,
    fontSize: '14px',
    fontWeight: 800,
  };

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', ...card, color: '#64748b' }}>
          요청서를 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', ...card }}>
          <p style={{ margin: '0 0 14px', color: '#64748b' }}>요청서를 찾을 수 없습니다.</p>
          <Link href="/contractor/requests" style={{ color: mainColor, fontWeight: 800 }}>
            요청함으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="PET ROOM"
            style={{ display: 'block', width: '96px', margin: '0 auto 8px' }}
          />
          <p style={{ margin: '0 0 6px', color: highlight, fontSize: '12px', fontWeight: 900 }}>
            업체 입찰 상세
          </p>
          <h1 style={{ margin: 0, color: mainColor, fontSize: '25px', lineHeight: 1.25 }}>
            {request.region} · {request.damage_type}
          </h1>
        </header>

        {source === 'demo' && (
          <section
            style={{
              ...card,
              marginBottom: '14px',
              background: '#fff7ed',
              borderColor: '#fed7aa',
              color: '#9a3412',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            현재는 데모 요청 상세입니다. Google Sheets 읽기 설정을 추가하면 실제 접수 요청으로
            자동 전환됩니다.
          </section>
        )}

        <section style={{ ...card, marginBottom: '14px', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
          <p style={{ margin: '0 0 8px', color: '#166534', fontSize: '13px', fontWeight: 900 }}>
            펫룸 예상 견적 범위
          </p>
          <p style={{ margin: 0, color: highlight, fontSize: '26px', lineHeight: 1.25, fontWeight: 900 }}>
            {formatWon(request.estimated_min)} ~ {formatWon(request.estimated_max)}
          </p>
          <p style={{ margin: '8px 0 0', color: '#166534', fontSize: '12px', fontWeight: 800 }}>
            요청 ID: {request.request_id}
          </p>
        </section>

        <section style={{ ...card, marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 12px', color: mainColor, fontSize: '17px' }}>요청 정보</h2>
          <dl style={{ margin: 0, display: 'grid', gap: '10px' }}>
            {summaryItems.map(([label, value]) => (
              <div
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
                <dt style={{ color: '#64748b' }}>{label}</dt>
                <dd style={{ margin: 0, color: mainColor, fontWeight: 800, textAlign: 'right' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {request.user_memo && (
            <p
              style={{
                margin: '14px 0 0',
                padding: '12px',
                borderRadius: '12px',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              {request.user_memo}
            </p>
          )}
        </section>

        <section style={{ ...card, marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 12px', color: mainColor, fontSize: '17px' }}>도착한 업체 견적</h2>
          {bids.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>아직 제출된 견적이 없습니다.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {bids.map((bid) => (
                <article key={bid.bid_id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <strong style={{ color: mainColor }}>{bid.contractor_name}</strong>
                  <p style={{ margin: '6px 0', color: highlight, fontSize: '18px', fontWeight: 900 }}>
                    {Number(bid.bid_amount).toLocaleString('ko-KR')}원
                  </p>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>{bid.work_scope}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ margin: '0 0 12px', color: mainColor, fontSize: '17px' }}>견적 입찰하기</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>업체명 / 담당자명</label>
              <input style={inputStyle} value={form.contractorName} onChange={(e) => update('contractorName', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>연락처</label>
              <input style={inputStyle} value={form.contractorContact} onChange={(e) => update('contractorContact', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>견적 금액</label>
              <input
                style={inputStyle}
                value={form.bidAmount}
                onChange={(e) => update('bidAmount', e.target.value)}
                inputMode="numeric"
                placeholder="예: 240000"
              />
            </div>
            <div>
              <label style={labelStyle}>작업 범위</label>
              <textarea
                style={{ ...inputStyle, minHeight: '86px', resize: 'vertical' }}
                value={form.workScope}
                onChange={(e) => update('workScope', e.target.value)}
                placeholder="예: 훼손된 벽 하단 부분 도배, 자재 색상 차이 가능성 안내"
              />
            </div>
            <div>
              <label style={labelStyle}>포함 항목</label>
              <textarea
                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                value={form.includedItems}
                onChange={(e) => update('includedItems', e.target.value)}
                placeholder="예: 자재, 기본 시공, 폐기물 정리"
              />
            </div>
            <div>
              <label style={labelStyle}>불포함 / 추가비 조건</label>
              <textarea
                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                value={form.extraCostConditions}
                onChange={(e) => update('extraCostConditions', e.target.value)}
                placeholder="예: 가구 이동, 추가 훼손 발견, 전체 시공 전환 시 비용 변동"
              />
            </div>
            <div>
              <label style={labelStyle}>작업 가능 일정</label>
              <input
                style={inputStyle}
                value={form.availableDate}
                onChange={(e) => update('availableDate', e.target.value)}
                placeholder="예: 5월 12일 오후 가능"
              />
            </div>
            <div>
              <label style={labelStyle}>방문 필요 여부</label>
              <select style={inputStyle} value={form.visitRequired} onChange={(e) => update('visitRequired', e.target.value)}>
                <option value="">선택해주세요</option>
                <option value="사진 견적 가능">사진 견적 가능</option>
                <option value="방문 확인 필요">방문 확인 필요</option>
                <option value="상황에 따라 협의">상황에 따라 협의</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>예상 범위보다 높은 경우 사유</label>
              <textarea
                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                value={form.aboveRangeReason}
                onChange={(e) => update('aboveRangeReason', e.target.value)}
                placeholder="예: 자재 수급 필요, 기존 장판 상태 불량 등"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submitBid}
            disabled={isSubmitting}
            style={{
              width: '100%',
              marginTop: '14px',
              padding: '16px',
              border: 'none',
              borderRadius: '14px',
              background: isSubmitting ? '#94a3b8' : mainColor,
              color: '#fff',
              fontSize: '16px',
              fontWeight: 900,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? '견적 제출 중...' : '이 요청에 견적 제출'}
          </button>

          {message && (
            <p style={{ margin: '12px 0 0', color: '#166534', fontSize: '14px', fontWeight: 800, textAlign: 'center' }}>
              {message}
            </p>
          )}
        </section>

        <Link
          href="/contractor/requests"
          style={{
            display: 'block',
            marginTop: '16px',
            color: mainColor,
            fontSize: '14px',
            fontWeight: 900,
            textAlign: 'center',
          }}
        >
          요청함으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
