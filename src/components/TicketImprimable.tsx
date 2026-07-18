"use client";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT TICKET IMPRIMABLE
// Style ticket thermique 80mm, inspiré de RECEPTION-SALFA et LogBara PrintTicket
// ═══════════════════════════════════════════════════════════════════════════════

interface TicketData {
  enseignant: {
    nom: string;
    prenom: string | null;
    nomPrenom: string;
    cin: string | null;
    telephone: string | null;
    rib: string | null;
    grade: string | null;
    statut: string;
    etablissementPrincipal: string | null;
    specialite: string | null;
  };
  annee: {
    libelle: string;
    tranche: string;
  };
  numeroEtat: string;
  detailsParFaculte: Record<string, {
    etablissement: string;
    domaine: string;
    mention: string;
    parcours: string | null;
    et: number;
    ed: number;
    ep: number;
    sout: number;
    rech: number;
  }[]>;
  totaux: {
    et: number;
    ed: number;
    ep: number;
    soutenance: number;
    recherche: number;
    hcBrut: number;
    obligation: number;
    hcNette: number;
    hcArrondi: number;
  };
  calculs: {
    taux: number;
    montantBrut: number;
    appliquerIRSA: boolean;
    tauxIRSA: number;
    montantIRSA: number;
    montantNet: number;
    totalAvance: number;
    netAPayer: number;
    netEnLettres: string;
  };
}

interface TicketImprimableProps {
  data: TicketData;
  config?: any;
  mode?: "fiche" | "ticket" | "recu";
}

