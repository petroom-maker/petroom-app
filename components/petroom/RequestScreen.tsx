'use client';

import { useEffect, useMemo, useState } from 'react';
import { LineIcon } from './icons';
import type { AppScreen, RequestTarget } from './types';

type StepKind = 'choice' | 'multi' | 'photos' | 'region' | 'textarea' | 'contact' | 'complete';

type RequestStep = {
  title: string;
  description?: string;
  kind: StepKind;
  field?: string;
  options?: string[];
  directOption?: string;
  directField?: string;
  directLabel?: string;
  directPlaceholder?: string;
  dateOption?: string;
  dateField?: string;
  placeholder?: string;
  completeTitle?: string;
  completeMessage?: string;
};

type FormState = Record<string, string | string[]>;
type PhotoUpload = {
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  resizeStatus: 'resized' | 'original';
};
type PhotoState = Record<string, PhotoUpload[]>;

const MAX_UPLOAD_IMAGE_SIZE = 1600;
const UPLOAD_IMAGE_QUALITY = 0.78;
const TOTAL_PHOTO_LIMIT = 30;
const photoLimits: Record<string, { min: number; max: number }> = {
  fullSpace: { min: 1, max: 10 },
  damageRange: { min: 1, max: 15 },
  closeUp: { min: 1, max: 15 },
  additional: { min: 0, max: 10 },
};
const supportedImageTypes = ['image/heic', 'image/heif', 'image/jpeg', 'image/png', 'image/webp'];
const uploadPhotoErrorMessage = '일부 사진을 처리하지 못했습니다. 아이폰 원본 사진인 경우 스크린샷 또는 JPG로 다시 선택해주세요.';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const targetCards: {
  target: RequestTarget;
  title: string;
  description: string;
}[] = [
  {
    target: 'home',
    title: '일반 가정',
    description: '원룸·아파트·오피스텔 등 일상적인 주거공간의 손상',
  },
  {
    target: 'business',
    title: '운영 공간',
    description: '애견유치원·미용실·카페처럼 반려동물 관련 서비스를 운영하는 공간의 손상',
  },
];

const homeSteps: RequestStep[] = [
  {
    title: '주거유형을 선택해주세요.',
    kind: 'choice',
    field: 'housingType',
    options: ['아파트', '빌라/다세대', '오피스텔', '단독주택', '직접입력'],
    directOption: '직접입력',
    directField: 'housingTypeOther',
    directLabel: '주거유형을 입력해주세요.',
  },
  {
    title: '현재 상황을 선택해주세요.',
    kind: 'choice',
    field: 'situation',
    options: ['이사 전 원상복구가 필요해요', '집주인이 수리를 요청했어요', '생활 중 수리가 필요해요', '직접 입력할게요'],
    directOption: '직접 입력할게요',
    directField: 'situationOther',
    directLabel: '현재 상황을 입력해주세요.',
  },
  {
    title: '손상된 부위를 선택해주세요.',
    description: '정확한 명칭을 몰라도 괜찮아요. 여러 곳이 함께 손상됐다면 복수 선택해주세요.',
    kind: 'multi',
    field: 'damageParts',
    options: ['벽지', '장판/바닥', '문 또는 문틀', '벽·천장 테두리(몰딩)', '벽 아래 테두리(걸레받이)', '잘 모르겠어요', '직접입력'],
    directOption: '직접입력',
    directField: 'damagePartsOther',
    directLabel: '손상된 부위를 입력해주세요.',
  },
  {
    title: '견적 산출을 위해 사진 3가지를 올려주세요.',
    description:
      '정확한 견적을 위해 아래 3가지 사진은 필수입니다. 사진이 부족하면 부분수리가 가능한지, 전체교체가 필요한지, 실제 시공 범위를 판단하기 어렵습니다.',
    kind: 'photos',
  },
  {
    title: '시공이 필요한 지역을 선택해주세요.',
    description: '현재는 서울·경기 지역만 요청 가능합니다. 견적 확인과 시공 가능한 업체 연결을 위해 필요합니다.',
    kind: 'region',
  },
  {
    title: '언제쯤 시공이 필요하신가요?',
    kind: 'choice',
    field: 'schedule',
    options: ['3일 이내', '1주 이내', '한 달 이내', '특정 날짜 선택', '협의 가능'],
    dateOption: '특정 날짜 선택',
    dateField: 'scheduleDate',
  },
  {
    title: '시공 전에 전달할 내용이 있나요?',
    description:
      '이사일, 집주인 요청사항, 시공 가능 시간, 원하는 복구 방식 등 견적과 시공에 참고할 내용을 적어주세요. 자세히 적어주실수록 견적 정리와 시공 상담이 더 정확해집니다.',
    kind: 'textarea',
    field: 'memo',
    placeholder:
      '예: 이사일이 6월 30일입니다. 집주인이 벽 한 면 전체 교체를 요구했습니다.\n예: 강아지가 벽지와 장판을 여러 군데 훼손했습니다.',
  },
  {
    title: '견적 결과를 받을 연락처를 알려주세요.',
    description: '관리자 검토가 끝나면 입력한 연락처로 고객 전용 결과 링크를 안내드립니다.',
    kind: 'contact',
  },
  {
    title: '요청 완료',
    kind: 'complete',
    completeTitle: '원상복구 견적 요청이 접수되었습니다.',
    completeMessage: '새집다오가 시공 범위와 견적 기준을 정리한 뒤, 실제 시공 가능한 업체 연결까지 도와드릴게요.',
  },
];

