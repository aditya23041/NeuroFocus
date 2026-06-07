import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroFocus AI - Precision Study Monitor",
  description: "An advanced AI study monitor merging cognitive science with high-tech performance tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full dark`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full w-full bg-background text-on-surface antialiased overflow-x-hidden">
        <ToastProvider>
          <AuthProvider>
            <div className="flex min-h-screen w-full bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="ml-64 mt-16 p-margin-desktop flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}


