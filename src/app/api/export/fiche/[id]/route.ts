import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants } from "@/db/schema";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import {
  TAUX_PAR_GRADE,
  calculerHC,
  calculerHeuresAPayer,
  calculerMontantBrut,
  calculerISRA,
  calculerNetAPayer,
  nombreEnLettres,
  formatAriary,
  OBLIGATION_SERVICE_PERMANENT,
} from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await db
      .select()
      .from(enseignants)
      .where(eq(enseignants.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Enseignant non trouvé" },
        { status: 404 }
      );
    }

    const e = result[0];
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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Fiche de Paiement");

    sheet.columns = [
      { width: 5 },
      { width: 28 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 14, color: { argb: "FF1E3A5F" } },
      alignment: { horizontal: "center", vertical: "middle" },
    };

    // Title
    sheet.mergeCells("A1:E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "FICHE INDIVIDUELLE DE PAIEMENT";
    titleCell.style = headerStyle;
    sheet.getRow(1).height = 35;

    // Subtitle
    sheet.mergeCells("A2:E2");
    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = "Heures Complémentaires";
    subtitleCell.style = {
      font: { bold: true, size: 11, color: { argb: "FF4A6FA5" } },
      alignment: { horizontal: "center" },
    };
    sheet.getRow(2).height = 22;

    // Blank row
    sheet.getRow(3).height = 10;

    // Info section
    const infoStyle: Partial<ExcelJS.Style> = {
      font: { size: 11 },
      alignment: { vertical: "middle" },
    };
    const labelStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 11 },
      alignment: { vertical: "middle" },
    };

    const addInfoRow = (row: number, label: string, value: string) => {
      sheet.mergeCells(`B${row}:C${row}`);
      sheet.getCell(`B${row}`).value = label;
      sheet.getCell(`B${row}`).style = labelStyle;
      sheet.mergeCells(`D${row}:E${row}`);
      sheet.getCell(`D${row}`).value = value;
      sheet.getCell(`D${row}`).style = infoStyle;
      sheet.getRow(row).height = 22;
    };

    addInfoRow(4, "Nom et Prénoms :", `${e.nom} ${e.prenoms}`);
    addInfoRow(5, "Grade :", e.grade);
    addInfoRow(6, "Établissement :", e.etablissement);
    addInfoRow(7, "Statut :", e.statut);
    addInfoRow(8, "RIB :", e.rib || "Non renseigné");

    // Blank row
    sheet.getRow(9).height = 10;

    // Hours section header
    sheet.mergeCells("A10:E10");
    const hoursHeader = sheet.getCell("A10");
    hoursHeader.value = "RÉCAPITULATIF DES HEURES";
    hoursHeader.style = {
      font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } },
      alignment: { horizontal: "center", vertical: "middle" },
    };
    sheet.getRow(10).height = 28;

    // Hours table headers
    const tableHeaderStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 10, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A6FA5" } },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const row11 = sheet.getRow(11);
    row11.height = 22;
    ["", "Catégorie", "Heures", "", ""].forEach((val, i) => {
      const cell = row11.getCell(i + 1);
      cell.value = val;
      cell.style = tableHeaderStyle;
    });
    sheet.mergeCells("B11:C11");
    sheet.mergeCells("D11:E11");
    sheet.getCell("B11").value = "Catégorie";
    sheet.getCell("D11").value = "Heures";

    const cellStyle: Partial<ExcelJS.Style> = {
      font: { size: 10 },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const addHoursRow = (rowNum: number, label: string, hours: number) => {
      sheet.mergeCells(`B${rowNum}:C${rowNum}`);
      sheet.mergeCells(`D${rowNum}:E${rowNum}`);
      sheet.getCell(`B${rowNum}`).value = label;
      sheet.getCell(`B${rowNum}`).style = { ...cellStyle, alignment: { horizontal: "left", vertical: "middle" } };
      sheet.getCell(`D${rowNum}`).value = hours;
      sheet.getCell(`D${rowNum}`).style = cellStyle;
      sheet.getRow(rowNum).height = 20;
    };

    addHoursRow(12, "Enseignement Théorique (ET)", et);
    addHoursRow(13, "Enseignement Dirigé (ED)", ed);
    addHoursRow(14, "Enseignement Pratique (EP)", ep);
    addHoursRow(15, "Soutenance", soutenance);
    addHoursRow(16, "Recherche", recherche);

    // Total HC
    sheet.mergeCells("B17:C17");
    sheet.mergeCells("D17:E17");
    sheet.getCell("B17").value = "TOTAL HC BRUT";
    sheet.getCell("B17").style = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: "left", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EDF5" } },
      border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
    };
    sheet.getCell("D17").value = hcBrut;
    sheet.getCell("D17").style = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EDF5" } },
      border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
    };
    sheet.getRow(17).height = 22;

    if (e.statut === "Permanent") {
      sheet.mergeCells("B18:C18");
      sheet.mergeCells("D18:E18");
      sheet.getCell("B18").value = `Obligation de service (${OBLIGATION_SERVICE_PERMANENT}h)`;
      sheet.getCell("B18").style = { ...cellStyle, alignment: { horizontal: "left", vertical: "middle" } };
      sheet.getCell("D18").value = `-${OBLIGATION_SERVICE_PERMANENT}`;
      sheet.getCell("D18").style = { ...cellStyle, font: { size: 10, color: { argb: "FFCC0000" } } };
    }

    // Blank row
    const calcStartRow = e.statut === "Permanent" ? 20 : 19;

    // Financial section
    sheet.mergeCells(`A${calcStartRow}:E${calcStartRow}`);
    sheet.getCell(`A${calcStartRow}`).value = "CALCUL DU PAIEMENT";
    sheet.getCell(`A${calcStartRow}`).style = {
      font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } },
      alignment: { horizontal: "center", vertical: "middle" },
    };
    sheet.getRow(calcStartRow).height = 28;

    let r = calcStartRow + 1;
    const addCalcRow = (label: string, value: string, highlight = false) => {
      sheet.mergeCells(`B${r}:C${r}`);
      sheet.mergeCells(`D${r}:E${r}`);
      sheet.getCell(`B${r}`).value = label;
      sheet.getCell(`B${r}`).style = {
        font: { bold: highlight, size: 10 },
        alignment: { horizontal: "left", vertical: "middle" },
        fill: highlight
          ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFDFF0D8" } }
          : undefined,
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      };
      sheet.getCell(`D${r}`).value = value;
      sheet.getCell(`D${r}`).style = {
        font: { bold: highlight, size: highlight ? 11 : 10 },
        alignment: { horizontal: "right", vertical: "middle" },
        fill: highlight
          ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFDFF0D8" } }
          : undefined,
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      };
      sheet.getRow(r).height = 22;
      r++;
    };

    addCalcRow("Heures à payer", `${heuresPayer} h`);
    addCalcRow("Taux horaire", formatAriary(taux));
    addCalcRow("Montant Brut", formatAriary(montantBrut));

    if (e.statut === "Vacataire") {
      addCalcRow("ISRA (20%)", `- ${formatAriary(isra)}`);
    }

    if (avance > 0) {
      addCalcRow("Avance" + (e.dateAvance ? ` (${e.dateAvance})` : ""), `- ${formatAriary(avance)}`);
    }

    addCalcRow("NET À PAYER", formatAriary(netPayer), true);

    // Net in words
    r++;
    sheet.mergeCells(`B${r}:E${r}`);
    sheet.getCell(`B${r}`).value = `Arrêté la présente fiche à la somme de : ${nombreEnLettres(netPayer)} Ariary`;
    sheet.getCell(`B${r}`).style = {
      font: { italic: true, size: 10, color: { argb: "FF1E3A5F" } },
      alignment: { horizontal: "left", vertical: "middle", wrapText: true },
    };
    sheet.getRow(r).height = 30;

    // Date and signature
    r += 2;
    sheet.mergeCells(`D${r}:E${r}`);
    sheet.getCell(`D${r}`).value = `Fait le ${new Date().toLocaleDateString("fr-FR")}`;
    sheet.getCell(`D${r}`).style = {
      font: { size: 10 },
      alignment: { horizontal: "center" },
    };

    r += 2;
    sheet.mergeCells(`B${r}:C${r}`);
    sheet.getCell(`B${r}`).value = "L'enseignant";
    sheet.getCell(`B${r}`).style = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: "center" },
    };
    sheet.mergeCells(`D${r}:E${r}`);
    sheet.getCell(`D${r}`).value = "Le Responsable";
    sheet.getCell(`D${r}`).style = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: "center" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `fiche_${e.nom}_${e.prenoms}`.replace(/\s+/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating fiche:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la fiche" },
      { status: 500 }
    );
  }
}