const businessSteps: RequestStep[] = [
  {
    title: '운영 중인 공간 유형을 선택해주세요.',
    kind: 'choice',
    field: 'businessType',
    options: ['애견유치원', '애견미용실', '애견카페', '호텔·돌봄', '동물병원', '펫샵', '훈련소', '직접입력'],
    directOption: '직접입력',
    directField: 'businessTypeOther',
    directLabel: '운영 중인 공간 유형을 입력해주세요.',
    directPlaceholder: '예: 반려견 운동장, 반려동물 복합문화공간',
  },
  {
    title: '손상된 부위를 선택해주세요.',
    description: '정확한 명칭을 몰라도 괜찮아요. 여러 곳이 함께 손상됐다면 복수 선택해주세요.',
    kind: 'multi',
    field: 'damageParts',
    options: [
      '벽지',
      '장판/바닥',
      '문 또는 문틀',
      '벽·천장 테두리(몰딩)',
      '벽 아래 테두리(걸레받이)',
      '펜스/가벽',
      '잘 모르겠어요',
      '직접입력',
    ],
    directOption: '직접입력',
    directField: 'damagePartsOther',
    directLabel: '손상된 부위를 입력해주세요.',
  },
  {
    title: '견적 산출을 위해 사진 3가지를 올려주세요.',
    description:
      '정확한 견적을 위해 아래 3가지 사진은 필수입니다. 사진이 부족하면 부분수리가 가능한지, 전체교체가 필요한지, 실제 시공 범위를 판단하기 어렵습니다.',
    kind: 'photos',
  },
  {
    title: '생각하고 계신 원상복구 예산이 있나요?',
    description: '예산 범위를 알려주시면 해당 금액 안에서 가능한 복구 범위와 시공 방식을 함께 검토해드립니다.',
    kind: 'choice',
    field: 'budget',
    options: ['30만원 이하', '30~50만원', '50~100만원', '100만원 이상', '아직 정하지 않았어요', '직접입력'],
    directOption: '직접입력',
    directField: 'budgetOther',
    directLabel: '생각하고 계신 예산을 입력해주세요.',
    directPlaceholder: '예: 70만원 이하로 가능하면 좋겠습니다.',
  },
  {
    title: '시공이 필요한 지역을 선택해주세요.',
    description: '현재는 서울·경기 지역만 요청 가능합니다. 견적 확인과 시공 가능한 업체 연결을 위해 필요합니다.',
    kind: 'region',
  },
  {
    title: '시공 가능한 시간대를 선택해주세요.',
    description: '영업에 지장이 적은 시간대를 기준으로 시공 가능 여부를 확인합니다.',
    kind: 'choice',
    field: 'workWindow',
    options: ['영업 전', '영업 후', '휴무일', '영업 중 일부 공간만 가능', '협의 필요', '직접입력'],
    directOption: '직접입력',
    directField: 'workWindowOther',
    directLabel: '시공 가능한 시간대를 입력해주세요.',
    directPlaceholder: '예: 매주 월요일 휴무일에 시공 가능합니다.',
  },
  {
    title: '언제쯤 시공이 필요하신가요?',
    kind: 'choice',
    field: 'schedule',
    options: ['3일 이내', '1주 이내', '한 달 이내', '특정 날짜 선택', '협의 가능'],
    dateOption: '특정 날짜 선택',
    dateField: 'scheduleDate',
  },
  {
    title: '시공 전에 전달할 내용이 있나요?',
    description:
      '손님에게 잘 보이는 위치인지, 우선적으로 복구하고 싶은 범위가 있는지, 전체 공사가 필요한지 부분 보수를 원하는지 등 견적과 시공 방식에 참고할 내용을 적어주세요. 자세히 적어주실수록 견적 정리와 시공 상담이 더 정확해집니다.',
    kind: 'textarea',
    field: 'memo',
    placeholder:
      '예: 손님이 보는 공간이라 눈에 띄는 부분부터 먼저 복구하고 싶습니다.\n예: 전체 공사보다 운영에 지장 없는 부분 보수를 우선으로 보고 싶습니다.\n예: 문 주변과 벽 아래쪽 손상 부위만 먼저 견적을 받고 싶습니다.',
  },
  {
    title: '견적 결과를 받을 연락처를 알려주세요.',
    description: '관리자 검토가 끝나면 입력한 연락처로 고객 전용 결과 링크를 안내드립니다.',
    kind: 'contact',
  },
  {
    title: '요청 완료',
    kind: 'complete',
    completeTitle: '운영 공간 원상복구 견적 요청이 접수되었습니다.',
    completeMessage: '새집다오가 시공 범위, 견적 기준, 영업에 맞는 시공 가능성을 정리한 뒤 업체 연결까지 도와드릴게요.',
  },
];

const regionOptions = [
  { area: '서울 강남구', dongs: ['역삼동', '논현동', '청담동', '삼성동', '대치동'] },
  { area: '서울 서초구', dongs: ['방배동', '서초동', '반포동', '양재동', '잠원동'] },
  { area: '서울 송파구', dongs: ['잠실동', '문정동', '방이동', '석촌동', '가락동'] },
  { area: '서울 마포구', dongs: ['상암동', '합정동', '망원동', '공덕동', '연남동'] },
  { area: '서울 용산구', dongs: ['한남동', '이태원동', '후암동', '문배동', '원효로동'] },
  { area: '서울 강서구', dongs: ['화곡동', '마곡동', '등촌동', '가양동', '방화동'] },
  { area: '경기 성남시 분당구', dongs: ['수내1동', '정자동', '서현동', '야탑동', '판교동'] },
  { area: '경기 성남시 수정구', dongs: ['태평동', '신흥동', '수진동', '위례동', '복정동'] },
  { area: '경기 광주시', dongs: ['오포읍', '초월읍', '곤지암읍', '경안동', '송정동'] },
  { area: '경기 용인시 수지구', dongs: ['풍덕천동', '죽전동', '동천동', '상현동', '성복동'] },
  { area: '경기 수원시 영통구', dongs: ['영통동', '망포동', '광교동', '매탄동', '원천동'] },
  { area: '경기 고양시 일산동구', dongs: ['장항동', '마두동', '백석동', '식사동', '풍산동'] },
  { area: '경기 하남시', dongs: ['미사동', '풍산동', '덕풍동', '신장동', '감일동'] },
  { area: '경기 안양시 동안구', dongs: ['평촌동', '호계동', '비산동', '관양동', '부림동'] },
];

