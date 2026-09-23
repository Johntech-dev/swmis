import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GreenLoop — Smart Waste Management Information System",
  description:
    "Report it. Track it. Watch it get cleared. GreenLoop connects Citizens, Collectors, and Municipal Admins for automated waste dispatch and real-time resolution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#ffffff] text-[#0e1310] font-sans selection:bg-[#eaf3ec] selection:text-[#123321]">
        {children}
      </body>
    </html>
  );
}


