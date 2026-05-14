import { NextResponse } from "next/server";

import { demoClaims } from "../../../data/claimsData";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/claims/`, { cache: "no-store" });
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
    // Return a demo-style created record if backend is unavailable.
  }

  return NextResponse.json({ ...body, id: `KN-DEMO-${Date.now()}` }, { status: 201 });
}
