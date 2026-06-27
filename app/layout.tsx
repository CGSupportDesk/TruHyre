import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { APP_NAME, APP_TAGLINE } from "@/lib/utils";
import { ToastListener } from "@/components/toast-listener";
import { ImpersonationBanner } from "@/components/impersonation-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};

// Theme-color for the mobile browser chrome (address/status bar). The PWA
// manifest's theme_color only applies when installed standalone; this covers
// the normal in-browser visit. Media-aware so the chrome matches the app in
// both themes (values are the --canvas tokens from globals.css: light #f4f5f7,
// dark #0d1119) — without it the bar stays white, jarring above the dark canvas.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1119" },
  ],
};

// Runs before paint to apply a saved dark preference and avoid a flash of the
// wrong theme. Light is the default unless the user explicitly chose dark.
const THEME_SCRIPT = `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans">
        <Suspense fallback={null}>
          <ImpersonationBanner />
        </Suspense>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-xl2 !border !border-hairline !shadow-card !text-sm",
              success: "!bg-brand-50 !text-brand-900 !border-brand-100",
              error: "!bg-red-50 !text-red-900 !border-red-100",
            },
          }}
        />
        <Suspense fallback={null}>
          <ToastListener />
        </Suspense>
      </body>
    </html>
  );
}
