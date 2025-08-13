import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/hooks/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import ClientLayout from "@/components/ClientLayout"; // Nouveau

export const metadata: Metadata = {
  title: "Cabinet Médical Vouadi",
  description: "Espace de gestion des consultations médicales",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
