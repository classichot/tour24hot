import type { Metadata } from "next";
import { Archivo, Noto_Sans_SC, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompareTray from "@/components/CompareTray";

const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["400", "600", "800"],
  subsets: ["latin"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  weight: ["400", "600", "800"],
  subsets: ["thai", "latin"],
});

const notoSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "600", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOUR24 — Compare by humans. Discoverable by AI.",
  description:
    "TOUR24 is AI-native distribution and comparison infrastructure for certified package tours. Humans compare. AI agents discover. Travelers book direct with verified operators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${notoThai.variable} ${notoSc.variable}`}>
      <body>
        <AppProvider>
          <div className="min-h-screen bg-bg text-text flex flex-col">
            <Header />
            {children}
            <Footer />
            <CompareTray />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
