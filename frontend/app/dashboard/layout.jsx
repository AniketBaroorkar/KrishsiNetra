import SiteHeader from "../../components/SiteHeader";
import DashboardSubNav from "../../components/DashboardSubNav";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-shell-stacked">
      <SiteHeader />
      <DashboardSubNav />
      <main className="dashboard-main-stacked">{children}</main>
    </div>
  );
}
