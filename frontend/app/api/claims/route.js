import { NextResponse } from "next/server";

import { demoClaims } from "../../../data/claimsData";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  newClaimPayloadToInsert,
  supabaseClaimRowToClaim,
} from "../../../utils/supabaseMappers";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId");

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      let query = admin
        .from("claims")
        .select("*")
        .order("submission_date", { ascending: false })
        .limit(500);
      if (farmerId) {
        query = query.eq("farmer_id", farmerId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const claims = data.map(supabaseClaimRowToClaim).filter(Boolean);
        return NextResponse.json({ source: "supabase", claims });
      }
    } catch {
      // Fall through.
    }
  }

  try {
    const url = farmerId
      ? `${BACKEND_URL}/api/claims/?farmer_id=${encodeURIComponent(farmerId)}`
      : `${BACKEND_URL}/api/claims/`;
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      const backendClaims = await response.json();
      if (Array.isArray(backendClaims) && backendClaims.length > 0) {
        return NextResponse.json({ source: "backend", claims: backendClaims });
      }
    }
  } catch {
    // Demo fallback keeps the dashboard usable when Django/Postgres is not running.
  }

  return NextResponse.json({ source: "demo", claims: demoClaims });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const admin = getSupabaseAdmin();
  if (admin) {
    const insertPayload = newClaimPayloadToInsert(body);
    try {
      const { data, error } = await admin
        .from("claims")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(
        { source: "supabase", claim: data },
        { status: 201 },
      );
    } catch (error) {
      return NextResponse.json(
        {
          source: "demo",
          message: `Supabase insert failed: ${error.message}`,
          claim: { ...insertPayload, id: `LOCAL-${Date.now()}` },
        },
        { status: 201 },
      );
    }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/claims/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      return NextResponse.json(await response.json(), { status: response.status });
    }
  } catch {
    // Fall through to demo.
  }

  return NextResponse.json(
    {
      source: "demo",
      claim: { ...body, id: `KN-DEMO-${Date.now()}` },
    },
    { status: 201 },
  );
}
