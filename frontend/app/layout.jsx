import "./globals.css";
import "./platform-polish.css";
import { LanguageProvider } from "../components/LanguageProvider";

export const metadata = {
  title: "KrishiNetra Government Dashboard",
  description: "AI and satellite-based crop fraud monitoring dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
