'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getStatusLabel,
  type AssignmentRecord,
  type BidRecord,
  type ContractorRecord,
  type CustomerActionRecord,
  type RequestRecord,
} from '@/lib/petroom-data';

const statusOptions = [
  ['RECEIVED', '접수완료'],
  ['REVIEWING', '검토중'],
  ['CONTACTING_CONTRACTORS', '업체문의중'],
  ['QUOTE_READY', '견적준비완료'],
  ['RESULT_SENT', '결과안내완료'],
  ['CONNECT_REQUESTED', '업체연결요청'],
  ['COMPLETED', '시공완료'],
  ['CLOSED', '종료'],
];

const emptyEstimate = {
  contractorId: '',
  contractorName: '',
  contractorContact: '',
  platform: '관리자 수기입력',
  bidAmount: '',
  bidAmountDisplay: '',
  workScope: '',
  includedItems: '',
  excludedItems: '',
  extraCostConditions: '',
  visitRequired: '',
  availableDate: '',
  customerDisplayName: '',
  partialRepairAvailable: '',
  estimatedWorkTime: '',
  adminComment: '',
  recommended: false,
  internalMemo: '',
};

type AdminDetail = {
  request: RequestRecord;
  rawRequest: Record<string, unknown>;
  images: Record<string, unknown>[];
  assignments: AssignmentRecord[];
  estimates: BidRecord[];
  customerActions: CustomerActionRecord[];
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const getAmount = (bid: BidRecord) => {
  const amount = Number(String(bid.bid_amount).replace(/\D/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const formatWon = (value: number) => (value > 0 ? `${value.toLocaleString('ko-KR')}원` : '-');

const getImageUrl = (image: Record<string, unknown>) =>
  String(image.DriveURL || image.drive_url || image['DriveURL'] || image['이미지URL'] || '');

const getImageThumbUrl = (image: Record<string, unknown>) =>
  String(image['썸네일URL'] || image.thumbnail_url || image.thumbnailUrl || getImageUrl(image));

const getImageLabel = (image: Record<string, unknown>) =>
  String(image.image_type || image['이미지구분'] || image.description || '사진');

const imageGroups = ['전체공간', '훼손범위', '근접사진', '추가사진'];

const ADMIN_TOKEN_STORAGE_KEY = 'petroom_admin_token';

const readStoredToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage?.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const writeStoredToken = (value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.setItem(ADMIN_TOKEN_STORAGE_KEY, value);
  } catch {
    // Some in-app browsers block sessionStorage. Keep the UI working.
  }
};

const rawValue = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return '';
};

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    const urlToken = new URLSearchParams(window.location.search).get('adminToken') ?? '';
    return urlToken || readStoredToken();
  });
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [contractors, setContractors] = useState<ContractorRecord[]>([]);
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentForm, setAssignmentForm] = useState({ contractorId: '', requestMemo: '' });
  const [estimateForm, setEstimateForm] = useState(emptyEstimate);
  const [isSavingEstimate, setIsSavingEstimate] = useState(false);
  const [togglingBidId, setTogglingBidId] = useState('');

  // 토큰은 URL이 아니라 x-admin-token 헤더로만 전송한다.
  const adminUrl = (path: string) => new URL(path, window.location.origin).toString();

  const headers = useMemo(() => ({ 'x-admin-token': adminToken }), [adminToken]);

  const loadRequests = async (token = adminToken) => {
    const response = await fetch('/api/admin/requests', { cache: 'no-store', headers: { 'x-admin-token': token } });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message ?? '목록 조회 실패');
    setRequests(result.requests ?? []);
  };

  const loadContractors = async (token = adminToken) => {
    const response = await fetch('/api/admin/contractors', { cache: 'no-store', headers: { 'x-admin-token': token } });
    const result = await response.json();
    if (response.ok && result.ok) {
      setContractors(result.contractors ?? []);
    }
  };

  const loadDetail = async (requestId: string) => {
    const response = await fetch(adminUrl(`/api/admin/requests/${encodeURIComponent(requestId)}`), {
      cache: 'no-store',
      headers,
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message ?? '상세 조회 실패');
    setDetail(result);
    setSelectedId(requestId);
    setAssignmentForm({ contractorId: contractors[0]?.contractor_id ?? '', requestMemo: '' });
    setEstimateForm({ ...emptyEstimate, customerDisplayName: `업체 ${(result.estimates?.length ?? 0) + 1}` });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('adminToken') ?? '';
    if (adminToken) writeStoredToken(adminToken);

    // URL에 토큰이 노출되지 않도록 쿼리에서 제거한다.
    if (urlToken) {
      params.delete('adminToken');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', nextUrl);
    }

    Promise.all([loadRequests(adminToken), loadContractors(adminToken)])
      .catch((error) => setMessage(error instanceof Error ? error.message : '관리자 데이터를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = requests.filter((item) => {
    const keywordText = `${item.request_id} ${item.region} ${item.damage_type} ${item.user_name} ${item.user_contact}`;
    return (
      (statusFilter === '전체' || item.status === statusFilter) &&
      (typeFilter === '전체' || item.damage_scope === typeFilter || item.room_type === typeFilter) &&
      (!keyword.trim() || keywordText.includes(keyword.trim()))
    );
  });

  const changeStatus = async (status: string) => {
    if (!detail) return;
    const response = await fetch(adminUrl(`/api/admin/requests/${detail.request.request_id}/status`), {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '상태 변경에 실패했습니다.');
      return;
    }
    setMessage('진행상태를 변경했습니다.');
    await loadRequests();
    await loadDetail(detail.request.request_id);
  };

  const copyText = async (text: string, successMessage: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage('복사하지 못했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const markResultSent = async () => {
    if (!detail) return;
    const now = new Date().toISOString();
    const response = await fetch(adminUrl(`/api/admin/requests/${detail.request.request_id}/status`), {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'RESULT_SENT',
        resultNoticeStatus: '안내완료',
        resultNoticeAt: now,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '안내 완료 처리에 실패했습니다.');
      return;
    }
    setMessage('고객 결과 안내 완료로 처리했습니다.');
    await loadRequests();
    await loadDetail(detail.request.request_id);
  };

  const assignContractor = async () => {
    if (!detail || !assignmentForm.contractorId.trim()) return;
    const response = await fetch(adminUrl('/api/admin/assignments'), {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        requestId: detail.request.request_id,
        contractorId: assignmentForm.contractorId,
        requestMemo: assignmentForm.requestMemo,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '업체 배정에 실패했습니다.');
      return;
    }
    setMessage(`업체 배정 완료: ${result.assignmentId}`);
    await loadDetail(detail.request.request_id);
  };

  const submitManualEstimate = async () => {
    if (isSavingEstimate) return;
    if (!detail || !estimateForm.bidAmount.trim()) {
      setMessage('견적금액을 입력해주세요.');
      return;
    }
    setIsSavingEstimate(true);
    setMessage('견적을 저장하는 중입니다...');
    try {
      const response = await fetch(adminUrl('/api/admin/estimates'), {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ ...estimateForm, requestId: detail.request.request_id }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(result.message ?? '견적 저장에 실패했습니다.');
        return;
      }
      setMessage('견적을 검수대기로 저장했습니다.');
      await loadDetail(detail.request.request_id);
    } catch {
      setMessage('견적 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingEstimate(false);
    }
  };

  const toggleVisible = async (bid: BidRecord, index: number) => {
    if (togglingBidId) return;
    setTogglingBidId(bid.bid_id);
    const nextVisible = bid.customer_visible ? 'N' : 'Y';
    setMessage(nextVisible === 'Y' ? '고객 노출을 승인하는 중입니다...' : '고객 노출을 해제하는 중입니다...');
    try {
      const response = await fetch(adminUrl(`/api/admin/estimates/${encodeURIComponent(bid.bid_id)}`), {
        method: 'PATCH',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({
          customerVisible: nextVisible,
          bidStatus: nextVisible === 'Y' ? '고객노출승인' : '검수대기',
          customerDisplayName: bid.customer_display_name || `업체 ${String.fromCharCode(65 + index)}`,
          requestId: detail?.request.request_id,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(result.message ?? '노출 상태 변경에 실패했습니다.');
        return;
      }
      setMessage(nextVisible === 'Y' ? '고객 노출을 승인했습니다.' : '고객 노출을 해제했습니다.');
      if (detail) await loadDetail(detail.request.request_id);
    } catch {
      setMessage('노출 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setTogglingBidId('');
    }
  };

  const updateEstimateCustomerInfo = async (bid: BidRecord, changes: Record<string, unknown>) => {
    if (!detail) return;
    const response = await fetch(adminUrl(`/api/admin/estimates/${encodeURIComponent(bid.bid_id)}`), {
      method: 'PATCH',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ ...changes, requestId: detail.request.request_id }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '견적 정보를 수정하지 못했습니다.');
      return;
    }
    setMessage('고객 노출 정보를 수정했습니다.');
    await loadDetail(detail.request.request_id);
  };

  const customerResultUrl = detail
    ? rawValue(detail.rawRequest, 'customer_result_url', '고객결과URL')
    : '';
  const approvedEstimateCount = detail?.estimates.filter((bid) => bid.customer_visible).length ?? 0;
  const resultLinkActive = Boolean(customerResultUrl && approvedEstimateCount > 0);
  const customerNoticeMessage = resultLinkActive
    ? `안녕하세요, 새집다오입니다. 요청주신 원상복구 견적 결과가 준비되었습니다. 아래 링크에서 확인하실 수 있습니다.\n\n${customerResultUrl}\n\n확인 후 원하는 업체로 연결 요청을 눌러주세요.`
    : '';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="mb-4">
            <p className="text-xs font-extrabold text-accent">PET ROOM ADMIN</p>
            <h1 className="mt-1 text-2xl font-extrabold text-navy">신청 관리</h1>
            <p className="mt-1 text-sm text-slate-500">관리자 검수 후 승인한 견적만 고객에게 노출됩니다.</p>
          </header>

          <div className="grid gap-2">
            <input
              value={adminToken}
              onChange={(event) => {
                setAdminToken(event.target.value);
                writeStoredToken(event.target.value);
              }}
              placeholder="관리자 토큰"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-navy outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
              >
                <option>전체</option>
                {statusOptions.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="지역/고객/ID 검색"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-navy outline-none"
              />
            </div>
          </div>

          {message && <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-accent">{message}</p>}

          <div className="mt-5 space-y-3">
            {isLoading && <p className="text-sm font-bold text-slate-400">불러오는 중...</p>}
            {!isLoading &&
              filteredRequests.map((item) => (
                <button
                  key={item.request_id}
                  type="button"
                  onClick={() => loadDetail(item.request_id).catch(() => setMessage('상세 조회에 실패했습니다.'))}
                  className={`block w-full rounded-2xl border p-4 text-left ${
                    selectedId === item.request_id ? 'border-accent bg-blue-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-accent">{item.request_id}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-navy">{item.region || '-'} · {item.damage_type || '-'}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {item.user_name || '고객명 없음'} · {item.user_contact || '연락처 없음'} · {formatDate(item.created_at)}
                  </p>
                </button>
              ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {!detail ? (
            <div className="flex min-h-[520px] items-center justify-center text-center">
              <p className="text-sm font-bold text-slate-400">왼쪽에서 신청건을 선택해주세요.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-extrabold text-accent">{detail.request.request_id}</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-navy">
                    {detail.request.region || '-'} · {detail.request.damage_type || '-'}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {detail.request.user_name || '고객명 없음'} · {detail.request.user_contact || '연락처 없음'}
                  </p>
                </div>
                <select
                  value={detail.request.status}
                  onChange={(event) => changeStatus(event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-navy"
                >
                  {statusOptions.map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </header>

              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-accent">고객 결과 링크</p>
                    <p className="mt-1 break-all text-sm font-bold text-navy">
                      {customerResultUrl || '기존 신청건에는 고객 결과 링크가 없습니다.'}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      승인 견적 {approvedEstimateCount}건 · 링크 {resultLinkActive ? '사용 가능' : '대기 중'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    resultLinkActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {resultLinkActive ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    disabled={!resultLinkActive}
                    onClick={() => copyText(customerResultUrl, '고객 결과 링크를 복사했습니다.')}
                    className="rounded-xl bg-accent px-3 py-3 text-xs font-extrabold text-white disabled:bg-slate-300"
                  >
                    결과 링크 복사
                  </button>
                  <button
                    type="button"
                    disabled={!resultLinkActive}
                    onClick={() => window.open(customerResultUrl, '_blank', 'noopener,noreferrer')}
                    className="rounded-xl border border-accent bg-white px-3 py-3 text-xs font-extrabold text-accent disabled:border-slate-200 disabled:text-slate-300"
                  >
                    결과 미리보기
                  </button>
                  <button
                    type="button"
                    disabled={!resultLinkActive}
                    onClick={() => copyText(customerNoticeMessage, '고객 안내 메시지를 복사했습니다.')}
                    className="rounded-xl bg-navy px-3 py-3 text-xs font-extrabold text-white disabled:bg-slate-300"
                  >
                    안내 메시지 복사
                  </button>
                  <button
                    type="button"
                    disabled={!resultLinkActive}
                    onClick={markResultSent}
                    className="rounded-xl bg-emerald-600 px-3 py-3 text-xs font-extrabold text-white disabled:bg-slate-300"
                  >
                    안내 완료 처리
                  </button>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">
                  결과 안내 상태: {rawValue(detail.rawRequest, 'result_notice_status', '결과안내상태') || '미안내'}
                  {rawValue(detail.rawRequest, 'result_notice_at', '결과안내일시')
                    ? ` · ${rawValue(detail.rawRequest, 'result_notice_at', '결과안내일시')}`
                    : ''}
                </p>
              </section>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['고객명/업체명', detail.request.user_name],
                  ['휴대폰 번호', detail.request.user_contact],
                  ['이메일', rawValue(detail.rawRequest, 'customer_email', '이메일')],
                  ['결과 안내 동의', rawValue(detail.rawRequest, 'consent_result_notice', '결과안내수신동의')],
                  ['카카오 안내 가능', rawValue(detail.rawRequest, 'kakao_notice_available', '카카오안내가능여부')],
                  ['신청유형', detail.request.damage_scope],
                  ['행정동', String(detail.rawRequest.admin_dong || detail.rawRequest['행정동'] || '')],
                  ['주거유형', detail.request.housing_type],
                  ['운영공간유형', detail.request.room_type],
                  ['현재상황/희망예산', detail.request.damage_scope],
                  ['희망시기', detail.request.schedule],
                  ['희망날짜', String(detail.rawRequest.schedule_date || detail.rawRequest['희망날짜'] || '')],
                  ['추가요청사항', detail.request.user_memo],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-extrabold text-slate-400">{label}</p>
                    <p className="mt-1 whitespace-pre-line text-sm font-bold leading-relaxed text-navy">{value || '-'}</p>
                  </div>
                ))}
              </div>

              <section>
                <h3 className="mb-3 text-base font-extrabold text-navy">사진</h3>
                <div className="space-y-4">
                  {detail.images.length === 0 && <p className="text-sm font-bold text-slate-400">저장된 사진이 없습니다.</p>}
                  {imageGroups.map((group) => {
                    const groupImages = detail.images.filter((image) => getImageLabel(image) === group);

                    if (groupImages.length === 0) {
                      return null;
                    }

                    return (
                      <div key={group} className="rounded-2xl bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-extrabold text-navy">{group}</p>
                          <p className="text-xs font-extrabold text-slate-400">{groupImages.length}장</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                          {groupImages.map((image, index) => {
                            const url = getImageUrl(image);
                            const thumbUrl = getImageThumbUrl(image);
                            return (
                              <a
                                key={`${url}-${index}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                              >
                                <img src={thumbUrl} alt={`${group} ${index + 1}`} className="h-28 w-full object-cover" />
                                <p className="truncate px-2 py-1.5 text-[11px] font-bold text-slate-500">{index + 1}번 사진</p>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-base font-extrabold text-navy">업체 배정</h3>
                  <div className="grid gap-2">
                    <select
                      value={assignmentForm.contractorId}
                      onChange={(event) => setAssignmentForm((prev) => ({ ...prev, contractorId: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
                    >
                      <option value="">업체 선택</option>
                      {contractors.map((contractor) => (
                        <option key={contractor.contractor_id} value={contractor.contractor_id}>
                          {contractor.contractor_id} · {contractor.contractor_name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={assignmentForm.contractorId}
                      onChange={(event) => setAssignmentForm((prev) => ({ ...prev, contractorId: event.target.value }))}
                      placeholder="업체ID 직접 입력"
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
                    />
                    <textarea
                      value={assignmentForm.requestMemo}
                      onChange={(event) => setAssignmentForm((prev) => ({ ...prev, requestMemo: event.target.value }))}
                      placeholder="업체에 전달할 견적 요청 메모"
                      className="min-h-24 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
                    />
                    <button type="button" onClick={assignContractor} className="rounded-2xl bg-navy px-4 py-3 text-sm font-extrabold text-white">
                      업체 배정하기
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {detail.assignments.map((assignment) => (
                      <div key={assignment.assignment_id} className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                        {assignment.assignment_id} · {assignment.contractor_id} · {assignment.assignment_status} · 견적제출 {assignment.estimate_submitted}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-base font-extrabold text-navy">견적 수기 입력</h3>
                  <div className="grid gap-2">
                    {[
                      ['contractorId', '업체ID'],
                      ['contractorName', '업체명'],
                      ['contractorContact', '업체연락처'],
                      ['bidAmount', '견적금액 예: 250000'],
                      ['customerDisplayName', '고객노출명 예: 업체 A'],
                      ['workScope', '작업범위'],
                      ['includedItems', '포함항목'],
                      ['excludedItems', '제외항목'],
                      ['extraCostConditions', '추가비용조건'],
                      ['visitRequired', '방문 필요 여부'],
                      ['partialRepairAvailable', '부분시공 가능 여부'],
                      ['estimatedWorkTime', '예상 작업 시간'],
                      ['availableDate', '가능일정'],
                      ['adminComment', '고객에게 보여줄 관리자 코멘트'],
                    ].map(([key, placeholder]) => (
                      <input
                        key={key}
                        value={String(estimateForm[key as keyof typeof estimateForm])}
                        onChange={(event) => setEstimateForm((prev) => ({ ...prev, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
                      />
                    ))}
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy">
                      <input
                        type="checkbox"
                        checked={estimateForm.recommended}
                        onChange={(event) => setEstimateForm((prev) => ({ ...prev, recommended: event.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      고객 추천 견적으로 표시
                    </label>
                    <button
                      type="button"
                      onClick={submitManualEstimate}
                      disabled={isSavingEstimate}
                      className="rounded-2xl bg-accent px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSavingEstimate ? '저장 중...' : '검수대기 견적 저장'}
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-base font-extrabold text-navy">견적 검수 / 고객 노출</h3>
                <div className="space-y-3">
                  {detail.estimates.map((bid, index) => (
                    <article key={bid.bid_id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-slate-400">
                            {bid.bid_id} · 실제업체 {bid.contractor_name || '-'} · 고객노출명 {bid.customer_display_name || `업체 ${String.fromCharCode(65 + index)}`}
                          </p>
                          <h4 className="mt-1 text-lg font-extrabold text-navy">{formatWon(getAmount(bid))}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleVisible(bid, index)}
                          disabled={togglingBidId === bid.bid_id}
                          className={`rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                            bid.customer_visible ? 'bg-slate-500' : 'bg-emerald-600'
                          }`}
                        >
                          {togglingBidId === bid.bid_id
                            ? '처리 중...'
                            : bid.customer_visible
                              ? '고객노출 해제'
                              : '고객노출 승인'}
                        </button>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <p className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">상태: {bid.bid_status || '-'}</p>
                        <p className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">노출: {bid.customer_visible ? 'Y' : 'N'}</p>
                        <p className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">범위: {bid.work_scope || '-'}</p>
                        <p className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">일정: {bid.available_date || '-'}</p>
                        <p className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">부분시공: {bid.partial_repair_available || '-'}</p>
                        <p className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">작업시간: {bid.estimated_work_time || '-'}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateEstimateCustomerInfo(bid, { recommended: !bid.recommended })}
                          className={`rounded-xl px-3 py-2 text-xs font-extrabold ${
                            bid.recommended ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {bid.recommended ? '추천 견적' : '추천 설정'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const comment = window.prompt('고객에게 보여줄 코멘트를 입력해주세요.', bid.admin_comment || '');
                            if (comment !== null) {
                              updateEstimateCustomerInfo(bid, { adminComment: comment });
                            }
                          }}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-600"
                        >
                          고객 코멘트 입력
                        </button>
                      </div>
                      <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-extrabold text-accent">고객 카드 미리보기</p>
                        <p className="mt-1 text-base font-extrabold text-navy">{bid.customer_display_name || `업체 ${String.fromCharCode(65 + index)}`}</p>
                        <p className="mt-1 text-sm font-bold text-navy">사진 기준 1차 견적: {formatWon(getAmount(bid))}</p>
                        <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                          사진 기준 1차 견적이며, 최종 금액은 상담 및 현장 조건에 따라 달라질 수 있습니다.
                        </p>
                        {bid.admin_comment && (
                          <p className="mt-2 text-xs font-bold leading-relaxed text-accent">새집다오 코멘트: {bid.admin_comment}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-navy">고객 선택 결과</h3>
                  <span className="text-xs font-extrabold text-slate-400">{detail.customerActions.length}건</span>
                </div>
                {detail.customerActions.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">아직 고객 선택이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.customerActions.map((action) => (
                      <div key={action.action_id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-navy">{action.action_label || action.action_type}</p>
                          <span className="text-xs font-bold text-slate-400">{formatDate(action.created_at)}</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {action.action_id}
                          {action.selected_quote_id ? ` · 선택 견적 ${action.selected_quote_id}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
