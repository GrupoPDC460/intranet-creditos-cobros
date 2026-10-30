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
  themeColor: "#00216F",
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
        {["300", "500", "700", "900"].map((w) => (
          <link
            key={w}
            rel="preload"
            href={`/fonts/museo-sans-rounded-${w}.woff2`}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body className="min-h-screen font-sans antialiased">
        <BrandBackground />
        <div className="aurora" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
