import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "외국인학생 현황 대시보드",
  description: "외국인학생 학적, 출결, 보험, 어학 현황 운영 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
