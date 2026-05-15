import { Suspense } from "react";

import LocationCheckWorkspace from "../../../components/LocationCheckWorkspace";

export default function LocationCheckPage() {
  return (
    <Suspense fallback={<div className="gov-page">Loading location check...</div>}>
      <LocationCheckWorkspace />
    </Suspense>
  );
}
