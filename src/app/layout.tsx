import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BrandBackground } from "@/components/brand-background";

export const metadata: Metadata = {
  title: {
    default: "Créditos & Cobros · Grupo PDC",
    template: "%s · Grupo PDC",
  },
  description:
    "Intranet corporativa de Créditos & Cobros. Un solo lugar para todos los sistemas, dashboards, reportes y herramientas del departamento.",
  applicationName: "Intranet PDC",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0A1230",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <BrandBackground />
        <div className="aurora" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
