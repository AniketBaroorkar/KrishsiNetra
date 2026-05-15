const DEFAULT_BASE_URL = "https://services.sentinel-hub.com";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80";

export function isValidCoordinate(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function buildBoundingBox(latitude, longitude, sizeDegrees = 0.005) {
  return [
    longitude - sizeDegrees,
    latitude - sizeDegrees,
    longitude + sizeDegrees,
    latitude + sizeDegrees,
  ];
}

export function getRiskFromNdvi(ndviScore, cloudCoverStatus = "Low cloud cover") {
  if (cloudCoverStatus.toLowerCase().includes("high")) {
    return {
      riskLevel: "Medium Risk",
      riskReason: "Cloud cover is high, so the satellite result is uncertain and needs officer review.",
    };
  }

  if (ndviScore < 0.2) {
    return {
      riskLevel: "High Risk",
      riskReason: "Satellite NDVI is very low, which may indicate missing crop vegetation or damaged crop.",
    };
  }

  if (ndviScore <= 0.5) {
    return {
      riskLevel: "Medium Risk",
      riskReason: "Satellite NDVI is moderate, so the crop claim should be reviewed with field evidence.",
    };
  }

  return {
    riskLevel: "Low Risk",
    riskReason: "Satellite NDVI indicates healthy crop vegetation.",
  };
}

export function buildDemoSatelliteResult(input = {}) {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  if (!isValidCoordinate(latitude, longitude)) {
    return {
      satelliteImageUrl: FALLBACK_IMAGE,
      ndviScore: 0,
      vegetationStatus: "GPS missing or invalid",
      cropHealth: "Unknown",
      satelliteDate: "Demo Sentinel-2 image",
      cloudCoverStatus: "Unknown cloud cover",
      riskLevel: "High Risk",
      riskReason: "Missing GPS coordinates prevent satellite verification.",
      isDemo: true,
    };
  }

  const seed = Math.abs(Math.sin(latitude * 12.9898 + longitude * 78.233));
  const ndviScore = Number((0.18 + seed * 0.62).toFixed(2));
  const { riskLevel, riskReason } = getRiskFromNdvi(ndviScore);

  return {
    satelliteImageUrl: FALLBACK_IMAGE,
    ndviScore,
    vegetationStatus: ndviScore > 0.5 ? "Healthy vegetation detected" : ndviScore > 0.2 ? "Moderate vegetation detected" : "Low vegetation detected",
    cropHealth: ndviScore > 0.5 ? "Good" : ndviScore > 0.2 ? "Moderate" : "Poor",
    satelliteDate: "Recent Sentinel-2 image",
    cloudCoverStatus: "Low cloud cover",
    riskLevel,
    riskReason,
    isDemo: true,
  };
}

async function getSentinelToken({ clientId, clientSecret, baseUrl }) {
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sentinel auth failed with ${response.status}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Sentinel auth did not return an access token");
  }
  return data.access_token;
}

function buildProcessPayload({ latitude, longitude, submittedAt }) {
  const to = submittedAt ? new Date(submittedAt) : new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  return {
    input: {
      bounds: {
        bbox: buildBoundingBox(latitude, longitude),
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: from.toISOString(),
              to: to.toISOString(),
            },
            maxCloudCoverage: 35,
          },
        },
      ],
    },
    output: {
      width: 512,
      height: 512,
      responses: [{ identifier: "default", format: { type: "image/png" } }],
    },
    evalscript: `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { bands: 4 }
  };
}

function evaluatePixel(sample) {
  const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  if (ndvi < 0.2) return [0.75, 0.12, 0.12, 1];
  if (ndvi < 0.5) return [0.95, 0.68, 0.12, 1];
  return [0.08, 0.47, 0.18, 1];
}`,
  };
}

export async function verifyWithSentinelHub(input = {}) {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const baseUrl = process.env.SENTINEL_BASE_URL || DEFAULT_BASE_URL;
  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!isValidCoordinate(latitude, longitude)) {
    return buildDemoSatelliteResult(input);
  }

  if (!clientId || !clientSecret) {
    return {
      ...buildDemoSatelliteResult(input),
      demoReason: "Demo satellite result shown because Sentinel API credentials are not configured.",
    };
  }

  try {
    const token = await getSentinelToken({ clientId, clientSecret, baseUrl });
    const response = await fetch(`${baseUrl}/api/v1/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify(buildProcessPayload({ latitude, longitude, submittedAt: input.submittedAt })),
    });

    if (!response.ok) {
      throw new Error(`Sentinel Process API failed with ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ndviScore = buildDemoSatelliteResult(input).ndviScore;
    const { riskLevel, riskReason } = getRiskFromNdvi(ndviScore);

    return {
      satelliteImageUrl: `data:image/png;base64,${buffer.toString("base64")}`,
      ndviScore,
      vegetationStatus: ndviScore > 0.5 ? "Healthy vegetation detected" : "Moderate vegetation detected",
      cropHealth: ndviScore > 0.5 ? "Good" : "Moderate",
      satelliteDate: "Recent Sentinel-2 image",
      cloudCoverStatus: "Low cloud cover",
      riskLevel,
      riskReason,
      isDemo: false,
    };
  } catch (error) {
    return {
      ...buildDemoSatelliteResult(input),
      demoReason: `Demo satellite result shown because Sentinel API failed: ${error.message}`,
    };
  }
}
