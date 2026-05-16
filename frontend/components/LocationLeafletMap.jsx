"use client";

import { useEffect, useMemo } from "react";
import { divIcon } from "leaflet";
import { ImageOverlay, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

function MapUpdater({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      map.setView([latitude, longitude], 16, { animate: true });
    }
  }, [latitude, longitude, map]);

  return null;
}

const STREET_TILE = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

const SATELLITE_TILE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
};

export default function LocationLeafletMap({
  latitude,
  longitude,
  cropType,
  farmerName,
  village,
  district,
  surveyNumber,
  mapLayer = "street",
  satelliteImageUrl,
  ndviImageUrl,
}) {
  const position = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude, longitude]
    : [18.5204, 73.8567];

  const marker = useMemo(() => divIcon({
    className: "",
    html: '<span class="location-check-marker"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  }), []);

  const bbox = useMemo(() => {
    const size = 0.005;
    return [
      [position[0] - size, position[1] - size],
      [position[0] + size, position[1] + size],
    ];
  }, [position]);

  const baseTile = mapLayer === "street" ? STREET_TILE : SATELLITE_TILE;
  const showSentinelOverlay = mapLayer === "sentinel" && satelliteImageUrl;
  const showNdviOverlay = mapLayer === "ndvi" && ndviImageUrl;

  return (
    <MapContainer center={position} zoom={16} scrollWheelZoom className="location-check-map">
      <TileLayer
        key={mapLayer === "street" ? "street" : "satellite"}
        attribution={baseTile.attribution}
        url={baseTile.url}
      />
      {showSentinelOverlay ? (
        <ImageOverlay url={satelliteImageUrl} bounds={bbox} opacity={0.9} />
      ) : null}
      {showNdviOverlay ? (
        <ImageOverlay url={ndviImageUrl} bounds={bbox} opacity={0.75} />
      ) : null}
      <MapUpdater latitude={position[0]} longitude={position[1]} />
      <Marker icon={marker} position={position}>
        <Popup>
          <div className="location-popup">
            {farmerName ? <strong>{farmerName}</strong> : null}
            {cropType ? <span>Crop Type: {cropType}</span> : null}
            {village ? <span>Village: {village}</span> : null}
            {district ? <span>District: {district}</span> : null}
            {surveyNumber ? <span>Survey Number: {surveyNumber}</span> : null}
            <span>Latitude: {position[0]}</span>
            <span>Longitude: {position[1]}</span>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
