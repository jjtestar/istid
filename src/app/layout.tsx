import type { Metadata, Viewport } from "next";
import { Barlow } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { PwaProvider } from "@/components/PwaProvider";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Istid",
  description: "Anmälan till träningar och matcher, samt statistik.",
  applicationName: "Istid",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Istid", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <PwaProvider>
          <div className="app-background" aria-hidden="true" />
          <div className="relative z-[1] mx-auto flex w-full max-w-md flex-1 flex-col">
            {children}
          </div>
          <BottomNav />
        </PwaProvider>
      </body>
    </html>
  );
}
