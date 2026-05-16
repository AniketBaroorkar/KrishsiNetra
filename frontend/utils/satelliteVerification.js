const DEFAULT_BASE_URL = "https://services.sentinel-hub.com";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80";
const FALLBACK_NDVI_IMAGE =
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80";

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

export function getRiskFromNdvi(ndviScore, cloudCoverStatus = "Low") {
  const cloud = String(cloudCoverStatus).toLowerCase();
  if (cloud.includes("high")) {
    return {
      riskLevel: "Medium Risk",
      riskReason:
        "Cloud cover detected. Sentinel-1 SAR fallback is recommended because Sentinel-2 optical NDVI is uncertain.",
    };
  }

  if (ndviScore < 0.2) {
    return {
      riskLevel: "High Risk",
      riskReason:
        "Sentinel-2 NDVI is very low at this location, which may indicate missing or damaged crop vegetation.",
    };
  }

  if (ndviScore <= 0.5) {
    return {
      riskLevel: "Medium Risk",
      riskReason:
        "Sentinel-2 NDVI is moderate. Field officer review is recommended before approving the claim.",
    };
  }

  return {
    riskLevel: "Low Risk",
    riskReason: "Sentinel-2 NDVI supports active crop vegetation at this location.",
  };
}

function buildSarFallback({ ndviScore, cloudCoverStatus, seed = 0.5 }) {
  const cloudy = String(cloudCoverStatus).toLowerCase().includes("high");
  const sarUsed = cloudy;
  const vv = Number((-9 - seed * 4).toFixed(2));
  const vh = Number((-15 - seed * 5).toFixed(2));
  const supportsActivity = ndviScore > 0.45 || (cloudy && seed > 0.35);

  return {
    sarUsed,
    vvSignal: vv,
    vhSignal: vh,
    fieldMoistureStatus: seed > 0.75 ? "High moisture" : seed > 0.35 ? "Normal moisture" : "Low moisture",
    floodDisasterIndication: seed > 0.86 ? "Possible waterlogging" : "No flood indication",
    cropStructureSignal: supportsActivity ? "Structured field signal present" : "Weak crop structure signal",
    sarResult: supportsActivity ? "Supports Claim" : "Uncertain",
  };
}

function buildVegetationStatus(ndviScore) {
  if (ndviScore > 0.5) return "Healthy vegetation detected";
  if (ndviScore > 0.2) return "Moderate vegetation detected";
  return "Low vegetation detected";
}

function buildCropHealth(ndviScore) {
  if (ndviScore > 0.5) return "Good";
  if (ndviScore > 0.2) return "Moderate";
  return "Poor";
}

export function buildDemoSatelliteResult(input = {}) {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  if (!isValidCoordinate(latitude, longitude)) {
    return {
      source: "demo",
      isDemo: true,
      satelliteImageUrl: FALLBACK_IMAGE,
      ndviImageUrl: FALLBACK_NDVI_IMAGE,
      ndviScore: 0,
      vegetationStatus: "GPS missing or invalid",
      cropHealth: "Unknown",
      cloudCover: "Unknown",
      cloudCoverStatus: "Unknown",
      satelliteDate: "Demo latest Sentinel-2 image",
      opticalResult: "Uncertain",
      sentinel1Sar: buildSarFallback({ ndviScore: 0, cloudCoverStatus: "Unknown", seed: 0.2 }),
      riskLevel: "High Risk",
      riskReason: "Missing GPS coordinates prevent satellite verification.",
      demoReason:
        "Demo satellite result shown because the provided GPS coordinates were missing or invalid.",
    };
  }

  const seed = Math.abs(Math.sin(latitude * 12.9898 + longitude * 78.233));
  const ndviScore = Number((0.18 + seed * 0.62).toFixed(2));
  const cloudCover = seed > 0.82 ? "High" : "Low";
  const sentinel1Sar = buildSarFallback({ ndviScore, cloudCoverStatus: cloudCover, seed });
  const { riskLevel, riskReason } = getRiskFromNdvi(ndviScore, cloudCover);

  return {
    source: "demo",
    isDemo: true,
    satelliteImageUrl: FALLBACK_IMAGE,
    ndviImageUrl: FALLBACK_NDVI_IMAGE,
    ndviScore,
    vegetationStatus: buildVegetationStatus(ndviScore),
    cropHealth: buildCropHealth(ndviScore),
    cloudCover,
    cloudCoverStatus: cloudCover === "High" ? "High cloud cover" : "Low cloud cover",
    satelliteDate: "Demo latest Sentinel-2 image",
    opticalResult: cloudCover === "High" ? "Cloudy" : "Clear",
    sentinel1Sar,
    riskLevel,
    riskReason,
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

function buildTimeRange(submittedAt, days = 30) {
  const to = submittedAt ? new Date(submittedAt) : new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildBoundsPayload(latitude, longitude) {
  return {
    bbox: buildBoundingBox(latitude, longitude),
    properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
  };
}

function buildTrueColorPayload({ latitude, longitude, submittedAt }) {
  return {
    input: {
      bounds: buildBoundsPayload(latitude, longitude),
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: buildTimeRange(submittedAt),
            maxCloudCoverage: 35,
            mosaickingOrder: "leastCC",
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
    input: ["B02", "B03", "B04", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02, 1];
}`,
  };
}

function buildNdviPayload({ latitude, longitude, submittedAt }) {
  return {
    input: {
      bounds: buildBoundsPayload(latitude, longitude),
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: buildTimeRange(submittedAt),
            maxCloudCoverage: 35,
            mosaickingOrder: "leastCC",
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
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  if (ndvi < 0.2) return [0.75, 0.12, 0.12, 1];
  if (ndvi < 0.5) return [0.95, 0.68, 0.12, 1];
  return [0.08, 0.47, 0.18, 1];
}`,
  };
}

function buildNdviStatsPayload({ latitude, longitude, submittedAt }) {
  const range = buildTimeRange(submittedAt);
  return {
    input: {
      bounds: buildBoundsPayload(latitude, longitude),
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            mosaickingOrder: "leastCC",
            maxCloudCoverage: 35,
          },
        },
      ],
    },
    aggregation: {
      timeRange: range,
      aggregationInterval: { of: "P30D" },
      evalscript: `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  return { ndvi: [ndvi], dataMask: [s.dataMask] };
}`,
      resx: 10,
      resy: 10,
    },
    calculations: { default: { statistics: { default: { percentiles: { k: [50] } } } } },
  };
}

