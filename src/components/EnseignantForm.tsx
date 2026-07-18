"use client";
import { useState, useEffect } from "react";
import { toUpperCase, toTitleCase, formatTelephoneInput, formatRIBInput } from "@/lib/formatters";

interface EnseignantFormData {
  nom: string;
  prenom: string;
  cin: string;
  dateCIN: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  telephone: string;
  email: string;
  rib: string;
  specialite: string;
  etablissementPrincipal: string;
  dateRecrutement: string;
  gradeId: string; // Grade au moment de la saisie
}

interface Props {
  initialData?: Partial<EnseignantFormData>;
  etablissements?: string[];
  grades?: Array<{ id: number; code: string; libelle: string }>;
  onSave: (data: EnseignantFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY: EnseignantFormData = {
  nom: "",
  prenom: "",
  cin: "",
  dateCIN: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "Malagasy",
  adresse: "",
  telephone: "",
  email: "",
  rib: "",
  specialite: "",
  etablissementPrincipal: "",
  dateRecrutement: "",
  gradeId: "",
};

export default function EnseignantForm({ initialData, etablissements = [], onSave, onCancel, loading }: Props) {
  const [form, setForm] = useState<EnseignantFormData>({ ...EMPTY, ...initialData } as any);

  useEffect(() => {
    setForm({ ...EMPTY, ...initialData } as any);
  }, [initialData]);

  const set = (key: keyof EnseignantFormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleNomChange = (v: string) => set("nom", toUpperCase(v));
  const handlePrenomChange = (v: string) => set("prenom", toTitleCase(v));
  const handleAdresseChange = (v: string) => set("adresse", toTitleCase(v));
  const handleTelChange = (v: string) => set("telephone", formatTelephoneInput(v));
  const handleRibChange = (v: string) => set("rib", formatRIBInput(v));

  const telDigits = form.telephone.replace(/\D/g, "");
  const ribDigits = form.rib.replace(/\D/g, "");
  const telephoneIncoherent = form.telephone.trim().length > 0 && telDigits.length !== 10;
  const ribIncoherent = form.rib.trim().length > 0 && ribDigits.length !== 23;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      alert("Nom obligatoire (sera converti en MAJUSCULES)");
      return;
    }
    await onSave(form);
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white";
  const warningInputClass = "w-full px-3 py-2 border border-orange-400 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Identité</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Nom * (MAJUSCULES automatiques)</label>
            <input value={form.nom} onChange={(e) => handleNomChange(e.target.value)} required placeholder="RAKOTO" className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-1">Ex: RAKOTO</p>
          </div>
          <div>
            <label className={labelClass}>Prénom (Title Case)</label>
            <input value={form.prenom} onChange={(e) => handlePrenomChange(e.target.value)} placeholder="Jean Pierre" className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-1">Ex: Jean Pierre</p>
          </div>
          <div>
            <label className={labelClass}>CIN</label>
            <input value={form.cin} onChange={(e) => set("cin", e.target.value)} placeholder="102 123 456 789" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date de délivrance CIN</label>
            <input type="date" value={form.dateCIN} onChange={(e) => set("dateCIN", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nationalité</label>
            <input value={form.nationalite} onChange={(e) => set("nationalite", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date de naissance</label>
            <input type="date" value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Lieu de naissance</label>
            <input value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Contact & Banque</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Téléphone (000 00 000 00)</label>
            <input value={form.telephone} onChange={(e) => handleTelChange(e.target.value)} placeholder="034 12 345 67" className={telephoneIncoherent ? warningInputClass : inputClass} />
            {telephoneIncoherent && <p className="text-[10px] text-orange-600 mt-1">⚠️ Téléphone incohérent : 10 chiffres attendus.</p>}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="exemple@univ.mg" className={inputClass} />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass}>Adresse (Title Case)</label>
            <input value={form.adresse} onChange={(e) => handleAdresseChange(e.target.value)} placeholder="Lot II A 25 Andravohangy" className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>RIB (00005 00001 12094250100 09)</label>
            <input value={form.rib} onChange={(e) => handleRibChange(e.target.value)} placeholder="00005 00001 12094250100 09" className={ribIncoherent ? warningInputClass : inputClass} />
            {ribIncoherent && <p className="text-[10px] text-orange-600 mt-1">⚠️ RIB incohérent : 23 chiffres attendus.</p>}
          </div>
          <div>
            <label className={labelClass}>Spécialité</label>
            <input value={form.specialite} onChange={(e) => set("specialite", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Informations Professionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Établissement principal</label>
            <input value={form.etablissementPrincipal} onChange={(e) => set("etablissementPrincipal", e.target.value)} list="etablissements-principaux-list" placeholder="Université de Toliara" className={inputClass} />
            <datalist id="etablissements-principaux-list">
              {etablissements.map((etab) => (
                <option key={etab} value={etab} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Date de recrutement</label>
            <input type="date" value={form.dateRecrutement} onChange={(e) => set("dateRecrutement", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Grade au moment de la saisie (base enseignant)</label>
            <select
              value={form.gradeId || ""}
              onChange={(e) => set("gradeId", e.target.value)}
              className={inputClass}
            >
              <option value="">-- Sélectionner --</option>
              {(grades || []).map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.code} - {g.libelle}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Grade stocké dans la base enseignant pour éviter de préciser à chaque HC</p>
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">
          Annuler
        </button>
        <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-indigo-700 text-white font-semibold text-sm hover:bg-indigo-800 disabled:opacity-60">
          {loading ? "Enregistrement..." : "💾 Enregistrer"}
        </button>
      </div>
    </form>
  );
}
