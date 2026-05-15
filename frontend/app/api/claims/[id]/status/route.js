import { NextResponse } from "next/server";

import { demoClaims } from "../../../../../data/claimsData";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function PATCH(request, { params }) {
  const { status } = await request.json();
  const { id } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/api/claims/${id}/status/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      return NextResponse.json(await response.json());
    }
  } catch {
    // Demo fallback below.
  }

  const claim = demoClaims.find((item) => item.id === id || String(item.id) === String(id));
  return NextResponse.json({ ...(claim || { id }), status });
}
