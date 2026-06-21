import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Castaneda Strings — Admin",
  description: "Inquiries, quotes, invoices, and contracts for Castaneda Strings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
