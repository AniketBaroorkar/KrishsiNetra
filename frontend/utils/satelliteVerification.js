const DEFAULT_BASE_URL = "https://services.sentinel-hub.com";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80";
const FALLBACK_NDVI_IMAGE =
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80";

// Progressive search windows for "latest cloud-free Sentinel-2 image".
// We try the smallest window first and fall back to larger windows only if
// nothing usable is found. Anything older than 30 days triggers a warning.
const PROGRESSIVE_DAY_WINDOWS = [7, 15, 30, 60];
const STALE_AFTER_DAYS = 30;
const DEFAULT_MAX_CLOUD_COVERAGE = 35;

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

function daysBetween(from, to) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function classifyFreshness(imageAgeDays) {
  if (imageAgeDays === null || imageAgeDays === undefined || !Number.isFinite(imageAgeDays)) {
    return {
      freshnessStatus: "Unknown",
      isRecentImage: false,
      freshnessWarning:
        "Sentinel-2 image date could not be determined. Recommend field verification.",
    };
  }
  if (imageAgeDays <= 7) {
    return { freshnessStatus: "Fresh", isRecentImage: true, freshnessWarning: "" };
  }
  if (imageAgeDays <= 15) {
    return { freshnessStatus: "Recent", isRecentImage: true, freshnessWarning: "" };
  }
  if (imageAgeDays <= STALE_AFTER_DAYS) {
    return {
      freshnessStatus: "Usable but older",
      isRecentImage: true,
      freshnessWarning: `Latest cloud-free Sentinel-2 image is ${imageAgeDays} days old. Confirm with Sentinel-1 SAR or field officer if claim is time-sensitive.`,
    };
  }
  return {
    freshnessStatus: "Old image warning",
    isRecentImage: false,
    freshnessWarning:
      "The latest cloud-free Sentinel-2 image for this location is older than 30 days. Use Sentinel-1 SAR fallback or field verification.",
  };
}

