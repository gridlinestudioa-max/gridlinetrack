import type { Metadata, Viewport } from "next";
import { fontVars } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Gridline Track", template: "%s" },
  description: "Websites and race-night promotion for short tracks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" style={fontVars("oswald-inter")}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
