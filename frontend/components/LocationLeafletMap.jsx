"use client";

import { useEffect, useMemo } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

function MapUpdater({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      map.setView([latitude, longitude], 16, { animate: true });
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function LocationLeafletMap({ latitude, longitude, cropType, farmerName, village, district, surveyNumber }) {
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

  return (
    <MapContainer center={position} zoom={16} scrollWheelZoom className="location-check-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