export default function TicketImprimable({ data, config, mode = "fiche" }: TicketImprimableProps) {
  const [appConfig, setAppConfig] = useState<any>(config || {
    nomEtablissement: "HC-Manager",
    service: "Service des Heures Complémentaires",
    adresse: "",
    telephone: "",
    email: "",
    logoEmoji: "🎓",
    piedTicket: "Merci de votre collaboration !",
    responsableNom: "RESPONSABLE HC",
    responsableFonction: "Chef de Service",
    devise: "Ariary",
    pays: "Madagascar",
  });

  useEffect(() => {
    if (!config) {
      fetch("/api/config")
        .then((r) => r.json())
        .then((c) => {
          if (c && !c.error) setAppConfig(c);
        })
        .catch(() => {});
    }
  }, [config]);

  const formatAriary = (v: number) => v.toLocaleString("fr-MG");
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const heureStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const printTicket = () => {
    window.print();
  };

  // ── Contenu du ticket ──────────────────────────────────────────────────
  const ticketContent = (
    <div className={`ticket-imprimable ${mode === "ticket" ? "ticket-thermique" : "ticket-fiche"}`}>
      {/* Styles inline pour impression */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .ticket-imprimable {
            width: ${mode === "ticket" ? "80mm" : "100%"};
            margin: 0 auto;
            padding: ${mode === "ticket" ? "2mm" : "10mm"};
            font-family: ${mode === "ticket" ? "'Courier New', monospace" : "inherit"};
            font-size: ${mode === "ticket" ? "9pt" : "inherit"};
          }
          .ticket-thermique * { font-size: 9pt !important; }
          .page-break-after { page-break-after: always; }
        }
        @media screen {
          .ticket-imprimable {
            width: ${mode === "ticket" ? "80mm" : "100%"};
            margin: 0 auto;
            padding: ${mode === "ticket" ? "4mm" : "16px"};
            background: ${mode === "ticket" ? "#fff" : "white"};
            border: ${mode === "ticket" ? "1px dashed #ccc" : "none"};
            font-family: ${mode === "ticket" ? "'Courier New', monospace" : "inherit"};
            ${mode === "ticket" ? "box-shadow: 0 0 20px rgba(0,0,0,0.1);" : ""}
          }
        }
      `}</style>

      {/* En-tête */}
      <div className="text-center mb-3 pb-2 border-b border-dashed border-gray-300">
        <div className="text-lg font-bold">
          {appConfig.logoEmoji} {appConfig.nomEtablissement}
        </div>
        <div className="text-xs font-semibold uppercase mt-0.5">{appConfig.service}</div>
        {appConfig.adresse && <div className="text-[10px]">{appConfig.adresse}</div>}
        {appConfig.telephone && <div className="text-[10px]">📞 {appConfig.telephone}</div>}
      </div>

      {/* Titre */}
      <div className="text-center mb-2 py-1 bg-gray-100 rounded">
        <div className="font-bold text-sm uppercase">
          {mode === "recu" ? "RECU DE PAIEMENT" : "FICHE INDIVIDUELLE DE PAIEMENT"}
        </div>
        <div className="text-xs">Heures Complémentaires</div>
      </div>

      {/* Infos état */}
      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>État N°:</span>
          <span className="font-bold">{data.numeroEtat}</span>
        </div>
        <div className="flex justify-between">
          <span>Année Univ.:</span>
          <span className="font-bold">{data.annee.libelle}</span>
        </div>
        <div className="flex justify-between">
          <span>Tranche:</span>
          <span className="font-bold">{data.annee.tranche}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{dateStr} {heureStr}</span>
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-dashed border-gray-300 my-2" />

      {/* Enseignant */}
      <div className="text-xs space-y-0.5 mb-2">
        <div className="font-bold">{data.enseignant.nomPrenom}</div>
        {data.enseignant.cin && <div>CIN: {data.enseignant.cin}</div>}
        {data.enseignant.grade && <div>Grade: {data.enseignant.grade}</div>}
        <div>Statut: {data.enseignant.statut}</div>
        {data.enseignant.etablissementPrincipal && (
          <div>Établissement: {data.enseignant.etablissementPrincipal}</div>
        )}
        {data.enseignant.rib && <div>RIB: {data.enseignant.rib}</div>}
      </div>

      {/* Séparateur */}
      <div className="border-t border-dashed border-gray-300 my-2" />

      {/* Détail heures */}
      <div className="text-xs mb-2">
        <div className="font-semibold mb-1">Détail des heures</div>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-0.5">Structure</th>
              <th className="text-center py-0.5">ET</th>
              <th className="text-center py-0.5">ED</th>
              <th className="text-center py-0.5">EP</th>
              <th className="text-center py-0.5">Sout</th>
              <th className="text-center py-0.5">Rech</th>
              <th className="text-center py-0.5">Tot</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.detailsParFaculte).map(([etab, rows]) =>
              rows.map((r: any, i: number) => {
                const tot = (r.et || 0) + (r.ed || 0) + (r.ep || 0) + (r.sout || 0) + (r.rech || 0);
                return (
                  <tr key={`${etab}-${i}`} className="border-b border-gray-100">
                    <td className="py-0.5 text-[9px]">
                      {r.mention}
                      {r.parcours ? ` - ${r.parcours}` : ""}
                    </td>
                    <td className="text-center py-0.5">{r.et || "-"}</td>
                    <td className="text-center py-0.5">{r.ed || "-"}</td>
                    <td className="text-center py-0.5">{r.ep || "-"}</td>
                    <td className="text-center py-0.5">{r.sout || "-"}</td>
                    <td className="text-center py-0.5">{r.rech || "-"}</td>
                    <td className="text-center py-0.5 font-bold">{tot}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Séparateur */}
      <div className="border-t border-dashed border-gray-300 my-2" />

      {/* Calculs */}
      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>HC Brut:</span>
          <span>{data.totaux.hcBrut.toFixed(2)} h</span>
        </div>
        <div className="flex justify-between">
          <span>Obligation:</span>
          <span>{data.totaux.obligation} h</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>HC Nette (arrondie):</span>
          <span>{data.totaux.hcArrondi} h</span>
        </div>
        <div className="flex justify-between">
          <span>Taux horaire:</span>
          <span>{formatAriary(data.calculs.taux)} Ar/h</span>
        </div>
        <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
          <span>MONTANT BRUT:</span>
          <span>{formatAriary(data.calculs.montantBrut)} Ar</span>
        </div>
        {data.calculs.appliquerIRSA ? (
          <div className="flex justify-between text-red-600">
            <span>IRSA ({data.calculs.tauxIRSA}%):</span>
            <span>-{formatAriary(data.calculs.montantIRSA)} Ar</span>
          </div>
        ) : (
          <div className="flex justify-between text-green-600">
            <span>IRSA:</span>
            <span>Non appliqué</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Montant Net:</span>
          <span>{formatAriary(data.calculs.montantNet)} Ar</span>
        </div>
        {data.calculs.totalAvance > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>Avance:</span>
            <span>-{formatAriary(data.calculs.totalAvance)} Ar</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-2 border-gray-800 rounded p-2 my-2 text-center bg-gray-50">
        <div className="text-xs font-bold uppercase">NET À PAYER</div>
        <div className="text-lg font-bold">{formatAriary(data.calculs.netAPayer)} {appConfig.devise}</div>
        <div className="text-[9px] italic mt-1">{data.calculs.netEnLettres}</div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-3 border-t border-gray-300">
        <div className="text-center text-[9px]">
          <div className="mb-8">L'intéressé(e)</div>
          <div className="border-t border-gray-400 pt-1">Signature</div>
        </div>
        <div className="text-center text-[9px]">
          <div className="mb-8 font-semibold">{appConfig.responsableNom}</div>
          <div className="text-[8px]">{appConfig.responsableFonction}</div>
          <div className="border-t border-gray-400 pt-1 mt-1">Cachet et Signature</div>
        </div>
      </div>

      {/* Pied */}
      <div className="text-center text-[9px] mt-4 pt-2 border-t border-dashed border-gray-300 text-gray-500">
        <div>{appConfig.piedTicket}</div>
        <div className="mt-1 text-[8px]">{appConfig.nomEtablissement} — {appConfig.pays}</div>
        <div className="text-[7px]">Imprimé le {dateStr} à {heureStr}</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Boutons d'action */}
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="flex gap-2">
          <button
            onClick={printTicket}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 shadow"
          >
            <Printer size={16} /> Imprimer
          </button>
          <button
            onClick={() => window.open(`/api/export/excel?anneeId=${data.annee.libelle}`, "_blank")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
          >
            Export Excel
          </button>
        </div>
        <div className="flex gap-2 text-xs text-slate-500">
          <span>Mode: {mode === "ticket" ? "Ticket thermique" : "Fiche A4"}</span>
        </div>
      </div>

      {/* Ticket */}
      {ticketContent}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTION UTILITAIRE: Impression directe ticket (comme LogBara printTicket)
// ═══════════════════════════════════════════════════════════════════════════════

export function buildTicketHtml(content: string, config?: any): string {
  const cfg = config || {
    nomEtablissement: "HC-Manager",
    logoEmoji: "🎓",
    piedTicket: "Merci de votre collaboration !",
    devise: "Ariary",
    pays: "Madagascar",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - HC-Manager</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    body {
      width: 80mm;
      margin: 0;
      padding: 2mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .separator { border-top: 1px dashed #000; margin: 2mm 0; }
    .right { text-align: right; }
    .inline { display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 0.5mm 1mm; font-size: 8pt; }
    .total-box { border: 1px solid #000; padding: 2mm; text-align: center; margin: 2mm 0; }
    .footer { text-align: center; font-size: 7pt; color: #666; margin-top: 3mm; }
  </style>
</head>
<body>
  <div class="center bold">${cfg.logoEmoji} ${cfg.nomEtablissement}</div>
  <div class="separator"></div>
  ${content}
  <div class="separator"></div>
  <div class="footer">
    ${cfg.piedTicket}<br>
    ${cfg.nomEtablissement} — ${cfg.pays}<br>
    Imprimé le ${new Date().toLocaleDateString("fr-FR")}
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

export function printTicketDirect(content: string, config?: any) {
  const html = buildTicketHtml(content, config);
  const printWindow = window.open("", "_blank", "width=350,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        try { printWindow.close(); } catch { /* ignore */ }
      }, 1500);
    };
  }
}

export function printTicketPreview(content: string, config?: any) {
  const html = buildTicketHtml(content, config);
  const printWindow = window.open("", "_blank", "width=350,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
