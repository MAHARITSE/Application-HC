import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Renomme le répertoire de build (.next -> dist) pour obtenir un vrai dossier dist/.
  // Le build de production (npm run build) écrit désormais dans dist/ et
  // npm run start sert l'app depuis ce dossier.
  distDir: "dist",
};

export default nextConfig;
