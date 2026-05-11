import DashboardNav from "../../components/DashboardNav";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-shell">
      <DashboardNav />
      <main className="dashboard-main">
        <Link className="back-home" href="/">
          ← Back to Home
        </Link>
        {children}
      </main>
    </div>
  );
}
