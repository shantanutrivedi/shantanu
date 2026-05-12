import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Shantanu — Program Intelligence",
  description: "AI-powered program management: MOM parsing, action tracking, and executive reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#1C1C24' }}>
      <head />
      <body style={{ background: '#1C1C24', color: '#B7B3DC', minHeight: '100vh' }}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
