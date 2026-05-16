import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("admin_chat")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && Array.isArray(data)) {
        return NextResponse.json({ source: "supabase", messages: data });
      }
    } catch {
      // Fall through to demo.
    }
  }

  return NextResponse.json({ source: "demo", messages: [] });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const insertPayload = {
    farmer_id: body.farmer_id ?? body.farmerId ?? null,
    farmer_name: body.farmer_name ?? body.farmerName ?? null,
    mobile_number: body.mobile_number ?? body.mobileNumber ?? null,
    issue_type: body.issue_type ?? body.issueType ?? null,
    message: body.message ?? null,
    sender: body.sender || "farmer",
    status: body.status || "Open",
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("admin_chat")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ source: "supabase", message: data }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        {
          source: "demo",
          error: `Supabase insert failed: ${error.message}`,
          message: { ...insertPayload, id: `LOCAL-${Date.now()}` },
        },
        { status: 201 },
      );
    }
  }

  return NextResponse.json(
    {
      source: "demo",
      info: "Supabase not configured. Message echoed for demo.",
      message: { ...insertPayload, id: `LOCAL-${Date.now()}` },
    },
    { status: 201 },
  );
}
