import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BetslipProvider } from "@/components/betslip/betslip-context";
import { BetslipPanel } from "@/components/betslip/betslip-panel";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fairline",
  description: "Sports betting research and analysis. 18+ only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <BetslipProvider>
          <div className="flex min-h-full flex-1 flex-col pb-14 lg:mr-80 lg:pb-0">{children}</div>
          <BetslipPanel />
        </BetslipProvider>
      </body>
    </html>
  );
}
