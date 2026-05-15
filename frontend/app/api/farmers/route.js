import { NextResponse } from "next/server";

import { demoFarmers } from "../../../data/farmersData";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
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
