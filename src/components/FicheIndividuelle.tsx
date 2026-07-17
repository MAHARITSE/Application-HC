"use client";
import { formatAriary } from "@/lib/metier";

interface FicheData {
  enseignant: { nomPrenom: string; grade?: string; rib?: string; cin?: string; statut: string };
  annee: { libelle: string; tranche: string };
  numeroEtat: string;
  calculs: any;
}

export default function FicheIndividuelleOld({ data }: { data: FicheData }) {
  return (
    <div className="bg-white p-4 rounded border text-sm">
      <h3 className="font-bold">Fiche – {data.enseignant.nomPrenom}</h3>
      <p className="text-xs text-slate-500">Année {data.annee.libelle} – {data.annee.tranche} – N° {data.numeroEtat}</p>
      <p className="mt-2">Legacy component – utilisez la fiche intégrée dans la page principale.</p>
    </div>
  );
}
