import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppSidebar } from "@/components/AppSidebar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { NotificationManager } from "@/components/NotificationManager";
import { AIChat } from "@/components/ai/AIChat";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { OfflineIndicator } from "@/components/OfflineIndicator";

import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: {
    default: "RT - Routine Tracker | Build Unbreakable Discipline",
    template: "%s | Routine Tracker",
  },
  description: "Premium routine tracking for peak performance. Build unbreakable discipline with AI-powered task management, goal tracking, and daily motivation.",
  manifest: "/manifest.json",
  keywords: ["routine tracker", "habit tracker", "productivity app", "task manager", "goal setting", "daily planner", "time management", "AI assistant", "focus timer", "discipline"],
  authors: [{ name: "Routine Tracker Team" }],
  creator: "Routine Tracker",
  publisher: "Routine Tracker",
  category: "Productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "RT - Routine Tracker | Build Unbreakable Discipline",
    description: "Premium routine tracking for peak performance. Build unbreakable discipline with AI-powered task management, goal tracking, and daily motivation.",
    siteName: "Routine Tracker",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Routine Tracker - Premium productivity app with AI assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RT - Routine Tracker | Build Unbreakable Discipline",
    description: "Premium routine tracking for peak performance. AI-powered task management, goal tracking, and daily motivation.",
    images: ["/og-image.jpg"],
    creator: "@routinetracker",
  },
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    title: "Routine Tracker",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ServiceWorkerRegister />
          <NotificationManager />
          <AppSidebar />
          {children}
          <AIChat />
          <PWAInstallPrompt />
          <KeyboardShortcuts />
          <OfflineIndicator />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
