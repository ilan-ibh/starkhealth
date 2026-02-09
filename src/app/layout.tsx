import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stark Health — Your Health, Unified",
  description:
    "Aggregate all your health data in one place. WHOOP, Withings, DNA, gym data and more — coming soon.",
  openGraph: {
    title: "Stark Health — Your Health, Unified",
    description:
      "Aggregate all your health data in one place. WHOOP, Withings, DNA, gym data and more.",
    url: "https://starkhealth.io",
    siteName: "Stark Health",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased grain`}
      >
        {children}
      </body>
    </html>
  );
}
