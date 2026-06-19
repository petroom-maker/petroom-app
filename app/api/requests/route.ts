import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getEstimateRange } from '@/lib/estimate';
import { isAdminAuthorized, unauthorized } from '@/lib/petroom-access';
import { demoRequests, normalizeRequest } from '@/lib/petroom-data';
import { addMemoryRequest, petroomMemoryStore } from '@/lib/petroom-memory';
import { postToGoogleSheet, readFromGoogleSheet } from '@/lib/sheets';

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uploadPhotoErrorMessage = '일부 사진을 처리하지 못했습니다. 아이폰 원본 사진인 경우 스크린샷 또는 JPG로 다시 선택해주세요.';
const phonePattern = /^01[016789]\d{7,8}$/;
const normalizeDate = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return datePattern.test(text) ? text : '';
};
const toPhotoArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === 'object' && 'dataUrl' in item);
  }

  if (value && typeof value === 'object' && 'dataUrl' in value) {
    return [value];
  }

  return [];
};
const summarizePhotos = (label: string, photos: Record<string, unknown>[]) =>
  photos.map((photo, index) => ({
    label,
    index: index + 1,
    fileName: String(photo.fileName ?? ''),
    fileType: String(photo.fileType ?? ''),
    fileSize: Number(photo.fileSize ?? 0),
    resizeStatus: String(photo.resizeStatus ?? ''),
    hasDataUrl: typeof photo.dataUrl === 'string' && photo.dataUrl.length > 0,
    dataUrlPrefix: typeof photo.dataUrl === 'string' ? photo.dataUrl.slice(0, 40) : '',
  }));

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return unauthorized();
  }

  try {
    const sheetResult = await readFromGoogleSheet({ sheet: 'requests' });
    const requests = sheetResult.rows
      .map((row) => normalizeRequest(row))
      .filter((row) => row.request_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      ok: true,
      source: sheetResult.skipped ? 'demo' : 'google_sheets',
      requests: sheetResult.skipped ? [...petroomMemoryStore.requests, ...demoRequests] : requests,
      sheetResult,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      ok: true,
      source: 'demo',
      requests: [...petroomMemoryStore.requests, ...demoRequests],
      sheetResult: {
        ok: false,
        error: getErrorMessage(error),
        message: 'Google Sheets 읽기 설정이 아직 준비되지 않아 데모 요청을 표시합니다.',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = makeId('req');
    const createdAt = new Date().toISOString();
    const customerName = String(body.userName ?? body.customerName ?? '').trim();
    const customerPhone = String(body.userContact ?? body.customerPhone ?? '').replace(/\D/g, '');
    const consentResultNotice = body.consentResultNotice === true || String(body.consentResultNotice).toUpperCase() === 'Y';
    const customerToken = randomBytes(18).toString('base64url');
    const customerResultBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/+$/, '');
    const images = Array.isArray(body.images) ? body.images : [];
    const requiredPhotos = body.requiredPhotos && typeof body.requiredPhotos === 'object' ? body.requiredPhotos : {};
    const requiredPhotoGroups = {
      fullSpace: toPhotoArray(requiredPhotos.fullSpace) as Record<string, unknown>[],
      damageRange: toPhotoArray(requiredPhotos.damageRange) as Record<string, unknown>[],
      closeUp: toPhotoArray(requiredPhotos.closeUp) as Record<string, unknown>[],
    };
    const optionalPhotos = toPhotoArray(body.optionalPhotos) as Record<string, unknown>[];
    const imageCount =
      requiredPhotoGroups.fullSpace.length +
      requiredPhotoGroups.damageRange.length +
      requiredPhotoGroups.closeUp.length +
      optionalPhotos.length;
    const desiredSchedule = typeof body.desiredSchedule === 'string' ? body.desiredSchedule : String(body.schedule ?? '');
    const desiredDate = desiredSchedule === '특정 날짜 선택' ? normalizeDate(body.desiredDate ?? body.scheduleDate) : '';

    console.info('[PETROOM_API_REQUEST_INPUT]', {
      desiredSchedule,
      desiredDate,
      imageCount,
      photos: [
        ...summarizePhotos('fullSpace', requiredPhotoGroups.fullSpace),
        ...summarizePhotos('damageRange', requiredPhotoGroups.damageRange),
        ...summarizePhotos('closeUp', requiredPhotoGroups.closeUp),
        ...summarizePhotos('optional', optionalPhotos),
      ],
    });

    if (!customerName) {
      return NextResponse.json(
        {
          ok: false,
          field: 'customerName',
          message: '이름 또는 업체명을 입력해주세요.',
        },
        { status: 400 },
      );
    }

    if (!phonePattern.test(customerPhone)) {
      return NextResponse.json(
        {
          ok: false,
          field: 'customerPhone',
          message: '휴대폰 번호를 정확히 입력해주세요.',
        },
        { status: 400 },
      );
    }

    if (!consentResultNotice) {
      return NextResponse.json(
        {
          ok: false,
          field: 'consentResultNotice',
          message: '견적 결과 안내 수신에 동의해주세요.',
        },
        { status: 400 },
      );
    }

    if (desiredSchedule === '특정 날짜 선택' && !desiredDate) {
      return NextResponse.json(
        {
          ok: false,
          field: 'scheduleDate',
          message: '희망 날짜를 다시 선택해주세요.',
        },
        { status: 400 },
      );
    }

    if (
      requiredPhotoGroups.fullSpace.length < 1 ||
      requiredPhotoGroups.damageRange.length < 1 ||
      requiredPhotoGroups.closeUp.length < 1
    ) {
      return NextResponse.json(
        {
          ok: false,
          field: 'requiredPhotos',
          message: '필수 사진 3종은 각 항목별로 최소 1장씩 필요합니다.',
        },
        { status: 400 },
      );
    }

    if (
      requiredPhotoGroups.fullSpace.length > 10 ||
      requiredPhotoGroups.damageRange.length > 15 ||
      requiredPhotoGroups.closeUp.length > 15 ||
      optionalPhotos.length > 10 ||
      imageCount > 30
    ) {
      return NextResponse.json(
        {
          ok: false,
          field: 'requiredPhotos',
          message: '사진은 전체 최대 30장까지 업로드할 수 있습니다.',
        },
        { status: 400 },
      );
    }
    const estimate = getEstimateRange({
      area: body.area ?? '',
      damageType: body.damageType ?? '',
      damageRange: body.damageRange ?? '',
      housingType: body.housingType ?? '',
      layout: body.layout ?? '',
      location: body.location ?? '',
      sameMaterial: body.sameMaterial ?? '',
      stuff: body.stuff ?? '',
      schedule: desiredSchedule === '특정 날짜 선택' ? desiredDate : body.schedule ?? '',
      damagePosition: body.damagePosition ?? '',
      repairIntent: body.repairIntent ?? '',
      imageCount,
    });

    const row = {
      request_id: requestId,
      created_at: createdAt,
      source: body.source ?? 'PET ROOM 앱',
      request_type: body.requestType ?? '',
      customer_name: customerName,
      contact_method: body.contactPreference ?? '',
      city_district: body.cityDistrict ?? body.areaName ?? '',
      admin_dong: body.adminDong ?? body.dongName ?? '',
      detail_address_collected: 'N',
      business_type: body.businessType ?? '',
      situation: body.situation ?? '',
      damage_parts: body.damageParts ?? body.damageType ?? '',
      damage_parts_other: body.damagePartsOther ?? '',
      budget: body.budget ?? '',
      work_window: body.workWindow ?? '',
      schedule_date: desiredDate,
      requiredPhotos: requiredPhotoGroups,
      optionalPhotos,
      customer_token: customerToken,
      customer_result_base_url: customerResultBaseUrl,
      consent_result_notice: 'Y',
      kakao_notice_available: body.kakaoNoticeAvailable ? 'Y' : 'N',
      customer_email: String(body.customerEmail ?? '').trim(),
      user_name: customerName,
      user_contact: customerPhone,
      contact_preference: body.contactPreference ?? '',
      region: body.location ?? '',
      damage_type: body.damageType ?? '',
      damage_scope: body.damageRange ?? '',
      housing_type: body.housingType ?? '',
      room_type: body.layout ?? '',
      area_text: body.area ?? '',
      material_match: body.sameMaterial ?? '',
      damage_position: body.damagePosition ?? '',
      repair_intent: body.repairIntent ?? '',
      furniture_level: body.stuff ?? '',
      schedule: desiredSchedule === '특정 날짜 선택' ? desiredDate : body.schedule ?? '',
      user_memo: body.memo ?? '',
      image_count: imageCount,
      photo_data_urls: images,
      photo_urls: '',
      estimated_min: estimate.minPrice,
      estimated_max: estimate.maxPrice,
      confidence: estimate.confidence,
      confidence_label: estimate.confidenceLabel,
      status: 'RECEIVED',
    };

    const sheetResult = await postToGoogleSheet({
      sheet: 'requests',
      values: row,
    });
    console.info('[PETROOM_APPS_SCRIPT_RESULT]', {
      ok: sheetResult.ok,
      requestId: sheetResult.requestId,
      message: sheetResult.message,
      field: sheetResult.field,
      imageCount: sheetResult.imageCount,
    });

    if (!sheetResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          field: typeof sheetResult.field === 'string' ? sheetResult.field : 'appsScript',
          message:
            typeof sheetResult.message === 'string' && sheetResult.message
              ? sheetResult.message
              : '견적 요청 저장 중 문제가 발생했습니다.',
          sheetResult,
        },
        { status: 502 },
      );
    }
    const finalRequestId = typeof sheetResult.requestId === 'string' ? sheetResult.requestId : requestId;

    addMemoryRequest({
      request_id: finalRequestId,
      created_at: createdAt,
      user_name: customerName,
      user_contact: customerPhone,
      contact_preference: body.contactPreference ?? '',
      region: body.location ?? '',
      damage_type: body.damageType ?? '',
      damage_scope: body.damageRange ?? '',
      housing_type: body.housingType ?? '',
      room_type: body.layout ?? '',
      area_text: body.area ?? '',
      material_match: body.sameMaterial ?? '',
      damage_position: body.damagePosition ?? '',
      repair_intent: body.repairIntent ?? '',
      furniture_level: body.stuff ?? '',
      schedule: desiredSchedule === '특정 날짜 선택' ? desiredDate : body.schedule ?? '',
      user_memo: body.memo ?? '',
      image_count: imageCount,
      photo_urls: '',
      estimated_min: estimate.minPrice,
      estimated_max: estimate.maxPrice,
      confidence: estimate.confidence,
      confidence_label: estimate.confidenceLabel,
      status: 'RECEIVED',
    });

    return NextResponse.json({
      ok: true,
      requestId: finalRequestId,
      customerToken:
        typeof sheetResult.customerToken === 'string' ? sheetResult.customerToken : customerToken,
      customerResultUrl:
        typeof sheetResult.customerResultUrl === 'string'
          ? sheetResult.customerResultUrl
          : `${customerResultBaseUrl}/requests/${encodeURIComponent(finalRequestId)}?token=${encodeURIComponent(customerToken)}`,
      estimate,
      sheetResult,
    });
  } catch (error) {
    console.error('[PETROOM_API_REQUEST_FAILED]', {
      message: getErrorMessage(error),
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error).includes('String did not match') ? uploadPhotoErrorMessage : '견적 요청 저장 중 문제가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
