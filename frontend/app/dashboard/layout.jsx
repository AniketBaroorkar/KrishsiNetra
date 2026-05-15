import DashboardNav from "../../components/DashboardNav";
import BackButton from "../../components/BackButton";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-shell gov-dashboard-shell">
      <DashboardNav />
      <main className="dashboard-main gov-dashboard-main">
        <div className="dashboard-content-container">
          <BackButton fallbackPath="/dashboard" />
          {children}
        </div>
      </main>
    </div>
  );
}
