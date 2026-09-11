import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Istid",
  description: "Anmälan till träningar och matcher, samt statistik.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
