import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const insertPayload = {
    farmer_id: body.farmer_id || body.farmerId || null,
    survey_number: body.survey_number ?? body.surveyNumber ?? null,
    farm_area: toNumberOrNull(body.farm_area ?? body.farmArea),
    season: body.season ?? null,
    village: body.village ?? null,
    taluka: body.taluka ?? null,
    district: body.district ?? null,
    main_crop: body.main_crop ?? body.mainCrop ?? body.cropType ?? null,
    gps_latitude: toNumberOrNull(body.gps_latitude ?? body.latitude),
    gps_longitude: toNumberOrNull(body.gps_longitude ?? body.longitude),
    gps_accuracy: toNumberOrNull(body.gps_accuracy ?? body.gpsAccuracy),
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("farms")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ source: "supabase", farm: data }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        {
          source: "demo",
          message: `Supabase insert failed: ${error.message}`,
          farm: { ...insertPayload, id: `LOCAL-${Date.now()}` },
        },
        { status: 201 },
      );
    }
  }

  return NextResponse.json(
    {
      source: "demo",
      message: "Supabase not configured. Returning demo record without persistence.",
      farm: { ...insertPayload, id: `LOCAL-${Date.now()}` },
    },
    { status: 201 },
  );
}
