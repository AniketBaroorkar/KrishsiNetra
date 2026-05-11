import "./globals.css";

export const metadata = {
  title: "KrishiNetra Government Dashboard",
  description: "AI and satellite-based crop fraud monitoring dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
