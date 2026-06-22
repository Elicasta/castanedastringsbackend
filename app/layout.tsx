import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EC Creative Studios",
  description: "A private creative session, planned with you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