export function getRiskFromNdvi(ndviScore, cloudCoverStatus = "Low") {
  const cloud = String(cloudCoverStatus).toLowerCase();
  if (cloud.includes("high") || cloud.includes("cloudy")) {
    return {
      riskLevel: "Medium Risk",
      riskReason:
        "Recent Sentinel-2 imagery is cloudy. Sentinel-1 SAR fallback is recommended because optical NDVI is uncertain.",
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

function buildSarFallback({ ndviScore, cloudy, freshnessStale, seed = 0.5 }) {
  const sarUsed = Boolean(cloudy || freshnessStale);
  const vv = Number((-9 - seed * 4).toFixed(2));
  const vh = Number((-15 - seed * 5).toFixed(2));
  const supportsActivity = ndviScore > 0.45 || (sarUsed && seed > 0.35);

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

function cloudCoverLabel(percent) {
  if (!Number.isFinite(percent)) return "Unknown";
  if (percent < 15) return "Low";
  if (percent < 40) return "Medium";
  return "High";
}

function cloudCoverStatusLabel(percent) {
  if (!Number.isFinite(percent)) return "Unknown cloud cover";
  if (percent < 15) return "Low cloud cover";
  if (percent < 40) return "Medium cloud cover";
  return "High cloud cover";
}

export function buildDemoSatelliteResult(input = {}) {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const referenceDate = input.submittedAt ? new Date(input.submittedAt) : new Date();

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
      cloudCoverPercent: null,
      cloudCoverStatus: "Unknown cloud cover",
      satelliteDate: null,
      imageAgeDays: null,
      freshnessStatus: "Unknown",
      isRecentImage: false,
      freshnessWarning: "GPS coordinates missing or invalid; cannot evaluate Sentinel-2 freshness.",
      searchWindowDays: null,
      opticalResult: "Uncertain",
      sentinel1Sar: buildSarFallback({ ndviScore: 0, cloudy: false, freshnessStale: true, seed: 0.2 }),
      riskLevel: "High Risk",
      riskReason: "Missing GPS coordinates prevent Sentinel-2 verification.",
      demoReason:
        "Demo satellite result shown because the provided GPS coordinates were missing or invalid.",
    };
  }

  const seed = Math.abs(Math.sin(latitude * 12.9898 + longitude * 78.233));
  const ndviScore = Number((0.18 + seed * 0.62).toFixed(2));
  const cloudCoverPercent = Math.round(seed * 70);
  const cloudCover = cloudCoverLabel(cloudCoverPercent);
  const cloudy = cloudCover === "High";

  // Use seed to vary the demo image age across the four buckets so the UI can
  // be demoed without real credentials. Maps to a deterministic 1..45 day age.
  const demoAge = Math.max(1, Math.round(seed * 45));
  const imageDate = new Date(referenceDate);
  imageDate.setDate(imageDate.getDate() - demoAge);
  const freshness = classifyFreshness(demoAge);
  const sentinel1Sar = buildSarFallback({
    ndviScore,
    cloudy,
    freshnessStale: !freshness.isRecentImage,
    seed,
  });
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
    cloudCoverPercent,
    cloudCoverStatus: cloudCoverStatusLabel(cloudCoverPercent),
    satelliteDate: imageDate.toISOString().slice(0, 10),
    imageAgeDays: demoAge,
    freshnessStatus: freshness.freshnessStatus,
    isRecentImage: freshness.isRecentImage,
    freshnessWarning: freshness.freshnessWarning,
    searchWindowDays: demoAge <= 7 ? 7 : demoAge <= 15 ? 15 : demoAge <= 30 ? 30 : 60,
    opticalResult: cloudy ? "Cloudy" : "Clear",
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

function buildBoundsPayload(latitude, longitude) {
  return {
    bbox: buildBoundingBox(latitude, longitude),
    properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
  };
}

function buildImagePayload({ latitude, longitude, dateFrom, dateTo, maxCloudCoverage, evalscript }) {
  return {
    input: {
      bounds: buildBoundsPayload(latitude, longitude),
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: { from: dateFrom, to: dateTo },
            maxCloudCoverage,
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
    evalscript,
  };
}

const TRUE_COLOR_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02, 1];
}`;

const NDVI_EVALSCRIPT = `//VERSION=3
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
}`;

function buildNdviStatsPayload({ latitude, longitude, dateFrom, dateTo, maxCloudCoverage }) {
  return {
    input: {
      bounds: buildBoundsPayload(latitude, longitude),
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: { mosaickingOrder: "leastCC", maxCloudCoverage },
        },
      ],
    },
    aggregation: {
      timeRange: { from: dateFrom, to: dateTo },
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

// Catalog API search to find the most recent cloud-filtered scene in the
// given window. Returns { date, cloudCoverPercent } or null when no scene
// matches the filter.
async function findLatestScene({ baseUrl, token, latitude, longitude, dateFrom, dateTo, maxCloudCoverage }) {
  const bbox = buildBoundingBox(latitude, longitude);
  const response = await fetch(`${baseUrl}/api/v1/catalog/1.0.0/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      bbox,
      datetime: `${dateFrom}/${dateTo}`,
      collections: ["sentinel-2-l2a"],
      limit: 25,
    }),
  });
  if (!response.ok) {
    throw new Error(`Sentinel Catalog API failed with ${response.status}`);
  }
  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  const usable = features.filter((feature) => {
    const cc = feature?.properties?.["eo:cloud_cover"];
    return typeof cc === "number" && cc <= maxCloudCoverage;
  });
  if (!usable.length) return null;
  usable.sort(
    (a, b) =>
      new Date(b.properties.datetime).getTime() - new Date(a.properties.datetime).getTime(),
  );
  const best = usable[0];
  const isoDate = best.properties.datetime;
  return {
    date: isoDate.slice(0, 10),
    isoDateTime: isoDate,
    cloudCoverPercent: best.properties["eo:cloud_cover"],
  };
}

function isoDayOffset(reference, days) {
  const dt = new Date(reference);
  dt.setDate(dt.getDate() - days);
  return dt.toISOString();
}

async function searchProgressively({
  baseUrl,
  token,
  latitude,
  longitude,
  referenceDate,
  maxCloudCoverage,
}) {
  for (const days of PROGRESSIVE_DAY_WINDOWS) {
    const dateFrom = isoDayOffset(referenceDate, days);
    const dateTo = referenceDate.toISOString();
    try {
      const scene = await findLatestScene({
        baseUrl,
        token,
        latitude,
        longitude,
        dateFrom,
        dateTo,
        maxCloudCoverage,
      });
      if (scene) {
        return { scene, windowDays: days };
      }
    } catch {
      // try next window
    }
  }
  return { scene: null, windowDays: PROGRESSIVE_DAY_WINDOWS[PROGRESSIVE_DAY_WINDOWS.length - 1] };
}

