export const ACRE_IN_SQ_METERS = 4046.86;
const METERS_PER_DEGREE_LAT = 111320;

export function acresToSquareMeters(acres) {
  const value = Number(acres);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value * ACRE_IN_SQ_METERS;
}

export function buildSquareBoundary(latitude, longitude, acres) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const areaSqM = acresToSquareMeters(acres);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || areaSqM <= 0) {
    return null;
  }

  const sideMeters = Math.sqrt(areaSqM);
  const halfSide = sideMeters / 2;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLat = halfSide / METERS_PER_DEGREE_LAT;
  const dLon = halfSide / (METERS_PER_DEGREE_LAT * Math.max(cosLat, 0.0001));

  return {
    sideMeters,
    areaSqMeters: areaSqM,
    positions: [
      [lat + dLat, lon - dLon],
      [lat + dLat, lon + dLon],
      [lat - dLat, lon + dLon],
      [lat - dLat, lon - dLon],
    ],
  };
}
