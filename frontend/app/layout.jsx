import "./globals.css";
import "./platform-polish.css";
import { Inter } from "next/font/google";
import { LanguageProvider } from "../components/LanguageProvider";
import { ToastProvider } from "../components/ToastProvider";
import ContactFab from "../components/ContactFab";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "KrishiNetra Government Dashboard",
  description: "AI and satellite-based crop fraud monitoring dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <LanguageProvider>
          <ToastProvider>
            {children}
            <ContactFab />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