export async function verifyWithSentinelHub(input = {}) {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const baseUrl = process.env.SENTINEL_BASE_URL || DEFAULT_BASE_URL;
  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;
  const maxCloudCoverage = Number.isFinite(Number(input.maxCloudCoverage))
    ? Number(input.maxCloudCoverage)
    : DEFAULT_MAX_CLOUD_COVERAGE;

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

  const referenceDate = new Date();

  try {
    const token = await getSentinelToken({ clientId, clientSecret, baseUrl });

    // Step 1: find the latest usable scene. If dateFrom + dateTo are passed
    // explicitly (manual override), only search that single window.
    let scene = null;
    let windowDays = null;
    if (input.dateFrom && input.dateTo) {
      try {
        scene = await findLatestScene({
          baseUrl,
          token,
          latitude,
          longitude,
          dateFrom: new Date(input.dateFrom).toISOString(),
          dateTo: new Date(input.dateTo).toISOString(),
          maxCloudCoverage,
        });
      } catch {
        scene = null;
      }
      const span = Math.round(
        (new Date(input.dateTo).getTime() - new Date(input.dateFrom).getTime()) / 86400000,
      );
      windowDays = Number.isFinite(span) ? Math.max(1, span) : null;
    } else {
      const progressive = await searchProgressively({
        baseUrl,
        token,
        latitude,
        longitude,
        referenceDate,
        maxCloudCoverage,
      });
      scene = progressive.scene;
      windowDays = progressive.windowDays;
    }

    // Step 2: fetch images + NDVI stats for the resolved scene window. If no
    // scene was found, expand to the largest fallback window so we still
    // return something visual, but mark freshness as old.
    const fetchFrom = scene
      ? isoDayOffset(new Date(`${scene.date}T00:00:00Z`), 1)
      : isoDayOffset(referenceDate, PROGRESSIVE_DAY_WINDOWS[PROGRESSIVE_DAY_WINDOWS.length - 1]);
    const fetchTo = scene
      ? isoDayOffset(new Date(`${scene.date}T23:59:59Z`), -1)
      : referenceDate.toISOString();

    const trueColorPromise = fetchProcessImage({
      baseUrl,
      token,
      payload: buildImagePayload({
        latitude,
        longitude,
        dateFrom: fetchFrom,
        dateTo: fetchTo,
        maxCloudCoverage,
        evalscript: TRUE_COLOR_EVALSCRIPT,
      }),
    }).catch(() => null);

    const ndviPromise = fetchProcessImage({
      baseUrl,
      token,
      payload: buildImagePayload({
        latitude,
        longitude,
        dateFrom: fetchFrom,
        dateTo: fetchTo,
        maxCloudCoverage,
        evalscript: NDVI_EVALSCRIPT,
      }),
    }).catch(() => null);

    const statsPromise = fetchNdviStats({
      baseUrl,
      token,
      payload: buildNdviStatsPayload({
        latitude,
        longitude,
        dateFrom: fetchFrom,
        dateTo: fetchTo,
        maxCloudCoverage,
      }),
    }).catch(() => null);

    const [satelliteImageUrl, ndviImageUrl, ndviStats] = await Promise.all([
      trueColorPromise,
      ndviPromise,
      statsPromise,
    ]);

    const stats = ndviStats ? extractNdviFromStats(ndviStats) : { ndvi: null, date: null };
    const fallbackNdvi = buildDemoSatelliteResult(input).ndviScore;
    const ndviScore = Number.isFinite(stats.ndvi) ? stats.ndvi : fallbackNdvi;
    const satelliteDate = scene?.date || stats.date || null;
    const imageAgeDays = satelliteDate
      ? daysBetween(new Date(`${satelliteDate}T12:00:00Z`), referenceDate)
      : null;
    const freshness = classifyFreshness(imageAgeDays);

    const cloudCoverPercent = Number.isFinite(scene?.cloudCoverPercent)
      ? Math.round(scene.cloudCoverPercent)
      : null;
    const cloudCover = cloudCoverLabel(cloudCoverPercent);
    const cloudy = cloudCover === "High";
    const cloudCoverStatus = cloudCoverStatusLabel(cloudCoverPercent);
    const { riskLevel, riskReason } = getRiskFromNdvi(ndviScore, cloudCover);

    return {
      source: "sentinel-2",
      isDemo: false,
      satelliteImageUrl: satelliteImageUrl || FALLBACK_IMAGE,
      ndviImageUrl: ndviImageUrl || FALLBACK_NDVI_IMAGE,
      ndviScore,
      vegetationStatus: buildVegetationStatus(ndviScore),
      cropHealth: buildCropHealth(ndviScore),
      cloudCover,
      cloudCoverPercent,
      cloudCoverStatus,
      satelliteDate,
      imageAgeDays,
      freshnessStatus: freshness.freshnessStatus,
      isRecentImage: freshness.isRecentImage,
      freshnessWarning: freshness.freshnessWarning,
      searchWindowDays: windowDays,
      opticalResult: cloudy ? "Cloudy" : "Clear",
      sentinel1Sar: buildSarFallback({
        ndviScore,
        cloudy,
        freshnessStale: !freshness.isRecentImage,
        seed: 0.62,
      }),
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
