import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

function readUtilisateurs(): Utilisateur[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
    return [];
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeUtilisateurs(data: Utilisateur[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function nextId(items: { id: number }[]): number {
  if (!items.length) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

function sanitizeUser(user: Utilisateur): Omit<Utilisateur, "motDePasse"> {
  const { motDePasse, ...safe } = user;
  return safe;
}

// GET - Liste des utilisateurs (sans mot de passe)
export async function GET() {
  try {
    const utilisateurs = readUtilisateurs();
    return NextResponse.json(utilisateurs.map(sanitizeUser));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer un utilisateur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, nom, prenom, motDePasse, role, actif, email, telephone } = body;

    if (!login || !nom || !motDePasse) {
      return NextResponse.json(
        { error: "Login, nom et mot de passe requis" },
        { status: 400 }
      );
    }

    const utilisateurs = readUtilisateurs();

    // Vérifier unicité du login
    if (utilisateurs.some((u) => u.login.toLowerCase() === login.toLowerCase())) {
      return NextResponse.json(
        { error: "Ce login existe déjà" },
        { status: 409 }
      );
    }

    const newUser: Utilisateur = {
      id: nextId(utilisateurs),
      login: login.trim(),
      nom: nom.trim().toUpperCase(),
      prenom: prenom?.trim() || null,
      motDePasse: motDePasse,
      role: role || "Secrétaire",
      actif: actif !== false,
      email: email?.trim() || null,
      telephone: telephone?.trim() || null,
      derniereConnexion: null,
      createdAt: new Date().toISOString(),
    };

    utilisateurs.push(newUser);
    writeUtilisateurs(utilisateurs);

    return NextResponse.json(sanitizeUser(newUser), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Modifier un utilisateur
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const utilisateurs = readUtilisateurs();
    const idx = utilisateurs.findIndex((u) => u.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Vérifier unicité login si modifié
    if (
      data.login &&
      utilisateurs.some((u) => u.id !== id && u.login.toLowerCase() === data.login.toLowerCase())
    ) {
      return NextResponse.json({ error: "Ce login existe déjà" }, { status: 409 });
    }

    const updated = {
      ...utilisateurs[idx],
      ...data,
      nom: data.nom ? data.nom.trim().toUpperCase() : utilisateurs[idx].nom,
      id,
    };

    // Si mot de passe vide ou non fourni, garder l'ancien
    if (data.motDePasse === "" || data.motDePasse === undefined) {
      updated.motDePasse = utilisateurs[idx].motDePasse;
    }

    utilisateurs[idx] = updated;
    writeUtilisateurs(utilisateurs);

    return NextResponse.json(sanitizeUser(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const utilisateurs = readUtilisateurs();
    const filtered = utilisateurs.filter((u) => u.id !== id);

    if (filtered.length === utilisateurs.length) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    writeUtilisateurs(filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
