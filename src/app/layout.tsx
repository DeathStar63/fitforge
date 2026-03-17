import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FitForge",
  description:
    "Your personal transformation tracker — workouts, nutrition, and AI-powered insights",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitForge",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F0F17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="dns-prefetch" href="https://static.exercisedb.dev" />
        <link rel="preconnect" href="https://static.exercisedb.dev" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <PWARegister />
        <AuthProvider>
          <SyncProvider>
            {children}
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
