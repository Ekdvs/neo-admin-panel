import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "react-hot-toast";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { ModeToggle } from "@/components/Toggle-Mode";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salon Neo Admin",
  description: "Salon Neo admin portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed right-4 top-4 z-50 md:right-8 md:top-8">
            <ModeToggle />
          </div>

          {children}

          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={10}
            containerClassName="!top-5 !right-5"
            toastOptions={{
              duration: 4000,
              className:
                "!rounded-2xl !border !border-white/10 !backdrop-blur-xl !shadow-2xl",
              style: {
                background: "rgba(24, 24, 27, 0.95)",
                color: "#fafafa",
                padding: "14px 16px",
                maxWidth: "420px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "16px",
              },
              success: {
                duration: 3000,
                icon: <CheckCircle2 size={20} color="#22c55e" strokeWidth={2.2} />,
                style: { border: "1px solid rgba(34, 197, 94, 0.25)" },
              },
              error: {
                duration: 5000,
                icon: <XCircle size={20} color="#ef4444" strokeWidth={2.2} />,
                style: { border: "1px solid rgba(239, 68, 68, 0.3)" },
              },
              loading: {
                icon: (
                  <LoaderCircle
                    size={20}
                    color="#60a5fa"
                    className="animate-spin"
                  />
                ),
                duration: Infinity,
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}