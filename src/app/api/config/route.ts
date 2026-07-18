import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "config.json");

interface AppConfig {
  id: number;
  nomEtablissement: string;
  service: string;
  adresse: string;
  telephone: string;
  email: string;
  logoEmoji: string;
  logoType: "emoji" | "image";
  utiliserImprimanteThermique: boolean;
  largeurTicketMm: number;
  piedTicket: string;
  responsableNom: string;
  responsableFonction: string;
  devise: string;
  pays: string;
  updatedAt: string;
}

function readConfig(): AppConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig: AppConfig = {
      id: 1,
      nomEtablissement: "HC-Manager",
      service: "Service des Heures Complémentaires",
      adresse: "",
      telephone: "",
      email: "",
      logoEmoji: "🎓",
      logoType: "emoji",
      utiliserImprimanteThermique: false,
      largeurTicketMm: 80,
      piedTicket: "Merci de votre collaboration !",
      responsableNom: "RESPONSABLE HC",
      responsableFonction: "Chef de Service",
      devise: "Ariary",
      pays: "Madagascar",
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

function writeConfig(data: AppConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const current = readConfig();
    const updated: AppConfig = {
      ...current,
      ...body,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };
    writeConfig(updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
