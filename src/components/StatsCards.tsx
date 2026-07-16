"use client";

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

interface StatsCardsProps {
  enseignants: EnseignantRow[];
}

export function StatsCards({ enseignants }: StatsCardsProps) {
  const totalEnseignants = enseignants.length;
  const permanents = enseignants.filter((e) => e.statut === "Permanent").length;
  const vacataires = enseignants.filter((e) => e.statut === "Vacataire").length;

  let totalHeures = 0;
  let totalNet = 0;

  enseignants.forEach((e) => {
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
    const net = calculerNetAPayer(montantBrut, isra, avance);

    totalHeures += hcBrut;
    totalNet += net;
  });

  const cards = [
    {
      label: "Total Enseignants",
      value: totalEnseignants.toString(),
      sub: `${permanents} perm. · ${vacataires} vac.`,
      color: "from-blue-500 to-blue-600",
      icon: "👥",
    },
    {
      label: "Total Heures HC",
      value: totalHeures.toFixed(0) + " h",
      sub: "Heures complémentaires brutes",
      color: "from-emerald-500 to-emerald-600",
      icon: "⏱️",
    },
    {
      label: "Montant Total Net",
      value: formatAriary(totalNet),
      sub: "Somme des nets à payer",
      color: "from-amber-500 to-amber-600",
      icon: "💰",
    },
    {
      label: "Établissements",
      value: new Set(enseignants.map((e) => e.etablissement)).size.toString(),
      sub: "Établissements distincts",
      color: "from-purple-500 to-purple-600",
      icon: "🏛️",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                {card.label}
              </span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-0.5">
              {card.value}
            </div>
            <div className="text-xs text-slate-400">{card.sub}</div>
          </div>
          <div className={`h-1 bg-gradient-to-r ${card.color}`} />
        </div>
      ))}
    </div>
  );
}
