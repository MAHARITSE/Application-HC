import { NextResponse } from "next/server";
import { db } from "@/db";
import { grades, annees, facultes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Seed grades - taux selon prompt.md
    const gradeData = [
      { code: "A", libelle: "Assistant", tauxHoraire: 6000 },
      { code: "MC", libelle: "Maître de Conférences", tauxHoraire: 8000 },
      { code: "PR", libelle: "Professeur", tauxHoraire: 10000 },
      { code: "PRT", libelle: "Professeur Titulaire", tauxHoraire: 12000 },
    ];
    for (const g of gradeData) {
      const existing = await db.select().from(grades).where(eq(grades.code, g.code));
      if (existing.length === 0) {
        await db.insert(grades).values(g);
      } else {
        // Met à jour taux si changé
        await db.update(grades).set({ tauxHoraire: g.tauxHoraire, libelle: g.libelle }).where(eq(grades.code, g.code));
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

    // Seed facultés avec hiérarchie complète Établissement -> Domaine -> Mention
    const facultesData = [
      {
        etablissement: "Université de Toliara",
        domaine: "Sciences et Technologies",
        mention: "Informatique",
        parcours: "Génie Logiciel",
        niveau: "L3",
        code: "UT-ST-INFO-GL",
      },
      {
        etablissement: "Université de Toliara",
        domaine: "Sciences et Technologies",
        mention: "Informatique",
        parcours: "Réseaux et Systèmes",
        niveau: "L3",
        code: "UT-ST-INFO-RS",
      },
      {
        etablissement: "Université de Toliara",
        domaine: "Sciences et Technologies",
        mention: "Mathématiques",
        parcours: "Mathématiques Appliquées",
        niveau: "M1",
        code: "UT-ST-MATH-MA",
      },
      {
        etablissement: "Université de Toliara",
        domaine: "Lettres et Sciences Humaines",
        mention: "Lettres Modernes",
        parcours: "Littérature Malgache",
        niveau: "L2",
        code: "UT-LSH-LM-LIT",
      },
      {
        etablissement: "Université de Toliara",
        domaine: "Sciences et Technologies",
        mention: "Génie Civil",
        parcours: "Bâtiment et Travaux Publics",
        niveau: "M2",
        code: "UT-ST-GC-BTP",
      },
      {
        etablissement: "ENS Toliara",
        domaine: "Sciences de l'Éducation",
        mention: "Sciences Physiques",
        parcours: "Physique-Chimie",
        niveau: "L3",
        code: "ENS-SE-SP-PC",
      },
      {
        etablissement: "IHSM",
        domaine: "Sciences de la Mer",
        mention: "Oceanographie",
        parcours: "Halieutique",
        niveau: "M1",
        code: "IHSM-SM-OCEAN-HAL",
      },
      {
        etablissement: "Université de Toliara",
        domaine: "Droit, Economie, Gestion",
        mention: "Droit Public",
        parcours: "Droit Public Interne",
        niveau: "M1",
        code: "UT-DEG-DPUB",
      },
    ];

    const existingFac = await db.select().from(facultes);
    if (existingFac.length === 0) {
      await db.insert(facultes).values(facultesData);
    }

    return NextResponse.json({
      success: true,
      message: "Base de données initialisée avec succès selon prompt.md",
      grades: gradeData.length,
      annees: anneesData.length,
      facultes: facultesData.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Seed error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
