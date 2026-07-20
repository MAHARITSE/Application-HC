import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le plugin @netlify/plugin-nextjs (et Vercel) s'appuie sur le répertoire de
  // build par défaut (.next). On ne redéfinit PAS distDir pour rester compatible
  // avec le déploiement serverless.

  // Les chemins des fichiers data/ sont construits dynamiquement (path.join +
  // variable), donc Next.js ne les « trace » pas automatiquement dans la
  // fonction serverless. On force leur inclusion pour qu'ils soient déployés
  // avec l'application (le FS de production est en lecture seule : seules les
  // lectures fonctionnent, les écritures sont gérées en mode dégradé).
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },
};

export default nextConfig;
