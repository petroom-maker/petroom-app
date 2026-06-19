'use client';

import { useEffect, useState } from 'react';
import type { AssignmentRecord, BidRecord, ContractorRecord, RequestRecord } from '@/lib/petroom-data';

type AssignmentWithRequest = AssignmentRecord & {
  request: RequestRecord | null;
};

type Detail = {
  contractor: ContractorRecord;
  assignment: AssignmentRecord;
  request: RequestRecord | null;
  images: Record<string, unknown>[];
  estimates: BidRecord[];
};

const emptyForm = {
  bidAmount: '',
  bidAmountDisplay: '',
  workScope: '',
  includedItems: '',
  excludedItems: '',
  extraCostConditions: '',
  visitRequired: '사진 견적 가능',
  availableDate: '',
  partialRepairAvailable: '',
  estimatedWorkTime: '',
  contractorMemo: '',
};

const getImageUrl = (image: Record<string, unknown>) =>
  String(image.DriveURL || image.drive_url || image['DriveURL'] || image['이미지URL'] || '');

const getImageThumbUrl = (image: Record<string, unknown>) =>
  String(image['썸네일URL'] || image.thumbnail_url || image.thumbnailUrl || getImageUrl(image));

const getImageLabel = (image: Record<string, unknown>) =>
  String(image.image_type || image['이미지구분'] || image.description || '사진');

const imageGroups = ['전체공간', '훼손범위', '근접사진', '추가사진'];

