import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "万象局 · AI 主角行为沙盒",
  description: "让不同爽文主角原型在同一世界中做出可审计的选择。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