const requiredPhotoItems = [
  {
    key: 'fullSpace',
    title: '필수 1. 시공 대상 공간 전체 사진',
    homeDescription:
      '훼손된 부위가 있는 공간 전체가 보이게 찍어주세요. 예를 들어 안방 벽지가 손상됐다면 안방 전체가 보이게, 원룸 벽지와 장판이 손상됐다면 원룸 공간 전체가 보이게 찍어주세요. 시공 범위와 공간 크기를 확인하기 위해 필요합니다.',
    businessDescription:
      '훼손된 부위가 있는 공간 전체가 보이게 찍어주세요. 예를 들어 미용실 입구 쪽 문틀이 손상됐다면 입구 공간 전체가 보이게, 애견유치원 장판이 손상됐다면 해당 활동 공간 전체가 보이게 찍어주세요. 시공 범위와 공간 크기를 확인하기 위해 필요합니다.',
  },
  {
    key: 'damageRange',
    title: '필수 2. 훼손 범위 사진',
    homeDescription:
      '전체 공간 안에서 훼손된 부위가 어느 정도 크기인지 보이게 찍어주세요. 부분수리가 가능한지, 전체교체가 필요한지 판단하는 핵심 사진입니다.',
    businessDescription:
      '전체 공간 안에서 훼손된 부위가 어느 정도 크기인지 보이게 찍어주세요. 부분수리가 가능한지, 전체교체가 필요한지 판단하는 핵심 사진입니다.',
  },
  {
    key: 'closeUp',
    title: '필수 3. 훼손 부위 근접 사진',
    homeDescription: '뜯김, 긁힘, 찍힘, 오염 상태가 잘 보이게 가까이 찍어주세요. 자재 확인과 손상 상태 확인을 위해 필요합니다.',
    businessDescription: '뜯김, 긁힘, 찍힘, 파손 상태가 잘 보이게 가까이 찍어주세요. 자재 확인과 손상 상태 확인을 위해 필요합니다.',
  },
];

const optionalPhotoItem = {
  key: 'additional',
  title: '선택. 추가 사진',
  description: '다른 각도나 함께 손상된 부분이 있다면 추가로 올려주세요.',
};

const getString = (form: FormState, key: string) => {
  const value = form[key];
  return typeof value === 'string' ? value : '';
};

const hasText = (form: FormState, key?: string) => Boolean(key && getString(form, key).trim());
const normalizeDateValue = (value: string) => {
  const trimmed = value.trim();
  return datePattern.test(trimmed) ? trimmed : '';
};

const getFileType = (file: File) => {
  const type = file.type.toLowerCase();

  if (type) {
    return type;
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    heic: 'image/heic',
    heif: 'image/heif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  return map[extension] ?? 'application/octet-stream';
};

const logPhotoProcessing = (stage: string, file: File, extra: Record<string, unknown> = {}) => {
  console.info('[PETROOM_PHOTO]', {
    stage,
    fileName: file.name,
    fileType: file.type || '(empty)',
    inferredType: getFileType(file),
    fileSize: file.size,
    ...extra,
  });
};

const readFileAsRawDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      logPhotoProcessing('dataURL-success', file, { dataUrlLength: result.length });
      resolve(result);
    };
    reader.onerror = () => {
      logPhotoProcessing('dataURL-failed', file, { error: reader.error?.message ?? 'unknown' });
      reject(new Error(uploadPhotoErrorMessage));
    };
    reader.readAsDataURL(file);
  });

