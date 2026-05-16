import { NextResponse } from "next/server";

import { demoFarmers } from "../../../data/farmersData";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { supabaseClaimRowToFarmer } from "../../../utils/supabaseMappers";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("claims")
        .select("*")
        .order("submission_date", { ascending: false })
        .limit(500);
      if (!error && Array.isArray(data) && data.length > 0) {
        const farmers = data.map(supabaseClaimRowToFarmer).filter(Boolean);
        return NextResponse.json({ source: "supabase", farmers });
      }
    } catch {
      // Fall through to existing backend.
    }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/farmers/records/`, { cache: "no-store" });
    if (response.ok) {
      const farmers = await response.json();
      if (Array.isArray(farmers) && farmers.length > 0) {
        return NextResponse.json({ source: "backend", farmers });
      }
    }
  } catch {
    // Demo fallback keeps the farmer table usable during presentations.
  }

  return NextResponse.json({ source: "demo", farmers: demoFarmers });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const admin = getSupabaseAdmin();
  if (admin) {
    const insertPayload = {
      farmer_id: body.farmer_id || body.farmerId || `FARMER-${Date.now()}`,
      farmer_name: body.farmer_name ?? body.farmerName ?? null,
      mobile_number: body.mobile_number ?? body.mobileNumber ?? null,
      aadhaar_or_farmer_id:
        body.aadhaar_or_farmer_id ?? body.aadhaarOrFarmerId ?? null,
      village: body.village ?? null,
      taluka: body.taluka ?? null,
      district: body.district ?? null,
      state: body.state ?? null,
    };

    try {
      const { data, error } = await admin
        .from("farmers")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ source: "supabase", farmer: data }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        {
          source: "demo",
          message: `Supabase insert failed: ${error.message}`,
          farmer: { ...insertPayload, id: `LOCAL-${Date.now()}` },
        },
        { status: 201 },
      );
    }
  }

  return NextResponse.json(
    {
      source: "demo",
      message: "Supabase not configured. Returning demo record without persistence.",
      farmer: { ...body, farmer_id: body.farmer_id || `FARMER-${Date.now()}` },
    },
    { status: 201 },
  );
}
