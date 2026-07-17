import { NextResponse } from "next/server";
import {
  getGrades,
  saveGrades,
  getAnnees,
  saveAnnees,
  getFacultes,
  saveFacultes,
} from "@/db";

export async function POST() {
  try {
    // Seed grades - taux selon prompt.md
    let grades = getGrades();
    const gradeData = [
      { code: "A", libelle: "Assistant", tauxHoraire: 6000 },
      { code: "MC", libelle: "Maître de Conférences", tauxHoraire: 8000 },
      { code: "PR", libelle: "Professeur", tauxHoraire: 10000 },
      { code: "PRT", libelle: "Professeur Titulaire", tauxHoraire: 12000 },
    ];

    for (const g of gradeData) {
      const existing = grades.find((gr) => gr.code === g.code);
      if (!existing) {
        grades.push({ id: Math.max(0, ...grades.map((x) => x.id)) + 1 || 1, ...g });
      } else {
        // update taux if different
        existing.tauxHoraire = g.tauxHoraire;
        existing.libelle = g.libelle;
      }
    }
    saveGrades(grades);

    // Seed années
    let annees = getAnnees();
    const anneesData = [
      { libelle: "2023-2024", tranche: "Première tranche", active: false, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: null },
      { libelle: "2024-2025", tranche: "Première tranche", active: true, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: null },
      { libelle: "2025-2026", tranche: "Première tranche", active: false, appliquerIRSA: false, tauxIRSA: 20, plafondPaiement: null },
    ];

    for (const a of anneesData) {
      const existing = annees.find((an) => an.libelle === a.libelle);
      if (!existing) {
        annees.push({ id: Math.max(0, ...annees.map((x) => x.id)) + 1 || 1, ...a });
      }
    }
    saveAnnees(annees);

    // Seed facultés
    let facultes = getFacultes();
    const facultesData = [
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Génie Logiciel", niveau: "L3", code: "UT-ST-INFO-GL" },
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Réseaux et Systèmes", niveau: "L3", code: "UT-ST-INFO-RS" },
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Mathématiques", parcours: "Mathématiques Appliquées", niveau: "M1", code: "UT-ST-MATH-MA" },
      { etablissement: "Université de Toliara", domaine: "Lettres et Sciences Humaines", mention: "Lettres Modernes", parcours: "Littérature Malgache", niveau: "L2", code: "UT-LSH-LM-LIT" },
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Génie Civil", parcours: "Bâtiment et Travaux Publics", niveau: "M2", code: "UT-ST-GC-BTP" },
      { etablissement: "ENS Toliara", domaine: "Sciences de l'Éducation", mention: "Sciences Physiques", parcours: "Physique-Chimie", niveau: "L3", code: "ENS-SE-SP-PC" },
      { etablissement: "IHSM", domaine: "Sciences de la Mer", mention: "Oceanographie", parcours: "Halieutique", niveau: "M1", code: "IHSM-SM-OCEAN-HAL" },
      { etablissement: "Université de Toliara", domaine: "Droit, Economie, Gestion", mention: "Droit Public", parcours: "Droit Public Interne", niveau: "M1", code: "UT-DEG-DPUB" },
    ];

    if (facultes.length === 0) {
      // insert with new ids
      let nextId = Math.max(0, ...facultes.map((f) => f.id)) + 1;
      for (const f of facultesData) {
        facultes.push({ id: nextId++, ...f });
      }
      saveFacultes(facultes);
    }

    return NextResponse.json({
      success: true,
      message: "Base de données initialisée avec succès (JSON-only)",
      grades: getGrades().length,
      annees: getAnnees().length,
      facultes: getFacultes().length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Seed error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
