import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants } from "@/db/schema";
import { desc } from "drizzle-orm";
import ExcelJS from "exceljs";
import {
  TAUX_PAR_GRADE,
  calculerHC,
  calculerHeuresAPayer,
  calculerMontantBrut,
  calculerISRA,
  calculerNetAPayer,
} from "@/lib/constants";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(enseignants)
      .orderBy(desc(enseignants.updatedAt));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "HC Enseignants";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Enseignants", {
      headerFooter: {
        firstHeader: "Liste des Enseignants - Heures Complémentaires",
      },
    });

    // Define columns
    sheet.columns = [
      { header: "N°", key: "num", width: 5 },
      { header: "Nom", key: "nom", width: 18 },
      { header: "Prénoms", key: "prenoms", width: 22 },
      { header: "Grade", key: "grade", width: 8 },
      { header: "Établissement", key: "etablissement", width: 22 },
      { header: "Statut", key: "statut", width: 12 },
      { header: "ET", key: "et", width: 8 },
      { header: "ED", key: "ed", width: 8 },
      { header: "EP", key: "ep", width: 8 },
      { header: "Soutenance", key: "soutenance", width: 12 },
      { header: "Recherche", key: "recherche", width: 10 },
      { header: "HC Brut", key: "hcBrut", width: 10 },
      { header: "Heures à payer", key: "heuresPayer", width: 14 },
      { header: "Taux (Ar)", key: "taux", width: 12 },
      { header: "Montant Brut (Ar)", key: "montantBrut", width: 18 },
      { header: "ISRA (Ar)", key: "isra", width: 14 },
      { header: "Avance (Ar)", key: "avance", width: 14 },
      { header: "Net à Payer (Ar)", key: "netPayer", width: 18 },
      { header: "RIB", key: "rib", width: 20 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 25;

    // Add data
    data.forEach((e, index) => {
      const et = parseFloat(e.heuresET ?? "0");
      const ed = parseFloat(e.heuresED ?? "0");
      const ep = parseFloat(e.heuresEP ?? "0");
      const soutenance = parseFloat(e.heuresSoutenance ?? "0");
      const recherche = parseFloat(e.heuresRecherche ?? "0");
      const avance = parseFloat(e.avance ?? "0");

      const hcBrut = calculerHC(et, ed, ep, soutenance, recherche);
      const heuresPayer = calculerHeuresAPayer(hcBrut, e.statut);
      const taux = TAUX_PAR_GRADE[e.grade] || 0;
      const montantBrut = calculerMontantBrut(heuresPayer, e.grade);
      const isra = calculerISRA(montantBrut, e.statut);
      const netPayer = calculerNetAPayer(montantBrut, isra, avance);

      const row = sheet.addRow({
        num: index + 1,
        nom: e.nom,
        prenoms: e.prenoms,
        grade: e.grade,
        etablissement: e.etablissement,
        statut: e.statut,
        et,
        ed,
        ep,
        soutenance,
        recherche,
        hcBrut,
        heuresPayer,
        taux,
        montantBrut,
        isra,
        avance,
        netPayer,
        rib: e.rib,
      });

      row.alignment = { horizontal: "center", vertical: "middle" };
      
      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F4F8" },
        };
      }
    });

    // Auto-filter
    sheet.autoFilter = {
      from: "A1",
      to: `S${data.length + 1}`,
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="enseignants_hc_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting Excel:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exportation Excel" },
      { status: 500 }
    );
  }
}
