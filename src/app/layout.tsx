import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HC-Manager | Gestion des Heures Complémentaires",
  description: "Application de gestion des heures complémentaires des enseignants du supérieur",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