const readFileAsDataUrl = async (file: File): Promise<Pick<PhotoUpload, 'dataUrl' | 'resizeStatus'>> => {
  logPhotoProcessing('selected', file, { supported: supportedImageTypes.includes(getFileType(file)) });
  const fileType = getFileType(file);

  if (!supportedImageTypes.includes(fileType)) {
    const rawDataUrl = await readFileAsRawDataUrl(file);
    logPhotoProcessing('resize-skipped-unsupported-type', file);
    return { dataUrl: rawDataUrl, resizeStatus: 'original' };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const timer = window.setTimeout(() => reject(new Error('이미지 디코딩 시간 초과')), 8000);
      const settle = (callback: () => void) => {
        window.clearTimeout(timer);
        callback();
      };
      img.onload = () => settle(() => resolve(img));
      img.onerror = () => settle(() => reject(new Error('이미지 디코딩 실패')));
      try {
        img.src = objectUrl;
      } catch (error) {
        settle(() => reject(error));
      }
    });
    const scale = Math.min(1, MAX_UPLOAD_IMAGE_SIZE / image.width, MAX_UPLOAD_IMAGE_SIZE / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      logPhotoProcessing('resize-skipped-no-context', file);
      const rawDataUrl = await readFileAsRawDataUrl(file);
      return { dataUrl: rawDataUrl, resizeStatus: 'original' };
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const resizedDataUrl = canvas.toDataURL('image/jpeg', UPLOAD_IMAGE_QUALITY);
    logPhotoProcessing('resize-success', file, {
      sourceWidth: image.width,
      sourceHeight: image.height,
      width,
      height,
      dataUrlLength: resizedDataUrl.length,
    });
    return { dataUrl: resizedDataUrl, resizeStatus: 'resized' };
  } catch (error) {
    logPhotoProcessing('resize-failed-fallback-original', file, {
      error: error instanceof Error ? error.message : String(error),
    });
    const rawDataUrl = await readFileAsRawDataUrl(file);
    return { dataUrl: rawDataUrl, resizeStatus: 'original' };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const saveRecentRequestId = (requestId: string) => {
  if (typeof window === 'undefined' || !requestId) {
    return;
  }

  try {
    const key = 'petroom_recent_request_ids';
    const current = JSON.parse(window.localStorage.getItem(key) || '[]');
    const ids = Array.isArray(current) ? current.filter((id): id is string => typeof id === 'string') : [];
    window.localStorage.setItem(key, JSON.stringify([requestId, ...ids.filter((id) => id !== requestId)].slice(0, 10)));
  } catch {
    // localStorage가 막힌 환경에서는 신청 완료 흐름을 우선 유지합니다.
  }
};

const saveRecentRequestAccess = (requestId: string, customerToken: string) => {
  if (typeof window === 'undefined' || !requestId || !customerToken) {
    return;
  }

  try {
    const key = 'petroom_request_tokens';
    const current = JSON.parse(window.localStorage.getItem(key) || '{}');
    const tokens = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
    window.localStorage.setItem(key, JSON.stringify({ ...tokens, [requestId]: customerToken }));
  } catch {
    // 결과 링크가 별도로 전달되므로 localStorage 실패가 신청 제출을 막지 않습니다.
  }
};

const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 11);
const isValidPhone = (value: string) => /^01[016789]\d{7,8}$/.test(normalizePhone(value));
const formatPhone = (value: string) => {
  const digits = normalizePhone(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
};

const getPhotos = (photos: PhotoState, key: string) => photos[key] ?? [];
const getTotalPhotoCount = (photos: PhotoState) =>
  Object.values(photos).reduce((sum, list) => sum + list.length, 0);
const getStepIconName = (step: RequestStep) => {
  if (step.kind === 'photos') return 'camera' as const;
  if (step.kind === 'region') return 'pin' as const;
  if (step.kind === 'textarea') return 'edit' as const;
  if (step.field === 'damageParts') return 'wall' as const;
  if (step.field === 'schedule') return 'calendar' as const;
  return 'home' as const;
};

const resolveChoice = (form: FormState, field: string, directOption?: string, directField?: string, dateOption?: string, dateField?: string) => {
  const selected = getString(form, field);
  if (selected === directOption && directField) {
    return getString(form, directField).trim();
  }
  if (selected === dateOption && dateField) {
    return getString(form, dateField).trim();
  }
  return selected;
};

const resolveMulti = (form: FormState, field: string, directOption?: string, directField?: string) => {
  const selected = Array.isArray(form[field]) ? (form[field] as string[]) : [];
  const values = selected.filter((item) => item !== directOption);
  if (directOption && selected.includes(directOption) && directField && hasText(form, directField)) {
    values.push(getString(form, directField).trim());
  }
  return values;
};

export const RequestScreen = ({
  initialTarget,
  onChangeScreen,
}: {
  initialTarget?: RequestTarget;
  onChangeScreen: (screen: AppScreen) => void;
}) => {
  const [target, setTarget] = useState<RequestTarget | null>(initialTarget ?? null);
  const [stepIndex, setStepIndex] = useState(initialTarget ? 0 : -1);
  const [form, setForm] = useState<FormState>({});
  const [photos, setPhotos] = useState<PhotoState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState('');
  const [submittedResultUrl, setSubmittedResultUrl] = useState('');

  useEffect(() => {
    if (initialTarget) {
      setTarget(initialTarget);
      setStepIndex(0);
      setForm({ requestType: initialTarget });
      setPhotos({});
      setSubmitError('');
      setSubmittedRequestId('');
      setSubmittedResultUrl('');
    }
  }, [initialTarget]);

  const steps = useMemo(() => (target === 'business' ? businessSteps : homeSteps), [target]);
  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null;
  const progress = currentStep ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;
  const selectedArea = getString(form, 'area');
  const dongOptions = regionOptions.find((item) => item.area === selectedArea)?.dongs ?? [];

  const setValue = (key: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key: string, option: string) => {
    const current = Array.isArray(form[key]) ? (form[key] as string[]) : [];
    setValue(key, current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  };

  const selectTarget = (nextTarget: RequestTarget) => {
    setTarget(nextTarget);
    setStepIndex(0);
    setForm({ requestType: nextTarget });
    setPhotos({});
    setSubmitError('');
    setSubmittedRequestId('');
    setSubmittedResultUrl('');
  };

  const canGoNext = useMemo(() => {
    if (!currentStep) {
      return false;
    }

    if (currentStep.kind === 'choice' && currentStep.field) {
      const selected = getString(form, currentStep.field);
      if (!selected) {
        return false;
      }
      if (selected === currentStep.directOption) {
        return hasText(form, currentStep.directField);
      }
      if (selected === currentStep.dateOption) {
        return Boolean(currentStep.dateField && normalizeDateValue(getString(form, currentStep.dateField)));
      }
      return true;
    }

    if (currentStep.kind === 'multi' && currentStep.field) {
      const selected = Array.isArray(form[currentStep.field]) ? (form[currentStep.field] as string[]) : [];
      if (selected.length === 0) {
        return false;
      }
      if (selected.includes(currentStep.directOption ?? '')) {
        return hasText(form, currentStep.directField);
      }
      return true;
    }

    if (currentStep.kind === 'photos') {
      return (
        requiredPhotoItems.every((item) => getPhotos(photos, item.key).length >= photoLimits[item.key].min) &&
        getTotalPhotoCount(photos) <= TOTAL_PHOTO_LIMIT
      );
    }

    if (currentStep.kind === 'region') {
      return hasText(form, 'area') && hasText(form, 'dong');
    }

    if (currentStep.kind === 'textarea') {
      return true;
    }

    if (currentStep.kind === 'contact') {
      return (
        hasText(form, 'customerName') &&
        isValidPhone(getString(form, 'customerPhone')) &&
        getString(form, 'consentResultNotice') === 'Y'
      );
    }

    return false;
  }, [currentStep, form, photos]);

  const submitRequest = async () => {
    if (!target || submittedRequestId) {
      return true;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const isBusiness = target === 'business';
    const damageParts = resolveMulti(form, 'damageParts', '직접입력', 'damagePartsOther').join(', ');
    const areaText = [getString(form, 'area'), getString(form, 'dong')].filter(Boolean).join(' ');
    const requiredPhotos = {
      fullSpace: getPhotos(photos, 'fullSpace'),
      damageRange: getPhotos(photos, 'damageRange'),
      closeUp: getPhotos(photos, 'closeUp'),
    };
    const optionalPhotos = getPhotos(photos, optionalPhotoItem.key);
    const photoSummary = [
      ...requiredPhotoItems.map((item) => {
        const names = getPhotos(photos, item.key)
          .map((photo) => photo.fileName)
          .join(', ');
        return `${item.title}: ${names}`;
      }),
      optionalPhotos.length
        ? `${optionalPhotoItem.title}: ${optionalPhotos.map((photo) => photo.fileName).join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    const requestTypeLabel = isBusiness ? '운영 공간' : '일반 가정';
    const housingType = resolveChoice(form, 'housingType', '직접입력', 'housingTypeOther');
    const businessType = resolveChoice(form, 'businessType', '직접입력', 'businessTypeOther');
    const situation = resolveChoice(form, 'situation', '직접 입력할게요', 'situationOther');
    const budget = resolveChoice(form, 'budget', '직접입력', 'budgetOther');
    const workWindow = resolveChoice(form, 'workWindow', '직접입력', 'workWindowOther');
    const customerName = getString(form, 'customerName').trim();
    const customerPhone = normalizePhone(getString(form, 'customerPhone'));
    const kakaoNoticeAvailable = getString(form, 'kakaoNoticeAvailable') === 'Y';
    const customerEmail = getString(form, 'customerEmail').trim();

    const desiredSchedule = getString(form, 'schedule');
    const desiredDate = desiredSchedule === '특정 날짜 선택' ? normalizeDateValue(getString(form, 'scheduleDate')) : '';
    const schedule = desiredSchedule === '특정 날짜 선택' ? desiredDate : desiredSchedule;

    console.info('[PETROOM_REQUEST_DATE]', {
      desiredSchedule,
      desiredDate,
    });

    if (desiredSchedule === '특정 날짜 선택' && !desiredDate) {
      setSubmitError('희망 날짜를 다시 선택해주세요.');
      setIsSubmitting(false);
      return false;
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requestType: requestTypeLabel,
          source: 'PET ROOM 앱',
          userName: customerName,
          userContact: customerPhone,
          contactPreference: [
            '휴대폰',
            kakaoNoticeAvailable ? '카카오톡 가능' : '',
            customerEmail ? '이메일' : '',
          ].filter(Boolean).join(', '),
          consentResultNotice: true,
          kakaoNoticeAvailable,
          customerEmail,
          areaName: getString(form, 'area'),
          dongName: getString(form, 'dong'),
          cityDistrict: getString(form, 'area'),
          adminDong: getString(form, 'dong'),
          housingType,
          businessType,
          situation,
          damageParts,
          damagePartsOther: getString(form, 'damagePartsOther'),
          budget,
          workWindow,
          desiredSchedule,
          desiredDate,
          scheduleDate: desiredDate,
          requiredPhotos,
          optionalPhotos,
          damageType: damageParts || (isBusiness ? '운영 공간 손상' : '가정 손상'),
          damageRange: isBusiness ? budget || '사진 기반 확인 필요' : situation || '사진 기반 확인 필요',
          area: areaText,
          layout: isBusiness ? businessType : '',
          stuff: isBusiness ? workWindow : '',
          schedule,
          location: areaText,
          sameMaterial: '',
          damagePosition: '',
          repairIntent: isBusiness ? workWindow : situation,
          memo: [
            `요청 유형: ${requestTypeLabel}`,
            isBusiness ? `운영 공간 유형: ${businessType}` : `주거유형: ${housingType}`,
            isBusiness ? `희망 예산: ${budget}` : `현재상황: ${situation}`,
            isBusiness ? `시공 가능 시간대: ${workWindow}` : '',
            getString(form, 'memo') ? `추가 요청사항: ${getString(form, 'memo')}` : '',
            photoSummary ? `첨부 파일명:\n${photoSummary}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          imageCount: getTotalPhotoCount(photos),
          images: [
            ...Object.values(requiredPhotos).flatMap((photoList) => photoList.map((photo) => photo.dataUrl)),
            ...optionalPhotos.map((photo) => photo.dataUrl).filter(Boolean),
          ],
        }),
      });
      const responseText = await response.text();
      let result: Record<string, unknown> = {};

      try {
        result = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};
      } catch {
        throw new Error(response.status === 413 ? uploadPhotoErrorMessage : '요청 저장 응답을 확인하지 못했습니다.');
      }
      console.info('[PETROOM_APPS_SCRIPT_RESPONSE]', {
        status: response.status,
        ok: response.ok,
        resultOk: result.ok,
        message: result.message,
        field: result.field,
        sheetResultOk:
          typeof result.sheetResult === 'object' && result.sheetResult !== null && 'ok' in result.sheetResult
            ? result.sheetResult.ok
            : undefined,
        sheetResultMessage:
          typeof result.sheetResult === 'object' && result.sheetResult !== null && 'message' in result.sheetResult
            ? result.sheetResult.message
            : undefined,
      });

      if (!response.ok || !result.ok) {
        throw new Error(typeof result.message === 'string' ? result.message : '요청 저장에 실패했습니다.');
      }

      const savedRequestId = typeof result.requestId === 'string' ? result.requestId : '';
      const savedCustomerToken = typeof result.customerToken === 'string' ? result.customerToken : '';
      const savedResultUrl = typeof result.customerResultUrl === 'string' ? result.customerResultUrl : '';
      setSubmittedRequestId(savedRequestId);
      setSubmittedResultUrl(savedResultUrl);
      saveRecentRequestId(savedRequestId);
      saveRecentRequestAccess(savedRequestId, savedCustomerToken);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청 저장에 실패했습니다.';
      console.error('[PETROOM_REQUEST_SUBMIT_FAILED]', { message, error });
      setSubmitError(
        message.includes('String did not match') || message.includes('사진')
          ? uploadPhotoErrorMessage
          : message,
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = async () => {
    if (!currentStep || currentStep.kind === 'complete' || !canGoNext) {
      return;
    }

    if (stepIndex === steps.length - 2) {
      const ok = await submitRequest();
      if (!ok) {
        return;
      }
    }

    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    if (stepIndex <= 0) {
      setStepIndex(-1);
      setTarget(null);
      setForm({});
      setPhotos({});
      return;
    }
    setStepIndex((prev) => prev - 1);
  };

  const renderDirectInput = (step: RequestStep, selected: boolean) => {
    if (!selected || !step.directField) {
      return null;
    }

    return (
      <label className="mt-3 block rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <span className="text-xs font-black text-[#0066FF]">{step.directLabel}</span>
        <input
          value={getString(form, step.directField)}
          onChange={(event) => setValue(step.directField!, event.target.value)}
          placeholder={step.directPlaceholder}
          className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#0066FF]"
        />
      </label>
    );
  };

  const addPhotoFiles = async (key: string, files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const currentCount = getPhotos(photos, key).length;
    const groupLimit = photoLimits[key].max;
    const totalCount = getTotalPhotoCount(photos);
    const groupRemaining = Math.max(0, groupLimit - currentCount);
    const totalRemaining = Math.max(0, TOTAL_PHOTO_LIMIT - totalCount);
    const allowedCount = Math.min(groupRemaining, totalRemaining);

    if (allowedCount <= 0) {
      setSubmitError(`사진은 전체 최대 ${TOTAL_PHOTO_LIMIT}장까지 업로드할 수 있습니다.`);
      return;
    }

    const filesToRead = selectedFiles.slice(0, allowedCount);

    try {
      const processed = await Promise.allSettled(
        filesToRead.map(async (file) => {
          const processed = await readFileAsDataUrl(file);
          return {
            fileName: file.name,
            fileType: getFileType(file),
            fileSize: file.size,
            dataUrl: processed.dataUrl,
            resizeStatus: processed.resizeStatus,
          };
        }),
      );
      const nextPhotos = processed
        .filter((result): result is PromiseFulfilledResult<PhotoUpload> => result.status === 'fulfilled')
        .map((result) => result.value);

      if (nextPhotos.length === 0) {
        throw new Error(uploadPhotoErrorMessage);
      }

      setPhotos((prev) => ({
        ...prev,
        [key]: [...getPhotos(prev, key), ...nextPhotos],
      }));

      if (nextPhotos.length < filesToRead.length) {
        setSubmitError(uploadPhotoErrorMessage);
      } else if (selectedFiles.length > allowedCount) {
        setSubmitError(`선택한 사진 중 ${allowedCount}장만 추가했습니다. 전체 최대 ${TOTAL_PHOTO_LIMIT}장까지 가능합니다.`);
      } else {
        setSubmitError('');
      }
    } catch (error) {
      console.error('[PETROOM_PHOTO_PROCESS_FAILED]', {
        message: error instanceof Error ? error.message : String(error),
      });
      setSubmitError(uploadPhotoErrorMessage);
    }
  };

  const removePhoto = (key: string, index: number) => {
    setPhotos((prev) => ({
      ...prev,
      [key]: getPhotos(prev, key).filter((_, photoIndex) => photoIndex !== index),
    }));
  };

  const renderStep = () => {
    if (!currentStep) {
      return (
        <section className="space-y-6">
          <div>
            <p className="text-[13px] font-black text-[#0066FF]">원상복구 견적 요청</p>
            <h1 className="mt-3 break-keep text-[28px] font-black leading-tight tracking-[-0.02em] text-[#0F172A]">
              어떤 공간의
              <br />
              손상인가요?
            </h1>
          </div>
          <div className="space-y-3">
            {targetCards.map((card) => (
              <button
                key={card.target}
                type="button"
                onClick={() => selectTarget(card.target)}
                className="flex w-full items-center gap-4 rounded-[18px] border border-[#E2E8F0] bg-white p-5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#EFF6FF] text-[#0066FF]">
                  <LineIcon name={card.target === 'home' ? 'home' : 'building'} size={25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-black text-[#0F172A]">{card.title}</span>
                  <span className="mt-1 block break-keep text-[13px] font-semibold leading-relaxed text-[#64748B]">
                    {card.target === 'home' ? '집 안 벽지·장판 손상' : '매장·유치원·호텔 손상'}
                  </span>
                </span>
                <span className="text-xl font-bold text-[#CBD5E1]">›</span>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (currentStep.kind === 'complete') {
      return (
        <section className="pr-card p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0066FF]">
            <LineIcon name="check" size={28} />
          </div>
          <h1 className="mt-4 text-xl font-black leading-snug text-[#0F172A]">{currentStep.completeTitle}</h1>
          <p className="mt-3 break-keep text-sm font-semibold leading-relaxed text-[#6B7280]">{currentStep.completeMessage}</p>
          {submittedRequestId && <p className="mt-3 text-xs font-black text-[#9CA3AF]">요청 ID: {submittedRequestId}</p>}
          <p className="mt-3 text-sm font-black text-[#0066FF]">
            견적 결과가 준비되면 입력한 연락처로 고객 전용 링크를 안내드립니다.
          </p>
          {submittedResultUrl && (
            <a
              href={submittedResultUrl}
              className="mt-4 block rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-black text-[#0066FF]"
            >
              내 요청 진행 상태 확인하기
            </a>
          )}
          <button
            type="button"
            onClick={() => onChangeScreen('progress')}
            className="pr-cta mt-5"
          >
            진행 상태 보기
          </button>
        </section>
      );
    }

    if (currentStep.kind === 'choice' && currentStep.field && currentStep.options) {
      const selectedValue = getString(form, currentStep.field);
      return (
        <div>
          <div className="grid grid-cols-2 gap-3">
            {currentStep.options.map((option) => {
              const selected = selectedValue === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setValue(currentStep.field!, option)}
                  className={`pr-chip min-h-14 px-3 py-3 text-sm font-black ${selected ? 'selected' : ''}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {renderDirectInput(currentStep, selectedValue === currentStep.directOption)}
          {selectedValue === currentStep.dateOption && currentStep.dateField && (
            <label className="mt-3 block rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
              <span className="text-xs font-black text-[#0066FF]">완료가 필요한 날짜를 선택해주세요.</span>
              <input
                type="date"
                value={normalizeDateValue(getString(form, currentStep.dateField))}
                onChange={(event) => {
                  const nextDate = normalizeDateValue(event.target.value);
                  console.info('[PETROOM_DATE_INPUT]', {
                    desiredSchedule: selectedValue,
                    rawDate: event.target.value,
                    desiredDate: nextDate,
                  });
                  setValue(currentStep.dateField!, nextDate);
                }}
                className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#0066FF]"
              />
            </label>
          )}
        </div>
      );
    }

    if (currentStep.kind === 'multi' && currentStep.field && currentStep.options) {
      const selected = Array.isArray(form[currentStep.field]) ? (form[currentStep.field] as string[]) : [];
      return (
        <div>
          <div className="grid grid-cols-3 gap-2">
            {currentStep.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleMulti(currentStep.field!, option)}
                className={`pr-chip pr-chip-coral min-h-[92px] px-2 py-3 text-[11px] font-semibold leading-snug ${
                  selected.includes(option) ? 'selected' : ''
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {renderDirectInput(currentStep, selected.includes(currentStep.directOption ?? ''))}
        </div>
      );
    }

    if (currentStep.kind === 'photos') {
      const totalPhotoCount = getTotalPhotoCount(photos);

      return (
        <div className="space-y-3">
          {requiredPhotoItems.map((item) => (
            <div
              key={item.key}
              className={`rounded-[20px] border bg-white p-4 shadow-card ${
                getPhotos(photos, item.key).length >= photoLimits[item.key].min ? 'border-[#0066FF]' : 'border-dashed border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#0066FF]">
                  <LineIcon name={getPhotos(photos, item.key).length > 0 ? 'check' : 'camera'} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-black text-[#0F172A]">{item.title}</strong>
                  <span className="mt-1 block break-keep text-xs font-semibold leading-relaxed text-[#6B7280]">
                    {target === 'business' ? item.businessDescription : item.homeDescription}
                  </span>
                  <span className="mt-2 block text-xs font-black text-[#0066FF]">
                    {getPhotos(photos, item.key).length}/{photoLimits[item.key].max}장
                  </span>
                </span>
              </div>

              {getPhotos(photos, item.key).length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {getPhotos(photos, item.key).map((photo, index) => (
                    <div key={`${photo.fileName}-${index}`} className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <img src={photo.dataUrl} alt={photo.fileName} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(item.key, index)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-black text-white"
                        aria-label="사진 삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-black text-[#0066FF]">
                사진 추가하기
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (event) => {
                    await addPhotoFiles(item.key, event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
          ))}

          <div className="rounded-[20px] border border-dashed border-[#E2E8F0] bg-white p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#0066FF]">
                <LineIcon name={getPhotos(photos, optionalPhotoItem.key).length > 0 ? 'check' : 'camera'} size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-black text-[#0F172A]">{optionalPhotoItem.title}</strong>
                <span className="mt-1 block break-keep text-xs font-semibold leading-relaxed text-[#6B7280]">{optionalPhotoItem.description}</span>
                <span className="mt-2 block text-xs font-black text-[#0066FF]">
                  {getPhotos(photos, optionalPhotoItem.key).length}/{photoLimits[optionalPhotoItem.key].max}장
                </span>
              </span>
            </div>

            {getPhotos(photos, optionalPhotoItem.key).length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {getPhotos(photos, optionalPhotoItem.key).map((photo, index) => (
                  <div key={`${photo.fileName}-${index}`} className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <img src={photo.dataUrl} alt={photo.fileName} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(optionalPhotoItem.key, index)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-black text-white"
                      aria-label="사진 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-black text-[#0066FF]">
              사진 추가하기
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (event) => {
                  await addPhotoFiles(optionalPhotoItem.key, event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
          </div>

          <p className="rounded-xl bg-[#EEF4FF] px-4 py-3 text-xs font-black leading-relaxed text-[#0066FF]">
            전체 {totalPhotoCount}/{TOTAL_PHOTO_LIMIT}장
          </p>
        </div>
      );
    }

    if (currentStep.kind === 'region') {
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-black text-[#6B7280]">서울/경기 + 시군구 선택</span>
            <select
              value={selectedArea}
              onChange={(event) => {
                setValue('area', event.target.value);
                setValue('dong', '');
              }}
              className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-black text-[#0F172A] outline-none focus:border-[#0066FF]"
            >
              <option value="">예: 경기 성남시 분당구</option>
              {regionOptions.map((item) => (
                <option key={item.area} value={item.area}>
                  {item.area}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#6B7280]">세부 행정동 선택</span>
            <select
              value={getString(form, 'dong')}
              onChange={(event) => setValue('dong', event.target.value)}
              disabled={!selectedArea}
              className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-black text-[#0F172A] outline-none focus:border-[#0066FF] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
            >
              <option value="">예: 수내1동</option>
              {dongOptions.map((dong) => (
                <option key={dong} value={dong}>
                  {dong}
                </option>
              ))}
            </select>
          </label>
          <p className="rounded-xl bg-[#EEF4FF] px-4 py-3 text-xs font-bold leading-relaxed text-[#0066FF]">
            상세주소는 받지 않습니다. 업체 연결이 필요한 단계에서 필요한 범위만 다시 확인합니다.
          </p>
        </div>
      );
    }

    if (currentStep.kind === 'textarea' && currentStep.field) {
      return (
        <textarea
          value={getString(form, currentStep.field)}
          onChange={(event) => setValue(currentStep.field!, event.target.value)}
          placeholder={currentStep.placeholder}
          className="min-h-44 w-full resize-none rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 text-sm font-bold leading-relaxed text-[#0F172A] shadow-card outline-none focus:border-[#0066FF]"
        />
      );
    }

    if (currentStep.kind === 'contact') {
      return (
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-black text-[#475569]">이름 또는 업체명 *</span>
            <input
              value={getString(form, 'customerName')}
              onChange={(event) => setValue('customerName', event.target.value)}
              placeholder={target === 'business' ? '예: 펫룸 애견유치원' : '예: 홍길동'}
              autoComplete="name"
              className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#0066FF]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#475569]">휴대폰 번호 *</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={formatPhone(getString(form, 'customerPhone'))}
              onChange={(event) => setValue('customerPhone', normalizePhone(event.target.value))}
              placeholder="010-0000-0000"
              className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#0066FF]"
            />
            {getString(form, 'customerPhone') && !isValidPhone(getString(form, 'customerPhone')) && (
              <span className="mt-2 block text-xs font-bold text-red-500">휴대폰 번호를 정확히 입력해주세요.</span>
            )}
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#475569]">이메일 (선택)</span>
            <input
              type="email"
              autoComplete="email"
              value={getString(form, 'customerEmail')}
              onChange={(event) => setValue('customerEmail', event.target.value)}
              placeholder="example@email.com"
              className="mt-2 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#0066FF]"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <input
              type="checkbox"
              checked={getString(form, 'kakaoNoticeAvailable') === 'Y'}
              onChange={(event) => setValue('kakaoNoticeAvailable', event.target.checked ? 'Y' : 'N')}
              className="mt-0.5 h-5 w-5 accent-[#0066FF]"
            />
            <span>
              <strong className="block text-sm font-black text-[#0F172A]">카카오톡 안내 가능</strong>
              <span className="mt-1 block text-xs font-semibold text-[#64748B]">입력한 휴대폰 번호로 카카오톡 안내를 받을 수 있어요.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
            <input
              type="checkbox"
              checked={getString(form, 'consentResultNotice') === 'Y'}
              onChange={(event) => setValue('consentResultNotice', event.target.checked ? 'Y' : 'N')}
              className="mt-0.5 h-5 w-5 accent-[#0066FF]"
            />
            <span>
              <strong className="block text-sm font-black text-[#0F172A]">견적 결과 안내 수신에 동의합니다. *</strong>
              <span className="mt-1 block text-xs font-semibold leading-relaxed text-[#64748B]">
                신청 결과와 고객 전용 견적 링크를 전달하기 위해 연락처를 사용합니다.
              </span>
            </span>
          </label>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="-mx-5 -mt-4 min-h-[calc(100vh-88px)] bg-[#F8FAFC]">
      <header className="flex items-center gap-3 border-b border-[#E2E8F0] bg-white px-5 py-4">
        <button
          type="button"
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8FAFC] text-lg font-black text-[#0066FF]"
          aria-label="이전"
        >
          ←
        </button>
        <span className="text-[16px] font-black text-[#0F172A]">견적 신청</span>
        {currentStep && (
          <span className="ml-auto text-[12px] font-bold text-[#9CA3AF]">
            <span className="font-black text-[#0066FF]">{stepIndex + 1}</span> / {steps.length}
          </span>
        )}
      </header>

      {currentStep && (
        <>
          <div className="h-1 bg-[#E2E8F0]">
            <div
              className="h-full rounded-r-sm transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #5BA7F2, #0066FF)',
              }}
            />
          </div>
          <div className="flex justify-center gap-1.5 py-3">
            {steps.map((step, index) => (
              <div
                key={`${step.title}-${index}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === stepIndex ? 'w-5 bg-[#0066FF]' : 'w-1.5 bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="space-y-5 px-5 pb-6">
        {currentStep && currentStep.kind !== 'complete' && (
          <section className="space-y-4">
            <div className="flex justify-center">
              <div
                className={`animate-float flex h-20 w-20 items-center justify-center rounded-3xl ${
                  (stepIndex + 1) % 2 === 1
                    ? 'bg-gradient-to-br from-[#EEF4FF] to-[#C7DCFF]'
                    : 'bg-gradient-to-br from-[#EFF6FF] to-[#BFDBFE]'
                }`}
              >
                <LineIcon name={getStepIconName(currentStep)} size={42} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="break-keep text-2xl font-black leading-snug text-[#0F172A]">{currentStep.title}</h2>
              {currentStep.description && <p className="break-keep text-sm font-semibold leading-relaxed text-[#6B7280]">{currentStep.description}</p>}
            </div>
          </section>
        )}

        {renderStep()}

        {currentStep && currentStep.kind !== 'complete' && (
          <div className="grid grid-cols-[96px_1fr] gap-3">
            <button
              type="button"
              onClick={goBack}
              className="h-12 rounded-2xl border border-[#E2E8F0] bg-white text-sm font-black text-[#6B7280]"
            >
              이전
            </button>
            <button type="button" onClick={goNext} disabled={isSubmitting || !canGoNext} className="pr-cta !h-12 !py-0 text-sm">
              {isSubmitting ? '요청 저장 중...' : stepIndex === steps.length - 2 ? '요청 완료하기' : '다음 →'}
            </button>
          </div>
        )}
        {submitError && <p className="rounded-xl bg-[#EFF6FF] px-4 py-3 text-xs font-black text-[#0066FF]">{submitError}</p>}
      </div>
    </div>
  );
};