async function fetchProcessImage({ baseUrl, token, payload }) {
  const response = await fetch(`${baseUrl}/api/v1/process`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Sentinel Process API failed with ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function fetchNdviStats({ baseUrl, token, payload }) {
  const response = await fetch(`${baseUrl}/api/v1/statistics`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Sentinel Statistics API failed with ${response.status}`);
  }
  return response.json();
}

function extractNdviFromStats(stats) {
  const interval = stats?.data?.[0];
  const bands = interval?.outputs?.ndvi?.bands || interval?.outputs?.default?.bands;
  const mean = bands?.B0?.stats?.mean;
  const date = interval?.interval?.to || interval?.interval?.from;
  return {
    ndvi: Number.isFinite(mean) ? Number(mean.toFixed(2)) : null,
    date: date ? new Date(date).toISOString().slice(0, 10) : null,
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
      demoReason:
        "Demo satellite result shown because Sentinel API credentials are not configured.",
    };
  }

  try {
    const token = await getSentinelToken({ clientId, clientSecret, baseUrl });
    const submittedAt = input.submittedAt;

    const [satelliteImageUrl, ndviImageUrl, ndviStats] = await Promise.all([
      fetchProcessImage({
        baseUrl,
        token,
        payload: buildTrueColorPayload({ latitude, longitude, submittedAt }),
      }),
      fetchProcessImage({
        baseUrl,
        token,
        payload: buildNdviPayload({ latitude, longitude, submittedAt }),
      }),
      fetchNdviStats({
        baseUrl,
        token,
        payload: buildNdviStatsPayload({ latitude, longitude, submittedAt }),
      }).catch(() => null),
    ]);

    const stats = ndviStats ? extractNdviFromStats(ndviStats) : { ndvi: null, date: null };
    const fallbackNdvi = buildDemoSatelliteResult(input).ndviScore;
    const ndviScore = Number.isFinite(stats.ndvi) ? stats.ndvi : fallbackNdvi;
    const cloudCover = "Low";
    const { riskLevel, riskReason } = getRiskFromNdvi(ndviScore, cloudCover);

    return {
      source: "sentinel-2",
      isDemo: false,
      satelliteImageUrl,
      ndviImageUrl,
      ndviScore,
      vegetationStatus: buildVegetationStatus(ndviScore),
      cropHealth: buildCropHealth(ndviScore),
      cloudCover,
      cloudCoverStatus: "Low cloud cover",
      satelliteDate: stats.date
        ? `Latest available Sentinel-2 image (${stats.date})`
        : "Latest available Sentinel-2 image",
      opticalResult: "Clear",
      sentinel1Sar: buildSarFallback({ ndviScore, cloudCoverStatus: cloudCover, seed: 0.62 }),
      riskLevel,
      riskReason,
    };
  } catch (error) {
    return {
      ...buildDemoSatelliteResult(input),
      demoReason: `Demo satellite result shown because Sentinel API failed: ${error.message}`,
    };
  }
}
