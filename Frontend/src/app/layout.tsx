import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/providers/ToastProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Navbar } from "@/components/layout/Navbar";
import { SessionBootstrap } from "@/components/auth/SessionBootstrap";
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
  title: "Zentra Marketplace",
  description: "Multi-vendor unified product listing marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <ReactQueryProvider>
          <SessionBootstrap />
          <Navbar />
          <main className="flex-1 w-full bg-white max-w-7xl mx-auto min-h-[calc(100vh-64px)] shadow-sm">
            {children}
          </main>
          <ToastProvider />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
