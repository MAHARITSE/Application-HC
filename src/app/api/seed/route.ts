import { NextResponse } from "next/server";
import { db } from "@/db";
import { grades, annees, facultes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Seed grades
    const gradeData = [
      { code: "A", libelle: "Assistant", tauxHoraire: 6000, obligationService: 192 },
      { code: "MC", libelle: "Maître de Conférences", tauxHoraire: 8000, obligationService: 128 },
      { code: "PR", libelle: "Professeur", tauxHoraire: 10000, obligationService: 96 },
      { code: "PRT", libelle: "Professeur Titulaire", tauxHoraire: 12000, obligationService: 96 },
    ];
    for (const g of gradeData) {
      const existing = await db.select().from(grades).where(eq(grades.code, g.code));
      if (existing.length === 0) {
        await db.insert(grades).values(g);
      }
    }

    // Seed années
    const anneesData = [
      { libelle: "2023-2024", tranche: "Première tranche", active: false, appliquerIRSA: true, tauxIRSA: 20 },
      { libelle: "2024-2025", tranche: "Première tranche", active: true, appliquerIRSA: true, tauxIRSA: 20 },
      { libelle: "2025-2026", tranche: "Première tranche", active: false, appliquerIRSA: false, tauxIRSA: 20 },
    ];
    for (const a of anneesData) {
      const existing = await db.select().from(annees).where(eq(annees.libelle, a.libelle));
      if (existing.length === 0) {
        await db.insert(annees).values(a);
      }
    }

    // Seed facultés
    const facultesData = [
      { etablissement: "Faculté des Sciences", mention: "Informatique", parcours: "Génie Logiciel", niveau: "L3", code: "FS-INFO-GL" },
      { etablissement: "Faculté des Sciences", mention: "Informatique", parcours: "Réseaux", niveau: "L3", code: "FS-INFO-RX" },
      { etablissement: "Faculté des Sciences", mention: "Mathématiques", parcours: "Maths Pures", niveau: "M1", code: "FS-MATH-MP" },
      { etablissement: "Faculté des Lettres", mention: "Lettres Modernes", parcours: "Littérature", niveau: "L2", code: "FL-LM-LIT" },
      { etablissement: "École Polytechnique", mention: "Génie Civil", parcours: "Bâtiment", niveau: "M2", code: "EP-GC-BAT" },
      { etablissement: "ENS", mention: "Sciences Physiques", parcours: "Physique", niveau: "L3", code: "ENS-SP-PH" },
      { etablissement: "IHSM", mention: "Sciences de la Mer", parcours: "Halieutique", niveau: "M1", code: "IHSM-SM-HA" },
    ];
    const existingFac = await db.select().from(facultes);
    if (existingFac.length === 0) {
      await db.insert(facultes).values(facultesData);
    }

    return NextResponse.json({ success: true, message: "Base de données initialisée avec succès" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
