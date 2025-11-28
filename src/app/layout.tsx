import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3D Printing",
  description: "Custom 3D prints and signs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
        suppressHydrationWarning
      >
        {/* 
            Global Background System 
            Constructed with separate layers to ensure visibility and depth 
        */}
        
        {/* Layer 1: Base Background Color */}
        <div className="fixed inset-0 -z-50 bg-[#09090b]" />

        {/* Layer 2: The "Math Sheet" Grid Pattern 
            - Increased opacity slightly for visibility
            - Using distinct lines
        */}
        <div 
          className="fixed inset-0 -z-40 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"
          style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}
        />

        {/* Layer 3: Radial Glow / Spotlight Effect 
            - Adds depth and highlights the center content
            - "Super stylish"
        */}
        <div className="fixed inset-0 -z-30 bg-[radial-gradient(circle_at_center,transparent_10%,#09090b_90%)] opacity-60 pointer-events-none" />

        <Navbar />
        <main className="min-h-screen pb-10 relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
