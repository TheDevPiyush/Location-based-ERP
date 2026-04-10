import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/components/Header";
import { Toaster } from "@/app/components/ui/toaster";
import localFont from "next/font/local";

const myFont = localFont({
  src: "../public/fonts/Hellix-Medium.ttf",
  variable: "--font-hellix-medium",
});

export const metadata: Metadata = {
  title: "CIMAGE ERP · Admin Dashboard",
  description:
    "Admin dashboard for managing geofenced attendance, analytics, and campus operations.",
  applicationName: "CIMAGE ERP Admin",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${myFont.variable} antialiased`}>
        <div className="app-shell">
          <Header />
          <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
