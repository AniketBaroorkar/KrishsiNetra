import { NextResponse } from "next/server";

import {
  buildDemoSatelliteResult,
  isValidCoordinate,
  verifyWithSentinelHub,
} from "../../../../utils/satelliteVerification";

export async function POST(request) {
  try {
    const body = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!isValidCoordinate(latitude, longitude)) {
      return NextResponse.json(
        {
          ...buildDemoSatelliteResult({ latitude, longitude }),
          demoReason:
            "Demo satellite result shown because the provided latitude or longitude was invalid.",
        },
        { status: 200 },
      );
    }

    const result = await verifyWithSentinelHub({
      farmerId: body.farmerId,
      latitude,
      longitude,
      cropType: body.cropType,
      submittedAt: body.submittedAt,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ...buildDemoSatelliteResult({}),
        demoReason: `Demo satellite result shown because Sentinel API credentials are not configured (${error.message}).`,
      },
      { status: 200 },
    );
  }
}
