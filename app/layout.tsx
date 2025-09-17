import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ClerkThemeProvider from "@/components/ClerkThemProvider";
import Navbar1 from "@/components/Navbar1";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExpenseTracker AI - Smart Financial Management",
  description:
    "AI-powered expense tracking app with intelligent insights, smart categorization, and personalized financial recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased 
        bg-gray-100 text-gray-800 
        dark:bg-gray-900 dark:text-gray-200 
        transition-colors duration-300`}
      >
        <ThemeProvider>
          <ClerkThemeProvider>
            <Navbar />
            {/* <Navbar1 /> */}
            {children}
            <Footer />
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
