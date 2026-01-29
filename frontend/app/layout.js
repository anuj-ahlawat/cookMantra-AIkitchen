import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CookMantra - AI Recipes Platform",
  description: "Fresh recipes, natural ingredients. Turn leftovers into masterpieces.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#2d6a4f",
          colorBackground: "#fafaf8",
          colorInputBackground: "#f5f0e8",
          colorInputText: "#1b4332",
          borderRadius: "0.5rem",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.svg" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <Header />
          <main className="min-h-screen page-bg">{children}</main>
          <Toaster richColors />

          {/* Footer */}
          <footer className="py-8 px-4 border-t border-[var(--border)] bg-[var(--page-bg)]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="CookMantra Logo"
                  width={48}
                  height={48}
                  className="w-14"
                />
              </div>
              <p className="text-[var(--green-muted)] text-sm">
              © 2026 CookMantra. All Rights Reserved.
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
