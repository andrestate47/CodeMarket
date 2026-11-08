import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { getStoreAppearanceAction } from "@/modules/appearance/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { appearance } = await getStoreAppearanceAction();
  return {
    title: appearance?.store_name || "Tienda Vir",
    description: `Bienvenido a ${appearance?.store_name || "Tienda Vir"}`,
    icons: {
      icon: appearance?.logo_url || "/favicon.ico",
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { appearance } = await getStoreAppearanceAction();
  const primaryColor = appearance?.primary_color || "#ff6b00";
  const secondaryColor = appearance?.secondary_color || "#ff8a00";

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{
        '--primary': primaryColor,
        '--secondary': secondaryColor,
        '--robotina-orange': primaryColor,
        '--robotina-orange-soft': secondaryColor,
        '--robotina-orange-light': secondaryColor,
        '--gradient-main': `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        '--gradient-text': `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      } as React.CSSProperties}>
        <Providers>
          <Toaster position="bottom-right" richColors />
          {children}
        </Providers>
      </body>
    </html>
  );
}
