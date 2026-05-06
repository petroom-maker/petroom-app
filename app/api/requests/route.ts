import { NextRequest, NextResponse } from 'next/server';
import { getEstimateRange } from '@/lib/estimate';
import { postToGoogleSheet } from '@/lib/sheets';

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = makeId('req');
    const createdAt = new Date().toISOString();
    const imageCount = Number(body.imageCount ?? 0);
    const estimate = getEstimateRange({
      area: body.area ?? '',
      damageType: body.damageType ?? '',
      damageRange: body.damageRange ?? '',
      housingType: body.housingType ?? '',
      layout: body.layout ?? '',
      location: body.location ?? '',
      sameMaterial: body.sameMaterial ?? '',
      stuff: body.stuff ?? '',
      schedule: body.schedule ?? '',
      damagePosition: body.damagePosition ?? '',
      repairIntent: body.repairIntent ?? '',
      imageCount,
    });

    const row = {
      request_id: requestId,
      created_at: createdAt,
      user_name: body.userName ?? '',
      user_contact: body.userContact ?? '',
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
      schedule: body.schedule ?? '',
      user_memo: body.memo ?? '',
      image_count: imageCount,
      estimated_min: estimate.minPrice,
      estimated_max: estimate.maxPrice,
      confidence: estimate.confidence,
      confidence_label: estimate.confidenceLabel,
      status: '입찰대기',
    };

    const sheetResult = await postToGoogleSheet({
      sheet: 'requests',
      values: row,
    });

    return NextResponse.json({
      ok: true,
      requestId,
      estimate,
      sheetResult,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: '견적 요청 저장 중 문제가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
