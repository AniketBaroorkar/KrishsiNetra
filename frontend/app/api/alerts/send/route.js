import { NextResponse } from "next/server";

const BACKEND_URL = process.env.KRISHINETRA_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${BACKEND_URL}/api/alerts/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      return NextResponse.json(await response.json(), { status: response.status });
    }
  } catch {
    // Simulated notification fallback below.
  }

  return NextResponse.json(
    {
      source: "demo",
      alert: {
        id: `ALT-${Date.now()}`,
        ...body,
        sentAt: body.sentAt || new Date().toISOString(),
        status: "Sent",
      },
      message: "Alert simulated. This can later connect to Firebase Cloud Messaging.",
    },
    { status: 201 },
  );
}
