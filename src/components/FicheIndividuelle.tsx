"use client";
import { formatAriary, ETABLISSEMENTS_TOLIARA } from "@/lib/metier";

interface EtabData {
  ET: number; ED: number; EP: number; Sout: number; Rech: number;
}

interface FicheData {
  enseignant: {
    nomPrenom: string; grade: string; gradeLibelle: string;
    rib: string; cin: string; statut: string;
  };
  annee: { libelle: string; tranche: string };
  numeroEtat: string;
  calculs: {
    etabData: Record<string, EtabData>;
    totaux: { et: number; ed: number; ep: number; soutenance: number; recherche: number };
    totalHC: number; obligation: number; hcNette: number; hcArrondi: number;
    taux: number; montantBrut: number; avanceTotal: number;
    netPayer: number; lettres: string;
  };
}

export default function FicheIndividuelle({ data }: { data: FicheData }) {
  const { enseignant, annee, numeroEtat, calculs } = data;
  const today = new Date().toLocaleDateString("fr-MG");

  const etabs = ETABLISSEMENTS_TOLIARA;

  return (
    <div
      id="fiche-print"
      className="bg-white p-6 rounded-xl border border-gray-200 shadow text-sm font-['Calibri',sans-serif] max-w-3xl mx-auto print:shadow-none print:border-0"
    >
      {/* En-tête */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs leading-5">
          <p className="font-bold">MINISTERE DE L&apos;ENSEIGNEMENT SUPERIEUR</p>
          <p className="font-bold">ET DE LA RECHERCHE SCIENTIFIQUE</p>
          <p className="font-bold">UNIVERSITE DE TOLIARA</p>
          <p className="font-bold">SERVICE FINANCIER</p>
        </div>
        <div className="bg-yellow-100 border border-yellow-300 rounded px-4 py-2 text-center">
          <p className="font-bold text-sm">{annee.tranche}</p>
        </div>
      </div>

      {/* Titre */}
      <div className="bg-indigo-900 text-white text-center py-2 rounded-t-lg mt-3">
        <p className="font-bold text-base">ETAT DE PAIEMENT DES HEURES COMPLEMENTAIRES</p>
      </div>
      <div className="flex items-center justify-between bg-indigo-800 text-white px-4 py-1">
        <p className="font-semibold text-sm">ANNEE UNIVERSITAIRE : {annee.libelle}</p>
        <p className="font-bold text-lg">N° {String(numeroEtat).padStart(4, "0")}</p>
      </div>

      {/* Infos enseignant */}
      <div className="border border-gray-300 p-3 mt-2 rounded-b-lg bg-blue-50 grid grid-cols-2 gap-x-6 gap-y-1">
        <div>
          <span className="font-bold">Nom et Prénom : </span>
          <span className="font-bold text-indigo-900">{enseignant.nomPrenom}</span>
        </div>
        <div>
          <span className="font-bold">RIB : </span>
          <span>{enseignant.rib || "—"}</span>
        </div>
        <div>
          <span className="font-bold">Grade : </span>
          <span>{enseignant.grade}</span>
        </div>
        <div>
          <span className="font-bold">Statut : </span>
          <span>{enseignant.statut}</span>
        </div>
      </div>

      {/* Tableau des heures */}
      <table className="w-full mt-4 border-collapse text-xs">
        <thead>
          <tr className="bg-indigo-900 text-white">
            <th className="border border-gray-400 px-2 py-1.5 text-left" rowSpan={2}>ETABLISSEMENT</th>
            <th className="border border-gray-400 px-2 py-1.5 text-center" colSpan={5}>HEURES</th>
            <th className="border border-gray-400 px-2 py-1.5 text-center" rowSpan={2}>HC</th>
            <th className="border border-gray-400 px-2 py-1.5 text-center" rowSpan={2}>HC ARRONDI</th>
          </tr>
          <tr className="bg-indigo-700 text-white">
            {["ET","ED","EP","Sout/Enc","Rech"].map((h) => (
              <th key={h} className="border border-gray-400 px-2 py-1 text-center">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {etabs.map((etab, idx) => {
            const d = calculs.etabData[etab] || { ET:0,ED:0,EP:0,Sout:0,Rech:0 };
            const hc = (d.ET||0)+(d.ED||0)+(d.EP||0)+(d.Sout||0)+(d.Rech||0);
            return (
              <tr key={etab} className={idx % 2 === 0 ? "bg-blue-50/40" : "bg-white"}>
                <td className="border border-gray-300 px-2 py-1 font-medium">{etab}</td>
                {[d.ET,d.ED,d.EP,d.Sout,d.Rech].map((v,i) => (
                  <td key={i} className="border border-gray-300 px-2 py-1 text-center">
                    {v ? v.toFixed(2) : "-"}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-1 text-center font-semibold">
                  {hc ? hc.toFixed(2) : "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">-</td>
              </tr>
            );
          })}

          {/* Ligne Total */}
          <tr className="bg-indigo-100 font-bold">
            <td className="border border-gray-400 px-2 py-1">Total</td>
            {[calculs.totaux.et, calculs.totaux.ed, calculs.totaux.ep,
              calculs.totaux.soutenance, calculs.totaux.recherche].map((v,i) => (
              <td key={i} className="border border-gray-400 px-2 py-1 text-center">
                {v ? v.toFixed(2) : "-"}
              </td>
            ))}
            <td className="border border-gray-400 px-2 py-1 text-center">
              {calculs.totalHC.toFixed(2)}
            </td>
            <td className="border border-gray-400 px-2 py-1 text-center font-bold text-indigo-900 bg-yellow-100">
              {calculs.hcArrondi}
            </td>
          </tr>

          {/* Obligation */}
          <tr>
            <td colSpan={6} className="border border-gray-300 px-2 py-1 font-medium">Obligation</td>
            <td className="border border-gray-300 px-2 py-1 text-center text-red-700 font-bold">
              {calculs.obligation ? `-${calculs.obligation}` : "-"}
            </td>
            <td className="border border-gray-300 px-2 py-1"></td>
          </tr>
        </tbody>
      </table>

      {/* Récapitulatif financier */}
      <div className="mt-3 space-y-0.5">
        {[
          ["HC",              calculs.hcArrondi + " h"],
          ["Taux (Ar)",       formatAriary(calculs.taux)],
          ["Total brut (Ar)", formatAriary(calculs.montantBrut)],
        ].map(([lbl, val]) => (
          <div key={lbl} className="flex justify-between border border-gray-200 bg-emerald-50 px-4 py-1.5">
            <span className="font-medium text-gray-700">{lbl}</span>
            <span className="font-bold text-indigo-900">{val}</span>
          </div>
        ))}

        <div className="flex justify-between border-2 border-green-600 bg-green-700 text-white px-4 py-2 rounded-lg mt-1">
          <span className="font-bold text-sm">
            TOTAL DE PAIEMENT {annee.tranche.toUpperCase()}
          </span>
          <span className="font-bold text-lg">
            {formatAriary(calculs.netPayer)}
          </span>
        </div>
      </div>

      {/* Arrêté en lettres */}
      <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
        <p className="text-xs font-bold text-indigo-900">
          Arrêté le présent état de Paiement à la somme de :
        </p>
        <p className="text-sm font-bold text-indigo-800 mt-1 uppercase">
          {calculs.lettres}
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-xs">
          <p className="font-medium">Date d&apos;impression : {today}</p>
          <p className="mt-4 border-t border-gray-400 pt-2">
            Pour acquit à Toliara, le ……………
          </p>
          <p className="text-gray-500 mt-1">
            (signature, N° de la CIN + date et lieu de délivrance)
          </p>
        </div>
        <div className="text-xs text-center">
          <p className="font-bold">Le Gestionnaire</p>
          <div className="mt-10 border-t border-gray-400 pt-1">
            <p className="text-gray-500">Signature et cachet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
