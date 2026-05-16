import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { legacySubmitPayloadToClaimInsert } from "../../../../utils/supabaseMappers";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";

  let body;
  let plainBody;
  try {
    body = contentType.includes("multipart/form-data")
      ? await request.formData()
      : await request.json();
    plainBody = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
  } catch {
    plainBody = {};
    body = {};
  }

  let supabaseRecord = null;
  let supabaseError = null;
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const insertPayload = legacySubmitPayloadToClaimInsert(plainBody);
      const { data, error } = await admin
        .from("claims")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      supabaseRecord = data;
    } catch (error) {
      supabaseError = error.message;
    }
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${BACKEND_URL}/api/farmers/submit`, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(plainBody),
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    });
  } catch {
    backendResponse = null;
  }

  if (backendResponse && backendResponse.ok) {
    const json = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(
      {
        source: supabaseRecord ? "supabase+backend" : "backend",
        backend: json,
        supabase: supabaseRecord,
        supabaseError,
      },
      { status: backendResponse.status },
    );
  }

  if (supabaseRecord) {
    return NextResponse.json(
      {
        source: "supabase",
        message: "Submission stored in Supabase claims table.",
        supabase: supabaseRecord,
        farmer: {
          ...plainBody,
          farmerId: supabaseRecord.farmer_id,
          claimId: supabaseRecord.claim_id,
          status: supabaseRecord.claim_status,
        },
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      source: "demo",
      message:
        "Backend unavailable and Supabase not configured. Submission simulated for demo.",
      farmer: { ...plainBody, farmerId: `MOB-${Date.now()}`, status: "Pending" },
      supabaseError,
    },
    { status: 201 },
  );
}
