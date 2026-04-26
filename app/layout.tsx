import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
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
  title: "Kiamina Accounting Services",
  description:
    "Strategic accounting, reporting, payroll, tax compliance, and CFO advisory services.",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
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
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
       <a
         href="https://wa.me/2349064962073"
         target="_blank"
         rel="noreferrer"
         className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 text-white shadow-xl transition hover:-translate-y-1 hover:bg-green-600"
       >
         <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
           <path d="M12 2a10 10 0 0 0-8.66 15l-1.1 4 4.1-1.08A10 10 0 1 0 12 2Zm5.38 14.37c-.23.64-1.34 1.23-1.86 1.31-.47.08-1.05.11-1.69-.08a8.14 8.14 0 0 1-2.81-1.53 9.9 9.9 0 0 1-1.83-2.28c-.48-.83-.97-2.23-.42-3.08.28-.44.61-.45.83-.45.21 0 .45.01.65.02.21.01.49-.08.77.6.28.68.94 2.36 1.02 2.53.08.17.13.37.03.6-.1.23-.15.37-.3.57-.15.2-.32.44-.46.59-.15.15-.3.31-.13.61.17.3.76 1.25 1.64 2.02 1.13.98 2.08 1.29 2.38 1.43.3.15.48.13.66-.08.17-.2.73-.85.92-1.14.19-.28.38-.23.64-.14.26.09 1.66.78 1.94.92.28.14.47.21.54.33.07.12.07.7-.16 1.34Z" />
         </svg>
         <span className="text-sm font-semibold hidden sm:inline">
           Chat on WhatsApp
         </span>
       </a>
      </body>
    </html>
  );
}