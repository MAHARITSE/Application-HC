import { NextResponse } from "next/server";
import {
  getGrades,
  saveGrades,
  getAnnees,
  saveAnnees,
  getStructures,
  saveStructures,
  getEnseignants,
  saveEnseignants,
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

    // Seed structures académiques (sans niveau)
    let structures = getStructures();
    const structuresData = [
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Génie Logiciel", code: "UT-ST-INFO-GL" },
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Réseaux et Systèmes", code: "UT-ST-INFO-RS" },
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Mathématiques", parcours: "Mathématiques Appliquées", code: "UT-ST-MATH-MA" },
      { etablissement: "Université de Toliara", domaine: "Lettres et Sciences Humaines", mention: "Lettres Modernes", parcours: "Littérature Malgache", code: "UT-LSH-LM-LIT" },
      { etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Génie Civil", parcours: "Bâtiment et Travaux Publics", code: "UT-ST-GC-BTP" },
      { etablissement: "ENS Toliara", domaine: "Sciences de l'Éducation", mention: "Sciences Physiques", parcours: "Physique-Chimie", code: "ENS-SE-SP-PC" },
      { etablissement: "IHSM", domaine: "Sciences de la Mer", mention: "Oceanographie", parcours: "Halieutique", code: "IHSM-SM-OCEAN-HAL" },
      { etablissement: "Université de Toliara", domaine: "Droit, Economie, Gestion", mention: "Droit Public", parcours: "Droit Public Interne", code: "UT-DEG-DPUB" },
      // Nouvelles structures académiques basées sur les données enseignants fournies
      { etablissement: "IES-Menabe", domaine: "Environnement", mention: "Technique de l'Environnement", parcours: null, code: "IES-MEN-ENV" },
      { etablissement: "SCIENCES", domaine: "Sciences de la Vie", mention: "Sciences de la Vie", parcours: null, code: "SCI-SV" },
      { etablissement: "Fac Lettres", domaine: "Lettres", mention: "Etude Francçaise et francophones", parcours: null, code: "FL-EFF" },
      { etablissement: "IES-Toliara", domaine: "Agronomie", mention: "Agronomie", parcours: null, code: "IES-TOL-AGR" },
      { etablissement: "Fac Lettres", domaine: "Géographie", mention: "Géographie", parcours: null, code: "FL-GEO" },
      { etablissement: "SCIENCES", domaine: "Chimie", mention: "chimie", parcours: null, code: "SCI-CHIM" },
      { etablissement: "SCIENCES", domaine: "Physique", mention: "Physique et Applications", parcours: null, code: "SCI-PHYS" },
      { etablissement: "IES-ANOSY", domaine: "Environnement", mention: "Technique de l'environnement marin et terrestre", parcours: null, code: "IES-ANOSY-ENV" },
      { etablissement: "DEGS", domaine: "Gestion", mention: "Gestion", parcours: null, code: "DEGS-GEST" },
      { etablissement: "DEGS", domaine: "Droit", mention: "Droit", parcours: null, code: "DEGS-DROIT" },
      { etablissement: "Fac Lettres", domaine: "Malagasy", mention: "Malagasy", parcours: null, code: "FL-MAL" },
      { etablissement: "CURA", domaine: "Arts et Lettres", mention: "Arts, lettres et sciences humaines", parcours: null, code: "CURA-ALSH" },
      { etablissement: "ENS", domaine: "Enseignement", mention: "Metiers de L'enseignement des Lettres", parcours: null, code: "ENS-MEL" },
      { etablissement: "Fac Lettres", domaine: "Philosophie", mention: "Philosophie", parcours: null, code: "FL-PHILO" },
      { etablissement: "SCIENCES", domaine: "Biodiversité", mention: "Biodiversité", parcours: null, code: "SCI-BIODIV" },
      { etablissement: "MEDECINE", domaine: "Sciences de Santé", mention: "Sciences de Santé", parcours: null, code: "MED-SANTE" },
      { etablissement: "CURA", domaine: "Sciences et Technologies", mention: "Sciences, Technologie et Environnement", parcours: null, code: "CURA-STE" },
      { etablissement: "Fac Lettres", domaine: "Histoire", mention: "Histoire", parcours: null, code: "FL-HIST" },
      { etablissement: "SCIENCES", domaine: "Sciences de la Terre", mention: "Sciences de la terre", parcours: null, code: "SCI-SOL" },
      { etablissement: "IHSM", domaine: "Sciences Marines", mention: "Sciences Marine et Halieutiques", parcours: null, code: "IHSM-SMH" },
      { etablissement: "SCIENCES", domaine: "Sciences de la Vie", mention: "Sciences de la Vie", parcours: null, code: "SCI-SV2" },
    ];

    if (structures.length === 0) {
      let nextId = Math.max(0, ...structures.map((f) => f.id)) + 1;
      for (const f of structuresData) {
        structures.push({ id: nextId++, ...f });
      }
      saveStructures(structures);
    }

    // Seed enseignants - liste fournie
    let enseignants = getEnseignants();
    if (enseignants.length === 0) {
      const enseignantsData = [
        { nom: "ANDRIAFIDISON", prenom: "Daudet", cin: "409 011 000 737", contact: "", grade: "MC", mention: "Technique de l'Environnement", etablissement: "IES-Menabe", statut: "PERM" },
        { nom: "ANDRIAMALALA", prenom: "Daniela", cin: "101 212 115 676", contact: "034 72 711 63", grade: "MC", mention: "Sciences de la Vie", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "ANDRIAMAMPIANINA", prenom: "Hanitra Sylvia", cin: "520 052 001 555", contact: "0342933949", grade: "PRT", mention: "Etude Francçaise et francophones", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "ANDRIAMANALINA", prenom: "Solonirina Bruno", cin: "101 251 043 609", contact: "033 09 642 72", grade: "MC", mention: "Agronomie", etablissement: "IES-Toliara", statut: "PERM" },
        { nom: "ANDRIAMANARIVO", prenom: "Francklin", cin: "501 071 001 099", contact: "0341516009", grade: "A", mention: "Géographie", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "ANDRIANARIJAONA", prenom: "Mamy", cin: "508 991 013 602", contact: "341062553", grade: "MC", mention: "chimie", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "ANDRIANARIMANANA", prenom: "Rivesty Aimé", cin: "507 011 004 403", contact: "0347693238", grade: "A", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "ANDRIANARIVELO", prenom: "Norbert", cin: "501 031 002 208", contact: "0346042726", grade: "MC", mention: "Technique de l'environnement marin et terrestre", etablissement: "IES-ANOSY", statut: "PERM" },
        { nom: "ANDRIANIVONIAINA", prenom: "Agnes Raissa", cin: "501 072 020 609", contact: "034 84 403 20", grade: "A", mention: "Gestion", etablissement: "DEGS", statut: "PERM" },
        { nom: "ATAOVIHATEHITROATSY", prenom: "Clérmonne", cin: "501 092 007 546", contact: "034 72 841 20", grade: "A", mention: "Droit", etablissement: "DEGS", statut: "PERM" },
        { nom: "BEHARIVA DE MOUSSA", prenom: "Aurélien", cin: "501 991 039 232", contact: "347027590", grade: "MC", mention: "Malagasy", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "BEMANANJARA", prenom: "Mahabibo", cin: "504 994 030 642", contact: "033 13 913 73", grade: "A", mention: "Sciences de la Vie", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "BEMIARANA", prenom: "Jean Marie", cin: "501 112 014 172", contact: "340376398", grade: "MC", mention: "Etude Francçaise et francophones", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "BEMIASA", prenom: "Jaona", cin: "", contact: "", grade: "MC", mention: "Sciences Marine et Halieutiques", etablissement: "IHSM", statut: "PERM" },
        { nom: "BENOLO", prenom: "Francois", cin: "201 991 026 073", contact: "033 08 320 11", grade: "A", mention: "Arts, lettres et sciences humaines", etablissement: "CURA", statut: "PERM" },
        { nom: "BIALAHY", prenom: "William Zozol", cin: "501 071 003 800", contact: "0348057694", grade: "MC", mention: "Metiers de L'enseignement des Lettres", etablissement: "ENS", statut: "PERM" },
        { nom: "BIVIARISOLO", prenom: "Djacoba Aurore", cin: "401 992 026 649", contact: "0349209204", grade: "MC", mention: "Philosophie", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "BORA", prenom: "Parfait", cin: "517 011 002 817", contact: "034 86 587 40", grade: "MC", mention: "Technique de l'Environnement", etablissement: "IES-Menabe", statut: "PERM" },
        { nom: "DAUPHIN", prenom: "Rakotondrabe", cin: "501 991 039 091", contact: "032 04 648 85", grade: "A", mention: "Biodiversité", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "DAUPHIN", prenom: "Rakotondrabe", cin: "501 991 039 091", contact: "032 04 648 85", grade: "A", mention: "Sciences de la Vie", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "DIMBY", prenom: "Vaovolo", cin: "515 011 009 104", contact: "330255372", grade: "MC", mention: "Malagasy", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "DINA", prenom: "Alphonse", cin: "101 241 031 777", contact: "034 48 904 53", grade: "PRT", mention: "Sciences de la terre", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "DINA", prenom: "Fotomanantena Jeanne", cin: "101 222 019 646", contact: "320256414", grade: "MC", mention: "Histoire", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "DINA", prenom: "Lagnona Pasigny Hasie", cin: "520 052 015 410", contact: "", grade: "MC", mention: "Droit", etablissement: "DEGS", statut: "PERM" },
        { nom: "DJADAGNA AHY NIRINDRAINIARIVO", prenom: "Philibertin Honoré", cin: "508 991 010 685", contact: "034 76 891 38", grade: "A", mention: "Technique de l'Environnement", etablissement: "IES-Menabe", statut: "PERM" },
        { nom: "FANJIRINDRATOVO", prenom: "Tovondahiniriko", cin: "117 011 001 977", contact: "0342129420", grade: "MC", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "FATIANY", prenom: "Pierre Ruphin", cin: "502 051 001 235", contact: "0343053430", grade: "PR", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "FATIANY", prenom: "Pierre Ruphin", cin: "502 501 001 235", contact: "339038116", grade: "PR", mention: "chimie", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "FENOMANANA", prenom: "Maminirina Sonia", cin: "101 242 088 467", contact: "0346546527", grade: "PRT", mention: "Sciences de Santé", etablissement: "MEDECINE", statut: "PERM" },
        { nom: "FIATOA", prenom: "Barthelemy", cin: "011 003 736", contact: "033 85 202 97", grade: "MC", mention: "Sciences, Technologie et Environnement", etablissement: "CURA", statut: "PERM" },
        { nom: "FIDA", prenom: "Rudy Cyrille", cin: "520 051 003 052", contact: "0341136889", grade: "MC", mention: "Histoire", etablissement: "Fac Lettres", statut: "PERM" },
        { nom: "FIDIARISOAVONINARIVO", prenom: "Andriamananjara Salomon", cin: "109 031 000 057", contact: "034 80 985 00", grade: "A", mention: "Biodiversité", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "FIENENA", prenom: "Joëlson Lucien Christ-Offert", cin: "501 091 000 423", contact: "034 15 503 32", grade: "MC", mention: "Biodiversité", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "FIENENA", prenom: "Raymond François", cin: "508 991 011 059", contact: "0340903469", grade: "MC", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
        { nom: "FIENENA", prenom: "Raymond François", cin: "508 991 011 059", contact: "340903469", grade: "MC", mention: "chimie", etablissement: "SCIENCES", statut: "PERM" },
      ];

      let nextId = 1;
      for (const ens of enseignantsData) {
        enseignants.push({
          id: nextId++,
          nom: ens.nom,
          prenom: ens.prenom,
          cin: ens.cin || null,
          dateCIN: null,
          dateNaissance: null,
          lieuNaissance: null,
          nationalite: "Malagasy",
          adresse: null,
          telephone: ens.contact || null,
          email: null,
          rib: null,
          specialite: ens.mention,
          etablissementPrincipal: ens.etablissement,
          dateRecrutement: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      saveEnseignants(enseignants);
    }

    return NextResponse.json({
      success: true,
      message: "Base de données initialisée avec succès (JSON-only)",
      grades: getGrades().length,
      annees: getAnnees().length,
      structures: getStructures().length,
      enseignants: getEnseignants().length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Seed error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
