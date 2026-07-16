"use client";
import { useState, useEffect, useCallback } from "react";
import { calcHC, calcHCNette, formatAriary, TAUX_GRADE } from "@/lib/metier";
import { Trash2, Plus, RefreshCw } from "lucide-react";

interface Faculte {
  id: number;
  etablissement: string;
  mention: string | null;
  parcours: string | null;
  niveau: string | null;
}

interface HeureLigne {
  id?: number;
  etablissement: string;
  niveau: string;
  et: number;
  ed: number;
  ep: number;
  soutenance: number;
  recherche: number;
  avance: number;
  dateAvance: string;
  numeroEtat: string;
  tranche: string;
  faculteParcoursId?: number;
}

interface Props {
  enseignantId: number;
  anneeId: number;
  gradeCode: string;
  statut: string;
  facultes: Faculte[];
}

const TRANCHES = ["Première tranche", "Deuxième tranche", "Troisième tranche"];
const NIVEAUX  = ["L1","L2","L3","M1","M2","D1","D2","D3"];
const ETABLISSEMENTS = [
  "CURA","DRGS","ENS","FAC LETTRES","IES-ANOSY",
  "IES-Menabe","IES-Toliara","IHSM","MEDECINE","SCIENCES",
];

const EMPTY_LIGNE: HeureLigne = {
  etablissement: "", niveau: "", et: 0, ed: 0, ep: 0,
  soutenance: 0, recherche: 0, avance: 0,
  dateAvance: "", numeroEtat: "", tranche: "Première tranche",
};

