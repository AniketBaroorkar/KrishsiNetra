import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import DisasterAlertsWorkspace from "../../components/DisasterAlertsWorkspace";

export default function PublicDisasterAlertsPage() {
  return (
    <div className="dashboard-shell-stacked">
      <SiteHeader />
      <main className="dashboard-main-stacked">
        <DisasterAlertsWorkspace />
      </main>
      <SiteFooter />
    </div>
  );
}
