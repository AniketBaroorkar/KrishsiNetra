import { NextResponse } from "next/server";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";

  try {
    const body = contentType.includes("multipart/form-data")
      ? await request.formData()
      : await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/farmers/submit`, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    });

    if (backendResponse.ok) {
      return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
    }

    const plainBody = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
    return NextResponse.json(
      {
        source: "demo",
        message: "Backend did not accept submission. Stored as demo mobile submission.",
        farmer: { ...plainBody, farmerId: `MOB-${Date.now()}`, status: "Pending" },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        source: "demo",
        message: "Backend unavailable. Mobile submission simulated for demo.",
      },
      { status: 201 },
    );
  }
}
