import DisasterAlertsWorkspace from "../../components/DisasterAlertsWorkspace";
import BackButton from "../../components/BackButton";

export default function PublicDisasterAlertsPage() {
  return (
    <main className="public-disaster-shell">
      <div className="public-disaster-container">
        <BackButton fallbackPath="/" />
        <DisasterAlertsWorkspace />
      </div>
    </main>
  );
}
