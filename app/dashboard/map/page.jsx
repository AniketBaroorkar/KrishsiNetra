"use client";

import dynamic from "next/dynamic";

const LiveCropMap = dynamic(() => import("./LiveCropMap"), {
  ssr: false,
  loading: () => <div className="map-canvas panel" />,
});

export default function MapPage() {
  return <LiveCropMap />;
}
