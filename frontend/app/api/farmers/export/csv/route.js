import { NextResponse } from "next/server";

import { demoFarmers } from "../../../../../data/farmersData";
import { enrichFarmer, farmersToCsv } from "../../../../../utils/farmers";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  let farmers = demoFarmers.map(enrichFarmer);

  try {
    const response = await fetch(`${BACKEND_URL}/api/farmers/records/`, { cache: "no-store" });
    if (response.ok) {
      const backendFarmers = await response.json();
      if (Array.isArray(backendFarmers) && backendFarmers.length > 0) {
        farmers = backendFarmers.map(enrichFarmer);
      }
    }
  } catch {
    // Frontend still exports demo data if backend is unavailable.
  }

  return new NextResponse(farmersToCsv(farmers), {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="krishinetra_farmer_data.csv"',
    },
  });
}
