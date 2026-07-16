import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HC Manager – Université de Toliara",
  description: "Gestion des Heures Complémentaires des Enseignants du Supérieur",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
