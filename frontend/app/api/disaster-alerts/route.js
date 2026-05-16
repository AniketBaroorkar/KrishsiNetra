import { NextResponse } from "next/server";

import { demoAlerts } from "../../../data/alertsData";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("disaster_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ source: "supabase", alerts: data });
      }
    } catch {
      // Fall through to demo.
    }
  }

  return NextResponse.json({ source: "demo", alerts: demoAlerts });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const insertPayload = {
    title: body.title ?? null,
    body: body.body ?? body.message ?? null,
    disaster_type: body.disaster_type ?? body.disasterType ?? null,
    severity: body.severity ?? body.riskLevel ?? null,
    district: body.district ?? null,
    taluka: body.taluka ?? null,
    crop_type: body.crop_type ?? body.cropType ?? null,
    action_required: body.action_required ?? body.actionRequired ?? null,
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("disaster_alerts")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ source: "supabase", alert: data }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        {
          source: "demo",
          error: `Supabase insert failed: ${error.message}`,
          alert: { ...insertPayload, id: `LOCAL-${Date.now()}` },
        },
        { status: 201 },
      );
    }
  }

  return NextResponse.json(
    {
      source: "demo",
      info: "Supabase not configured. Alert echoed for demo.",
      alert: { ...insertPayload, id: `LOCAL-${Date.now()}` },
    },
    { status: 201 },
  );
}