const formatWon = (value: string) => {
  const amount = Number(value.replace(/\D/g, ''));
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString('ko-KR')}원` : value || '-';
};

export default function ContractorPage() {
  const [contractorId, setContractorId] = useState('');
  const [token, setToken] = useState('');
  const [contractor, setContractor] = useState<ContractorRecord | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithRequest[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const assignmentUrl = (path: string) => {
    const url = new URL(path, window.location.origin);
    url.searchParams.set('contractorId', contractorId);
    url.searchParams.set('token', token);
    return url.toString();
  };

  const loadAssignments = async (nextContractorId = contractorId, nextToken = token) => {
    if (!nextContractorId || !nextToken) {
      setIsLoading(false);
      return;
    }
    const url = new URL('/api/contractor/assignments', window.location.origin);
    url.searchParams.set('contractorId', nextContractorId);
    url.searchParams.set('token', nextToken);
    const response = await fetch(url.toString(), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message ?? '배정 목록 조회 실패');
    setContractor(result.contractor ?? null);
    setAssignments(result.assignments ?? []);
  };

  const loadDetail = async (assignmentId: string) => {
    const response = await fetch(assignmentUrl(`/api/contractor/assignments/${assignmentId}`), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message ?? '배정 상세 조회 실패');
    setDetail(result);
    setForm(emptyForm);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextContractorId = params.get('contractorId') ?? '';
    const nextToken = params.get('token') ?? '';
    setContractorId(nextContractorId);
    setToken(nextToken);
    loadAssignments(nextContractorId, nextToken)
      .catch((error) => setMessage(error instanceof Error ? error.message : '업체 화면을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEstimate = async () => {
    if (!detail?.request || !form.bidAmount.trim()) {
      setMessage('견적금액을 입력해주세요.');
      return;
    }

    const response = await fetch('/api/contractor/estimates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        contractorId,
        token,
        requestId: detail.request.request_id,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? '견적 제출에 실패했습니다.');
      return;
    }
    setMessage('견적이 제출되었습니다. 펫룸 검수 후 고객에게 전달됩니다.');
    await Promise.all([loadAssignments(), loadDetail(detail.assignment.assignment_id)]);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto grid max-w-[1120px] gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-extrabold text-accent">새집다오 CONTRACTOR</p>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">업체 요청함</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            배정받은 요청만 표시됩니다. 견적은 제출 후 바로 고객에게 노출되지 않고 펫룸 검수 후 전달됩니다.
          </p>

          {message && <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-accent">{message}</p>}

          {!contractorId || !token ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-5 text-sm leading-relaxed text-slate-500">
              업체 전용 링크로 접속해주세요.
              <br />
              예: /contractor?contractorId=C-001&token=...
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-extrabold text-slate-400">로그인 업체</p>
                <p className="mt-1 text-sm font-extrabold text-navy">
                  {contractor?.contractor_name || contractorId}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {isLoading && <p className="text-sm font-bold text-slate-400">불러오는 중...</p>}
                {!isLoading && assignments.length === 0 && (
                  <p className="rounded-2xl border border-slate-200 p-5 text-sm font-bold text-slate-400">
                    배정된 요청이 없습니다.
                  </p>
                )}
                {assignments.map((assignment) => (
                  <button
                    key={assignment.assignment_id}
                    type="button"
                    onClick={() => loadDetail(assignment.assignment_id).catch(() => setMessage('상세 조회 실패'))}
                    className={`block w-full rounded-2xl border p-4 text-left ${
                      detail?.assignment.assignment_id === assignment.assignment_id
                        ? 'border-accent bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-accent">{assignment.assignment_id}</p>
                    <p className="mt-1 text-sm font-extrabold text-navy">
                      {assignment.request?.region || '-'} · {assignment.request?.damage_type || '-'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      희망 {assignment.request?.schedule || '-'} · {assignment.assignment_status} · 제출 {assignment.estimate_submitted}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {!detail?.request ? (
            <div className="flex min-h-[520px] items-center justify-center text-center">
              <p className="text-sm font-bold text-slate-400">배정된 요청을 선택해주세요.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <header className="border-b border-slate-100 pb-4">
                <p className="text-xs font-extrabold text-accent">{detail.request.request_id}</p>
                <h2 className="mt-1 text-2xl font-extrabold text-navy">
                  {detail.request.region || '-'} · {detail.request.damage_type || '-'}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  고객명과 연락처는 펫룸 검수 전에는 노출하지 않습니다.
                </p>
              </header>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['신청유형', detail.request.damage_scope],
                  ['행정동/지역', detail.request.region],
                  ['손상부위', detail.request.damage_type],
                  ['희망시기', detail.request.schedule],
                  ['주거유형', detail.request.housing_type],
                  ['운영공간유형', detail.request.room_type],
                  ['현재상황', detail.request.damage_scope],
                  ['추가요청사항', detail.request.user_memo],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-extrabold text-slate-400">{label}</p>
                    <p className="mt-1 whitespace-pre-line text-sm font-bold leading-relaxed text-navy">{value || '-'}</p>
                  </div>
                ))}
              </div>

              <section>
                <h3 className="mb-3 text-base font-extrabold text-navy">사진 확인</h3>
                <div className="space-y-4">
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

              {detail.estimates.length > 0 && (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-2 text-base font-extrabold text-navy">제출한 견적</h3>
                  <div className="space-y-2">
                    {detail.estimates.map((estimate) => (
                      <div key={estimate.bid_id} className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
                        {estimate.bid_id} · {formatWon(estimate.bid_amount)} · {estimate.bid_status} · 고객노출 {estimate.customer_visible ? 'Y' : 'N'}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="mb-3 text-base font-extrabold text-navy">견적 제출</h3>
                <div className="grid gap-2">
                  {[
                    ['bidAmount', '견적금액 예: 250000'],
                    ['bidAmountDisplay', '견적금액표시 예: 25만원'],
                    ['workScope', '작업범위'],
                    ['includedItems', '포함항목'],
                    ['excludedItems', '제외항목'],
                    ['extraCostConditions', '추가비용조건'],
                    ['partialRepairAvailable', '부분시공 가능 여부'],
                    ['estimatedWorkTime', '예상 작업 시간'],
                    ['availableDate', '가능일정'],
                    ['contractorMemo', '업체메모'],
                  ].map(([key, placeholder]) => (
                    <input
                      key={key}
                      value={String(form[key as keyof typeof form])}
                      onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      placeholder={placeholder}
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
                    />
                  ))}
                  <select
                    value={form.visitRequired}
                    onChange={(event) => setForm((prev) => ({ ...prev, visitRequired: event.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-navy"
                  >
                    <option>사진 견적 가능</option>
                    <option>방문 확인 필요</option>
                    <option>상황에 따라 협의</option>
                  </select>
                  <button type="button" onClick={submitEstimate} className="rounded-2xl bg-accent px-4 py-3 text-sm font-extrabold text-white">
                    견적 제출하기
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
