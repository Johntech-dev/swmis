import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLoop — Smart Waste Management & Flood Alert System",
  description:
    "Report it. Track it. Watch it get cleared. GreenLoop connects Citizens, Collectors, and Municipal Government Admins for automated waste dispatch and emergency flood response.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#ffffff] text-[#0e1310] font-sans selection:bg-[#eaf3ec] selection:text-[#123321]">
        {children}
      </body>
    </html>
  );
}


