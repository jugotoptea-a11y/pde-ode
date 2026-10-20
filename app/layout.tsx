import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Configuración de tipografías principales (Plus Jakarta Sans para interfaz y JetBrains Mono para métricas)
const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Metadatos globales de la aplicación web Next.js
export const metadata: Metadata = {
  title: "Cero DesBorde | Simulación Híbrida PDE–ODE de Drenaje Urbano",
  description: "Simulación de tráfico de datos y optimización de colas en estaciones de bombeo de drenaje urbano (CUC CIA 2026-2)",
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

/**
 * Estructura raíz HTML de la aplicación (idioma español y tema oscuro).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-slate-100 bg-slate-950">
        {children}
      </body>
    </html>
  );
}
