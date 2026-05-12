import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/lib/theme";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Shantanu — Program Intelligence",
  description: "AI-powered program management: MOM parsing, action tracking, and executive reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body style={{ minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text-body)' }}>
        <Providers>
          <ThemeProvider>
            <Nav />
            <main>{children}</main>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
