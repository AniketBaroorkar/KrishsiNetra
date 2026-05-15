import { NextResponse } from "next/server";

import { isValidCoordinate, verifyWithSentinelHub } from "../../../../utils/satelliteVerification";

export async function POST(request) {
  try {
    const body = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!isValidCoordinate(latitude, longitude)) {
      const result = await verifyWithSentinelHub({ ...body, latitude, longitude });
      return NextResponse.json(result, { status: 200 });
    }

    const result = await verifyWithSentinelHub({
      farmerId: body.farmerId,
      latitude,
      longitude,
      cropType: body.cropType,
      submittedAt: body.submittedAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ndviScore: 0.63,
        vegetationStatus: "Healthy vegetation detected",
        cropHealth: "Good",
        satelliteDate: "Recent Sentinel-2 image",
        cloudCoverStatus: "Low cloud cover",
        riskLevel: "Low Risk",
        riskReason: "Satellite NDVI indicates healthy crop vegetation.",
        isDemo: true,
        demoReason: `Demo satellite result shown because request handling failed: ${error.message}`,
      },
      { status: 200 },
    );
  }
}
