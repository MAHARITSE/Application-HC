import { NextResponse } from "next/server";
import { db } from "@/db";
import { gradesTaux, anneesUniversitaires, facultesParcours } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Grades
    const grades = [
      { code: "A",   libelle: "Assistant",             tauxHoraire: 6000,  obligationService: 192 },
      { code: "MC",  libelle: "Maître de Conférences", tauxHoraire: 8000,  obligationService: 128 },
      { code: "PR",  libelle: "Professeur",            tauxHoraire: 10000, obligationService: 96  },
      { code: "PRT", libelle: "Professeur Titulaire",  tauxHoraire: 12000, obligationService: 96  },
    ];
    for (const g of grades) {
      await db.execute(sql`
        INSERT INTO grades_taux (code, libelle, taux_horaire, obligation_service)
        VALUES (${g.code}, ${g.libelle}, ${g.tauxHoraire}, ${g.obligationService})
        ON CONFLICT (code) DO NOTHING
      `);
    }

    // Années universitaires
    const annees = [
      { libelle: "2019/2020", active: false },
      { libelle: "2020/2021", active: false },
      { libelle: "2021/2022", active: false },
      { libelle: "2022/2023", active: false },
      { libelle: "2023/2024", active: true },
    ];
    for (const a of annees) {
      await db.execute(sql`
        INSERT INTO annees_universitaires (libelle, active)
        VALUES (${a.libelle}, ${a.active})
        ON CONFLICT (libelle) DO NOTHING
      `);
    }

    // Facultés / Établissements de l'Université de Toliara
    const etablissements = [
      { etablissement: "CURA",        mention: "Centre Univ. Régional d'Anosy",    parcours: null, niveau: "L" },
      { etablissement: "DRGS",        mention: "Direction Régionale",               parcours: null, niveau: null },
      { etablissement: "ENS",         mention: "École Normale Supérieure",          parcours: null, niveau: "L" },
      { etablissement: "FAC LETTRES", mention: "Lettres et Sciences Humaines",      parcours: null, niveau: "L" },
      { etablissement: "IES-ANOSY",   mention: "IES Anosy",                        parcours: null, niveau: "L" },
      { etablissement: "IES-Menabe",  mention: "IES Menabe",                       parcours: null, niveau: "L" },
      { etablissement: "IES-Toliara", mention: "IES Toliara",                      parcours: null, niveau: "L" },
      { etablissement: "IHSM",        mention: "Sciences Marines et Halieutique",  parcours: null, niveau: "L" },
      { etablissement: "MEDECINE",    mention: "Médecine",                          parcours: null, niveau: "L" },
      { etablissement: "SCIENCES",    mention: "Sciences et Technologies",          parcours: null, niveau: "L" },
    ];
    for (const e of etablissements) {
      await db.execute(sql`
        INSERT INTO facultes_parcours (etablissement, mention, parcours, niveau)
        VALUES (${e.etablissement}, ${e.mention}, ${e.parcours}, ${e.niveau})
        ON CONFLICT DO NOTHING
      `);
    }

    return NextResponse.json({ ok: true, message: "Données de base initialisées." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