export default function HeuresForm({
  enseignantId, anneeId, gradeCode, statut, facultes,
}: Props) {
  const [lignes, setLignes]   = useState<(HeureLigne & { id?: number })[]>([]);
  const [form,   setForm]     = useState<HeureLigne>({ ...EMPTY_LIGNE });
  const [editId, setEditId]   = useState<number | null>(null);
  const [saving, setSaving]   = useState(false);
  const taux = TAUX_GRADE[gradeCode] ?? 0;

  const loadLignes = useCallback(async () => {
    const res = await fetch(
      `/api/heures?enseignantId=${enseignantId}&anneeId=${anneeId}`
    );
    const data = await res.json();
    setLignes(data);
  }, [enseignantId, anneeId]);

  useEffect(() => { loadLignes(); }, [loadLignes]);

  const setF = (key: keyof HeureLigne, val: string | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Totaux globaux
  const totalET   = lignes.reduce((s, l) => s + (l.et || 0), 0);
  const totalED   = lignes.reduce((s, l) => s + (l.ed || 0), 0);
  const totalEP   = lignes.reduce((s, l) => s + (l.ep || 0), 0);
  const totalSout = lignes.reduce((s, l) => s + (l.soutenance || 0), 0);
  const totalRech = lignes.reduce((s, l) => s + (l.recherche || 0), 0);
  const totalAvance = lignes.reduce((s, l) => s + (l.avance || 0), 0);
  const totalHC   = calcHC(totalET, totalED, totalEP, totalSout, totalRech);
  const { hcNette, obligation } = calcHCNette(totalHC, gradeCode, statut);
  const hcArrondi = Math.floor(hcNette);
  const montantBrut = hcArrondi * taux;
  const netPayer    = montantBrut - totalAvance;

  const handleSave = async () => {
    if (!form.etablissement) { alert("Établissement obligatoire"); return; }
    setSaving(true);
    try {
      const payload = {
        anneeId, enseignantId,
        faculteParcoursId: form.faculteParcoursId || null,
        ...form,
      };
      if (editId) {
        await fetch("/api/heures", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await fetch("/api/heures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setForm({ ...EMPTY_LIGNE });
      setEditId(null);
      await loadLignes();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (l: HeureLigne & { id?: number }) => {
    setEditId(l.id ?? null);
    setForm({ ...l });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette ligne ?")) return;
    await fetch(`/api/heures?id=${id}`, { method: "DELETE" });
    await loadLignes();
  };

  const numInput = (label: string, key: keyof HeureLigne) => (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type="number"
        step="0.5"
        min="0"
        value={form[key] as number || ""}
        onChange={(e) => setF(key, parseFloat(e.target.value) || 0)}
        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Formulaire de saisie */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
          {editId ? "✏️ Modifier la ligne" : "➕ Ajouter une ligne d'heures"}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {/* Établissement */}
          <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-gray-500">Établissement *</label>
            <select
              value={form.etablissement}
              onChange={(e) => setF("etablissement", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Choisir —</option>
              {ETABLISSEMENTS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Niveau */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">Niveau</label>
            <select
              value={form.niveau}
              onChange={(e) => setF("niveau", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">—</option>
              {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Parcours */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">Parcours/Mention</label>
            <select
              value={form.faculteParcoursId || ""}
              onChange={(e) => setF("faculteParcoursId", Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">—</option>
              {facultes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.mention || ""}{f.parcours ? ` – ${f.parcours}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Heures */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
          {numInput("ET", "et")}
          {numInput("ED", "ed")}
          {numInput("EP", "ep")}
          {numInput("Soutenance", "soutenance")}
          {numInput("Recherche", "recherche")}
        </div>

        {/* Avance & infos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {numInput("Avance (Ar)", "avance")}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">Date avance</label>
            <input
              type="date"
              value={form.dateAvance}
              onChange={(e) => setF("dateAvance", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">N° État</label>
            <input
              type="text"
              value={form.numeroEtat}
              onChange={(e) => setF("numeroEtat", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-500">Tranche</label>
            <select
              value={form.tranche}
              onChange={(e) => setF("tranche", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {TRANCHES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2"
          >
            <Plus size={16} />
            {saving ? "..." : editId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => { setForm({ ...EMPTY_LIGNE }); setEditId(null); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw size={14} /> Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Tableau des lignes */}
      {lignes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-indigo-900 text-white">
              <tr>
                {["Établissement","Niv.","ET","ED","EP","Sout.","Rech.","HC","Avance","Tranche",""].map((h) => (
                  <th key={h} className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, idx) => {
                const hc = calcHC(l.et, l.ed, l.ep, l.soutenance, l.recherche);
                return (
                  <tr
                    key={l.id ?? idx}
                    className={`cursor-pointer border-b ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-indigo-50`}
                    onClick={() => handleEdit(l)}
                  >
                    <td className="px-3 py-2 font-medium">{l.etablissement}</td>
                    <td className="px-3 py-2 text-center">{l.niveau || "-"}</td>
                    <td className="px-3 py-2 text-center">{l.et || "-"}</td>
                    <td className="px-3 py-2 text-center">{l.ed || "-"}</td>
                    <td className="px-3 py-2 text-center">{l.ep || "-"}</td>
                    <td className="px-3 py-2 text-center">{l.soutenance || "-"}</td>
                    <td className="px-3 py-2 text-center">{l.recherche || "-"}</td>
                    <td className="px-3 py-2 text-center font-semibold text-indigo-700">
                      {hc.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center text-orange-700">
                      {l.avance ? l.avance.toLocaleString("fr-MG") : "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{l.tranche}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(l.id!); }}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl p-5 text-white">
        <h3 className="text-sm font-bold mb-4 opacity-80 uppercase tracking-widest">
          📊 Récapitulatif automatique
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "HC Brut",     value: `${totalHC.toFixed(2)} h`,       color: "text-white" },
            { label: "Obligation",  value: obligation ? `- ${obligation} h` : "Aucune", color: "text-orange-300" },
            { label: "HC Net",      value: `${hcNette.toFixed(2)} h`,        color: "text-green-300" },
            { label: "HC Arrondi",  value: `${hcArrondi} h`,                 color: "text-yellow-300" },
            { label: "Taux",        value: formatAriary(taux),               color: "text-blue-300" },
            { label: "Montant Brut",value: formatAriary(montantBrut),        color: "text-white" },
            { label: "Avance",      value: formatAriary(totalAvance),        color: "text-orange-300" },
            { label: "NET À PAYER", value: formatAriary(netPayer),           color: "text-2xl font-bold text-yellow-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs opacity-70 mb-1">{label}</p>
              <p className={`font-bold text-sm ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
