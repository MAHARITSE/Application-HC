"use client";
import { useState, useEffect, useCallback } from "react";
import { calcHC, calcHCNette, formatAriary, TAUX_GRADE } from "@/lib/metier";
import { Trash2, Plus, RefreshCw } from "lucide-react";

interface Props {
  enseignantId: number;
  anneeId: number;
  gradeCode: string;
  statut: string;
  facultes: any[];
}

export default function HeuresForm({ enseignantId, anneeId, gradeCode, statut }: Props) {
  const [lignes, setLignes] = useState<any[]>([]);
  const taux = (TAUX_GRADE as any)[gradeCode] ?? 0;

  const load = useCallback(async () => {
    const res = await fetch(`/api/heures?enseignantId=${enseignantId}&anneeId=${anneeId}`);
    const data = await res.json();
    setLignes(Array.isArray(data) ? data : []);
  }, [enseignantId, anneeId]);

  useEffect(() => { load(); }, [load]);

  const totalET = lignes.reduce((s: number, l: any) => s + (l.heuresET || l.heures?.heuresET || 0), 0);
  const totalED = lignes.reduce((s: number, l: any) => s + (l.heuresED || l.heures?.heuresED || 0), 0);
  const totalEP = lignes.reduce((s: number, l: any) => s + (l.heuresEP || l.heures?.heuresEP || 0), 0);
  const totalSout = lignes.reduce((s: number, l: any) => s + (l.heuresSoutenance || l.heures?.heuresSoutenance || 0), 0);
  const totalRech = lignes.reduce((s: number, l: any) => s + (l.heuresRecherche || l.heures?.heuresRecherche || 0), 0);
  const totalHC = calcHC(totalET, totalED, totalEP, totalSout, totalRech);
  const { hcNette, obligationAppliquee } = calcHCNette(totalHC, 125, statut);
  const hcArrondi = Math.floor(hcNette);
  const montantBrut = hcArrondi * taux;

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border">
        <p className="text-sm text-slate-600">Total HC: {totalHC}h - Obligation: {obligationAppliquee}h - Net: {hcNette}h - Arrondi: {hcArrondi}h - Brut: {formatAriary(montantBrut)}</p>
        <button onClick={load} className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm flex items-center gap-1"><RefreshCw size={12}/> Recharger</button>
      </div>
      <div className="space-y-2">
        {lignes.map((l: any, idx: number) => (
          <div key={l.id || idx} className="p-2 bg-white border rounded flex justify-between text-xs">
            <span>ET:{l.heuresET || l.heures?.heuresET || 0} ED:{l.heuresED || l.heures?.heuresED || 0} EP:{l.heuresEP || l.heures?.heuresEP || 0}</span>
            <button onClick={async()=>{ if(l.id){ await fetch(`/api/heures/${l.id}`,{method:'DELETE'}); load(); } }} className="text-red-500"><Trash2 size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
