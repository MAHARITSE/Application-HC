"use client";

import { useState } from "react";
import type { EnseignantRow } from "@/lib/types";
import {
  TAUX_PAR_GRADE,
  calculerHC,
  calculerHeuresAPayer,
  calculerMontantBrut,
  calculerISRA,
  calculerNetAPayer,
  formatAriary,
} from "@/lib/constants";

interface DashboardProps {
  enseignants: EnseignantRow[];
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onExportExcel: () => void;
  onExportFiche: (id: number) => void;
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-slate-100 text-slate-700 border-slate-300",
    MC: "bg-blue-50 text-blue-700 border-blue-200",
    PR: "bg-amber-50 text-amber-700 border-amber-200",
    PRT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colors[grade] || "bg-gray-100 text-gray-700"}`}
    >
      {grade}
    </span>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const isPerm = statut === "Permanent";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isPerm
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-orange-50 text-orange-700 border border-orange-200"
      }`}
    >
      {isPerm ? "⬤ " : "◯ "}
      {statut}
    </span>
  );
}

export function Dashboard({
  enseignants,
  loading,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onExportExcel,
  onExportFiche,
}: DashboardProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Liste des Enseignants
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {enseignants.length} enseignant{enseignants.length !== 1 ? "s" : ""}{" "}
              enregistré{enseignants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Rechercher par nom ou établissement..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={onExportExcel}
              className="px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Chargement...</span>
            </div>
          </div>
        ) : enseignants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-lg font-medium">Aucun enseignant trouvé</p>
            <p className="text-sm mt-1">
              {search
                ? "Essayez un autre terme de recherche"
                : "Cliquez sur \"+ Ajouter\" pour commencer"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Enseignant
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Grade
                </th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Établissement
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  HC Brut
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  H. à payer
                </th>
                <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Net à payer
                </th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enseignants.map((e) => {
                const et = parseFloat(e.heuresET || "0");
                const ed = parseFloat(e.heuresED || "0");
                const ep = parseFloat(e.heuresEP || "0");
                const soutenance = parseFloat(e.heuresSoutenance || "0");
                const recherche = parseFloat(e.heuresRecherche || "0");
                const avance = parseFloat(e.avance || "0");

                const hcBrut = calculerHC(et, ed, ep, soutenance, recherche);
                const heuresPayer = calculerHeuresAPayer(hcBrut, e.statut);
                const montantBrut = calculerMontantBrut(heuresPayer, e.grade);
                const isra = calculerISRA(montantBrut, e.statut);
                const netPayer = calculerNetAPayer(montantBrut, isra, avance);
                const isExpanded = expandedId === e.id;

                return (
                  <tr
                    key={e.id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {e.nom} {e.prenoms}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <GradeBadge grade={e.grade} />
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-xs">
                      {e.etablissement}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatutBadge statut={e.statut} />
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {hcBrut}h
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {heuresPayer}h
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-navy-800">
                      {formatAriary(netPayer)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : e.id)
                          }
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Détails"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEdit(e.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onExportFiche(e.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Fiche individuelle"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(e.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expanded Detail Panel */}
      {expandedId !== null && (
        <ExpandedDetail
          enseignant={enseignants.find((e) => e.id === expandedId)!}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

function ExpandedDetail({
  enseignant: e,
  onClose,
}: {
  enseignant: EnseignantRow;
  onClose: () => void;
}) {
  if (!e) return null;

  const et = parseFloat(e.heuresET || "0");
  const ed = parseFloat(e.heuresED || "0");
  const ep = parseFloat(e.heuresEP || "0");
  const soutenance = parseFloat(e.heuresSoutenance || "0");
  const recherche = parseFloat(e.heuresRecherche || "0");
  const avance = parseFloat(e.avance || "0");

  const hcBrut = calculerHC(et, ed, ep, soutenance, recherche);
  const heuresPayer = calculerHeuresAPayer(hcBrut, e.statut);
  const taux = TAUX_PAR_GRADE[e.grade] || 0;
  const montantBrut = calculerMontantBrut(heuresPayer, e.grade);
  const isra = calculerISRA(montantBrut, e.statut);
  const netPayer = calculerNetAPayer(montantBrut, isra, avance);

  return (
    <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Détails — {e.nom} {e.prenoms}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hours breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-3">
            Répartition des heures
          </h4>
          <div className="space-y-2">
            {[
              { label: "ET (Théorique)", val: et },
              { label: "ED (Dirigé)", val: ed },
              { label: "EP (Pratique)", val: ep },
              { label: "Soutenance", val: soutenance },
              { label: "Recherche", val: recherche },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center"
              >
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-sm font-mono font-medium text-slate-700">
                  {item.val}h
                </span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">
                Total HC Brut
              </span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {hcBrut}h
              </span>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-3">
            Calcul du paiement
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Heures à payer</span>
              <span className="font-mono font-medium">{heuresPayer}h</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Taux horaire ({e.grade})</span>
              <span className="font-mono font-medium">
                {formatAriary(taux)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Montant Brut</span>
              <span className="font-mono font-medium">
                {formatAriary(montantBrut)}
              </span>
            </div>
            {e.statut === "Vacataire" && (
              <div className="flex justify-between text-xs text-red-600">
                <span>ISRA (20%)</span>
                <span className="font-mono">-{formatAriary(isra)}</span>
              </div>
            )}
            {avance > 0 && (
              <div className="flex justify-between text-xs text-orange-600">
                <span>Avance{e.dateAvance ? ` (${e.dateAvance})` : ""}</span>
                <span className="font-mono">-{formatAriary(avance)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-700">
                Net à payer
              </span>
              <span className="text-base font-mono font-bold text-emerald-700">
                {formatAriary(netPayer)}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-3">
            Informations
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Établissement</span>
              <span className="font-medium text-right max-w-[60%]">
                {e.etablissement}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Statut</span>
              <span className="font-medium">{e.statut}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">RIB</span>
              <span className="font-mono text-xs">
                {e.rib || "Non renseigné"}
              </span>
            </div>
            {e.statut === "Permanent" && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                ℹ️ Obligation de service : 125h déduites du HC brut
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
