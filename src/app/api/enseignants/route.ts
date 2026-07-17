import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants, heures, grades, paiements, facultes } from "@/db/schema";
import { eq, ilike, or, sql, and } from "drizzle-orm";
import { toUpperCase, toTitleCase } from "@/lib/formatters";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const anneeId = searchParams.get("anneeId");

    // Base query enseignants (nouveau modèle avec nom, prenom séparés)
    const baseEnseignants = search
      ? await db
          .select()
          .from(enseignants)
          .where(
            or(
              ilike(enseignants.nom, `%${search}%`),
              ilike(enseignants.prenom, `%${search}%`),
              ilike(enseignants.cin, `%${search}%`),
              ilike(enseignants.etablissementPrincipal, `%${search}%`)
            )
          )
          .orderBy(enseignants.nom)
      : await db.select().from(enseignants).orderBy(enseignants.nom);

    // Sans anneeId => liste complète de TOUS les enseignants (bouton Enseignants)
    if (!anneeId) {
      const mapped = baseEnseignants.map((e) => ({
        ...e,
        nomPrenom: `${e.nom}${e.prenom ? " " + e.prenom : ""}`.trim(),
      }));
      return NextResponse.json(mapped);
    }

    // Avec anneeId => agrégation des heures + paiements + grade/statut stockés dans heures
    const anneeIdNum = Number(anneeId);

    // Récupère toutes les heures pour l'année avec grades et facultés
    const heuresData = await db
      .select({
        heure: heures,
        grade: grades,
        faculte: facultes,
      })
      .from(heures)
      .leftJoin(grades, eq(heures.gradeId, grades.id))
      .leftJoin(facultes, eq(heures.faculteId, facultes.id))
      .where(eq(heures.anneeId, anneeIdNum));

    // Paiements groupés
    const paiementsData = await db
      .select({
        enseignantId: paiements.enseignantId,
        totalAvance: sql<number>`COALESCE(SUM(${paiements.montantAvance}),0)`,
        totalPaye: sql<number>`COALESCE(SUM(${paiements.montantPaye}),0)`,
      })
      .from(paiements)
      .where(eq(paiements.anneeId, anneeIdNum))
      .groupBy(paiements.enseignantId);

    // Grouper heures par enseignant
    const map = new Map<
      number,
      {
        total_et: number;
        total_ed: number;
        total_ep: number;
        total_soutenance: number;
        total_recherche: number;
        dernierGrade: typeof grades.$inferSelect | null;
        dernierStatut: string | null;
        derniereObligation: number;
        dernierFaculte: typeof facultes.$inferSelect | null;
        count: number;
      }
    >();

    for (const row of heuresData) {
      const eid = row.heure.enseignantId;
      const cur = map.get(eid) || {
        total_et: 0,
        total_ed: 0,
        total_ep: 0,
        total_soutenance: 0,
        total_recherche: 0,
        dernierGrade: null,
        dernierStatut: null,
        derniereObligation: 125,
        dernierFaculte: null,
        count: 0,
      };
      cur.total_et += row.heure.heuresET || 0;
      cur.total_ed += row.heure.heuresED || 0;
      cur.total_ep += row.heure.heuresEP || 0;
      cur.total_soutenance += row.heure.heuresSoutenance || 0;
      cur.total_recherche += row.heure.heuresRecherche || 0;
      // On garde le dernier (plus grand id) comme référence pour grade/statut/obligation
      // Comme on itère sans tri, on prend si count==0 ou id plus grand; on va simplement écraser avec le dernier rencontré, puis on fera un tri par id desc plus tard si besoin
      cur.dernierGrade = row.grade || cur.dernierGrade;
      cur.dernierStatut = row.heure.statut || cur.dernierStatut;
      cur.derniereObligation = row.heure.obligation ?? cur.derniereObligation;
      cur.dernierFaculte = (row.faculte as any) || cur.dernierFaculte;
      cur.count += 1;
      map.set(eid, cur);
    }

    // Construire résultat: ne garder que les enseignants qui ont des heures cette année ?
    // Selon prompt, Tableau Principal liste les enseignants ayant des HC pour l'année sélectionnée.
    // On filtre donc baseEnseignants à ceux présents dans map OU si search vide on montre tout ceux avec heures
    const filteredEnseignants = baseEnseignants.filter((e) => {
      if (map.has(e.id)) return true;
      // Si on a une recherche et que l'enseignant n'a pas d'heures mais match la recherche, on ne l'affiche pas dans le tableau principal
      // (il apparaitra via le bouton Enseignants)
      return false;
    });

    const result = filteredEnseignants.map((e) => {
      const agg = map.get(e.id)!;
      const paie = paiementsData.find((p) => p.enseignantId === e.id);
      return {
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        nomPrenom: `${e.nom}${e.prenom ? " " + e.prenom : ""}`.trim(),
        cin: e.cin,
        dateCIN: e.dateCIN,
        dateNaissance: e.dateNaissance,
        lieuNaissance: e.lieuNaissance,
        nationalite: e.nationalite,
        adresse: e.adresse,
        telephone: e.telephone,
        email: e.email,
        rib: e.rib,
        specialite: e.specialite,
        etablissementPrincipal: e.etablissementPrincipal,
        dateRecrutement: e.dateRecrutement,
        // Grade/statut stockés dans heures (historique)
        gradeCode: agg.dernierGrade?.code || null,
        gradeLibelle: agg.dernierGrade?.libelle || null,
        gradeTaux: agg.dernierGrade?.tauxHoraire || null,
        gradeId: agg.dernierGrade?.id || null,
        statut: agg.dernierStatut || "Vacataire",
        faculteEtablissement: agg.dernierFaculte?.etablissement || e.etablissementPrincipal,
        faculteDomaine: agg.dernierFaculte?.domaine || null,
        faculteMention: agg.dernierFaculte?.mention || null,
        // Totaux heures
        total_et: agg.total_et,
        total_ed: agg.total_ed,
        total_ep: agg.total_ep,
        total_soutenance: agg.total_soutenance,
        total_recherche: agg.total_recherche,
        total_avance: paie ? Number(paie.totalAvance) : 0,
        total_paye: paie ? Number(paie.totalPaye) : 0,
        obligation: agg.derniereObligation,
        // Pour compat ancien front
        obligation_custom: agg.derniereObligation,
        exempte: agg.derniereObligation === 0,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/enseignants error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nomRaw = body.nom || body.nomPrenom || "";
    if (!nomRaw?.trim()) {
      return NextResponse.json({ error: "Nom obligatoire (MAJUSCULES)" }, { status: 400 });
    }

    // Support ancien format nomPrenom unique: on split
    let nom = "";
    let prenom: string | null = null;

    if (body.nom) {
      nom = toUpperCase(body.nom);
      prenom = body.prenom ? toTitleCase(body.prenom) : null;
    } else if (body.nomPrenom) {
      // Essaie de séparer premier mot comme nom? Mais spec dit nom et prenom séparés.
      // On considère tout en majuscules comme nom si pas de prenom fourni
      const parts = body.nomPrenom.trim().split(/\s+/);
      if (parts.length === 1) {
        nom = toUpperCase(parts[0]);
      } else {
        // Première partie en majuscule = nom, reste = prénom
        // Heuristique: si tout est en majuscules, garde nom complet en maj et prenom null?
        // On fait: nom = premier mot majuscule, prenom = reste Title Case
        nom = toUpperCase(parts[0]);
        prenom = toTitleCase(parts.slice(1).join(" "));
      }
    }

    const adresse = body.adresse ? toTitleCase(body.adresse) : null;

    const [result] = await db
      .insert(enseignants)
      .values({
        nom,
        prenom,
        cin: body.cin?.trim() || null,
        dateCIN: body.dateCIN || body.dateCin || null,
        dateNaissance: body.dateNaissance || null,
        lieuNaissance: body.lieuNaissance?.trim() || null,
        nationalite: body.nationalite?.trim() || "Malagasy",
        adresse,
        telephone: body.telephone?.trim() || null,
        email: body.email?.trim() || null,
        rib: body.rib?.trim() || null,
        specialite: body.specialite?.trim() || null,
        etablissementPrincipal: body.etablissementPrincipal?.trim() || null,
        dateRecrutement: body.dateRecrutement || null,
      })
      .returning();

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
