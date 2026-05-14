import DashboardNav from "../../components/DashboardNav";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-shell gov-dashboard-shell">
      <DashboardNav />
      <main className="dashboard-main gov-dashboard-main">{children}</main>
    </div>
  );
}
