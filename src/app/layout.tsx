import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BetslipProvider } from "@/components/betslip/betslip-context";
import { BetslipPanel } from "@/components/betslip/betslip-panel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fairline",
  description: "Sports betting research and analysis. 18+ only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BetslipProvider>
          <div className="flex min-h-full flex-1 flex-col pb-14 lg:mr-80 lg:pb-0">{children}</div>
          <BetslipPanel />
        </BetslipProvider>
      </body>
    </html>
  );
}
