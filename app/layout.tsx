import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Qala AI",
  description: "AI dispatcher for city issue reports in Shymkent. Demo Smart City MVP."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="ru" className="font-sans">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,500,0,0"
            rel="stylesheet"
          />
        </head>
        <body className={jetbrainsMono.variable}>
          <LanguageProvider>
            <div className="site-shell">
              <Header />
              <main>{children}</main>
              <Footer />
            </div>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
