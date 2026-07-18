import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────────
interface Utilisateur {
  id: number;
  login: string;
  nom: string;
  prenom: string;
  motDePasse: string;
  role: "Administrateur" | "Gestionnaire" | "Secrétaire";
  actif: boolean;
  email: string | null;
  telephone: string | null;
  derniereConnexion: string | null;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "utilisateurs.json");
const CONFIG_FILE = path.join(process.cwd(), "data", "config.json");

function readUtilisateurs(): Utilisateur[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeUtilisateurs(data: Utilisateur[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Helper: simple hash (pour usage local uniquement) ─────────────────
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export async function POST(request: Request) {
  try {
    const { login, motDePasse } = await request.json();

    if (!login || !motDePasse) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    const utilisateurs = readUtilisateurs();
    const user = utilisateurs.find(
      (u) => u.login.toLowerCase() === login.toLowerCase() && u.actif
    );

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants incorrects ou compte désactivé" },
        { status: 401 }
      );
    }

    // Vérification simple du mot de passe
    if (user.motDePasse !== motDePasse) {
      return NextResponse.json(
        { error: "Identifiants incorrects ou compte désactivé" },
        { status: 401 }
      );
    }

    // Mise à jour dernière connexion
    user.derniereConnexion = new Date().toISOString();
    writeUtilisateurs(utilisateurs);

    // Charger la config
    let config = { nomEtablissement: "HC-Manager", service: "", logoEmoji: "🎓" };
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
      }
    } catch { /* ignore */ }

    // Ne pas renvoyer le mot de passe
    const { motDePasse: _, ...userSafe } = user;

    return NextResponse.json({
      success: true,
      utilisateur: userSafe,
      config,
      token: simpleHash(user.login + user.motDePasse + Date.now()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
