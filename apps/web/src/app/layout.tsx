import { ThemeToggle } from "@agora/ui";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora",
  description: "A self-hostable multi-agent AI debate platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-[oklch(0.14_0_0)] text-[oklch(0.96_0_0)] antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-[oklch(0.24_0_0)]">
              <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
                <a
                  href="/"
                  className="font-mono text-sm lowercase tracking-[0.08em] text-[oklch(0.96_0_0)]"
                >
                  agora
                </a>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-[oklch(0.24_0_0)] py-6">
              <div className="mx-auto max-w-[1200px] px-6">
                <p className="font-mono text-xs text-[oklch(0.55_0_0)]">
                  © {new Date().getFullYear()} Agora contributors —{" "}
                  <a
                    href="https://github.com/your-org/agora"
                    className="hover:text-[oklch(0.96_0_0)] transition-colors duration-150"
                  >
                    GitHub
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
