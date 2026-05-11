import os
from datetime import date, timedelta
from io import BytesIO

import numpy as np
import requests
import tifffile


TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/"
    "protocol/openid-connect/token"
)
PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
COPERNICUS_BROWSER_URL = "https://browser.dataspace.copernicus.eu/"


class SatelliteServiceError(RuntimeError):
    pass


def _get_required_env(name):
    value = os.getenv(name)
    if not value:
        raise SatelliteServiceError(f"Environment variable {name} is required.")
    return value


def _get_access_token():
    response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": _get_required_env("COPERNICUS_CLIENT_ID"),
            "client_secret": _get_required_env("COPERNICUS_CLIENT_SECRET"),
        },
        timeout=30,
    )
    if response.status_code >= 400:
        raise SatelliteServiceError(
            f"Copernicus authentication failed: {response.status_code} {response.text}"
        )
    return response.json()["access_token"]


def _bbox_from_point(gps_lat, gps_lon, half_size_degrees=0.002):
    lat = float(gps_lat)
    lon = float(gps_lon)
    return [
        lon - half_size_degrees,
        lat - half_size_degrees,
        lon + half_size_degrees,
        lat + half_size_degrees,
    ]


def _sentinel_payload(gps_lat, gps_lon, days_back=30, image_size=64):
    end_date = date.today()
    start_date = end_date - timedelta(days=days_back)

    evalscript = """
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "dataMask"],
      units: "REFLECTANCE"
    }],
    output: {
      bands: 3,
      sampleType: "FLOAT32"
    }
  };
}

function evaluatePixel(sample) {
  return [sample.B04, sample.B08, sample.dataMask];
}
"""

    return {
        "input": {
            "bounds": {
                "bbox": _bbox_from_point(gps_lat, gps_lon),
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"},
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{start_date.isoformat()}T00:00:00Z",
                            "to": f"{end_date.isoformat()}T23:59:59Z",
                        },
                        "mosaickingOrder": "leastCC",
                        "maxCloudCoverage": 30,
                    },
                }
            ],
        },
        "output": {
            "width": image_size,
            "height": image_size,
            "responses": [
                {
                    "identifier": "default",
                    "format": {"type": "image/tiff"},
                }
            ],
        },
        "evalscript": evalscript,
    }


def _download_red_nir(gps_lat, gps_lon):
    token = _get_access_token()
    response = requests.post(
        PROCESS_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "image/tiff",
        },
        json=_sentinel_payload(gps_lat, gps_lon),
        timeout=90,
    )
    if response.status_code >= 400:
        raise SatelliteServiceError(
            f"Sentinel-2 Process API failed: {response.status_code} {response.text}"
        )

    image = tifffile.imread(BytesIO(response.content))
    if image.ndim != 3 or image.shape[-1] < 3:
        raise SatelliteServiceError("Sentinel-2 response did not contain Red, NIR, and mask bands.")

    red = image[:, :, 0].astype(np.float32)
    nir = image[:, :, 1].astype(np.float32)
    mask = image[:, :, 2] > 0
    return red, nir, mask


def calculate_ndvi(red, nir, mask):
    denominator = nir + red
    valid = mask & np.isfinite(denominator) & (np.abs(denominator) > 1e-6)
    if not np.any(valid):
        raise SatelliteServiceError("No valid Sentinel-2 pixels found for the requested location.")

    ndvi_pixels = (nir[valid] - red[valid]) / denominator[valid]
    ndvi_pixels = ndvi_pixels[np.isfinite(ndvi_pixels)]
    if ndvi_pixels.size == 0:
        raise SatelliteServiceError("Unable to calculate NDVI from Sentinel-2 pixels.")

    return round(float(np.mean(ndvi_pixels)), 4)


def build_satellite_image_url(gps_lat, gps_lon):
    lat = float(gps_lat)
    lon = float(gps_lon)
    return f"{COPERNICUS_BROWSER_URL}?zoom=15&lat={lat:.6f}&lng={lon:.6f}"


def fetch_satellite_ndvi(gps_lat, gps_lon):
    red, nir, mask = _download_red_nir(gps_lat, gps_lon)
    return {
        "ndvi": calculate_ndvi(red=red, nir=nir, mask=mask),
        "satellite_image_url": build_satellite_image_url(gps_lat, gps_lon),
    }
