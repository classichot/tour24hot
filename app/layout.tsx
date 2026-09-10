import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, Noto_Sans, Noto_Sans_SC, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import AppChrome from "@/components/AppChrome";

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

const noto = Noto_Sans({
  variable: "--font-noto",
  weight: ["400", "600", "800"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "TOUR24 — Compare by humans. Discoverable by AI.",
  description:
    "TOUR24 is AI-native distribution and comparison infrastructure for certified package tours. Humans compare. AI agents discover. Travelers book direct with verified operators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${notoThai.variable} ${notoSc.variable} ${noto.variable}`}>
      <body>
        <Suspense>
          <AppProvider>
            <div className="min-h-screen bg-bg text-text flex flex-col">
              <AppChrome>{children}</AppChrome>
            </div>
          </AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
