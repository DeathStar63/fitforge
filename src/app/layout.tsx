import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import { PlanProvider } from "@/context/PlanContext";
import { ICON_VERSION } from "@/lib/icon-version";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/**
 * Icon filenames carry a digest of the artwork.
 *
 * iOS keys home screen icons by URL and will not re-fetch one it already
 * holds, so deleting and re-adding the app is not enough on its own; Safari
 * and any CDN in front of the site behave the same way. A query string is not
 * reliably enough either, because it is not part of the resource's identity
 * everywhere it is handled — a distinct path is. `npm run icons` regenerates
 * both the files and the digest.
 */
const icon = (stem: string, ext: string) => `/icons/${stem}.${ICON_VERSION}.${ext}`;

export const metadata: Metadata = {
  title: "FitForge",
  description:
    "Your personal transformation tracker — workouts, nutrition, and AI-powered insights",
  manifest: "/manifest.json",
  applicationName: "FitForge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    // Becomes apple-mobile-web-app-title: the caption under the home screen
    // icon. Without it iOS falls back to the page title.
    title: "FitForge",
  },
  icons: {
    icon: [
      { url: icon("favicon-32", "png"), sizes: "32x32", type: "image/png" },
      { url: icon("favicon-16", "png"), sizes: "16x16", type: "image/png" },
      { url: icon("icon", "svg"), type: "image/svg+xml" },
    ],
    // iOS reads these for "Add to Home Screen". They are deliberately opaque
    // and full-bleed: iOS ignores alpha and applies its own squircle mask.
    apple: [
      { url: icon("apple-touch-icon-180", "png"), sizes: "180x180" },
      { url: icon("apple-touch-icon-167", "png"), sizes: "167x167" },
      { url: icon("apple-touch-icon-152", "png"), sizes: "152x152" },
      { url: icon("apple-touch-icon-120", "png"), sizes: "120x120" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08080C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://static.exercisedb.dev" />
        <link rel="preconnect" href="https://static.exercisedb.dev" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <PWARegister />
        <AuthProvider>
          <SyncProvider>
            <PlanProvider>{children}</PlanProvider>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
