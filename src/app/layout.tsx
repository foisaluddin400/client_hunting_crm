import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/context/toast-context";
import { CRMProvider } from "@/lib/context/crm-context";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "LeadFlow CRM — Modern Multi-Channel Lead Hunting & Outreach",
  description:
    "High-performance client hunting CRM for freelancers and digital agencies across Email, WhatsApp, LinkedIn, Instagram, Facebook, and Twitter.",
  icons: {
    icon: [
      { url: "/logo_meta.png", type: "image/png" },
    ],
    shortcut: "/logo_meta.png",
    apple: [
      { url: "/logo_meta.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "LeadFlow CRM — Modern Multi-Channel Lead Hunting & Outreach",
    description:
      "High-performance client hunting CRM for freelancers and digital agencies across Email, WhatsApp, LinkedIn, Instagram, Facebook, and Twitter.",
    images: [
      {
        url: "/logo_meta.png",
        width: 1024,
        height: 1024,
        alt: "LeadFlow CRM Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadFlow CRM — Modern Multi-Channel Lead Hunting & Outreach",
    description:
      "High-performance client hunting CRM for freelancers and digital agencies across Email, WhatsApp, LinkedIn, Instagram, Facebook, and Twitter.",
    images: ["/logo_meta.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/logo_meta.png" type="image/png" />
      </head>
      <body className={`${inter.className} min-h-full font-sans bg-[#F8FAFC] text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}>
        <ToastProvider>
          <CRMProvider>
            <AppLayout>{children}</AppLayout>
          </CRMProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
