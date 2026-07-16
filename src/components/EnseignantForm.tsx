"use client";
import { useState, useEffect } from "react";
import { TAUX_GRADE, GRADE_LIBELLES } from "@/lib/metier";

interface Grade {
  id: number;
  code: string;
  libelle: string;
  tauxHoraire: number;
  obligationService: number;
}

interface EnseignantData {
  id?: number;
  nomPrenom: string;
  cin: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  telephone: string;
  email: string;
  rib: string;
  banque: string;
  statut: string;
  specialite: string;
  gradeId: string;
  etablissementPrincipal: string;
  dateRecrutement: string;
}

interface Props {
  initialData?: Partial<EnseignantData>;
  grades: Grade[];
  onSave: (data: EnseignantData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY: EnseignantData = {
  nomPrenom: "", cin: "", dateNaissance: "", lieuNaissance: "",
  nationalite: "Malgache", adresse: "", telephone: "", email: "",
  rib: "", banque: "", statut: "Vacataire", specialite: "", gradeId: "",
  etablissementPrincipal: "", dateRecrutement: "",
};

const ETABLISSEMENTS = [
  "CURA","DRGS","ENS","FAC LETTRES","IES-ANOSY",
  "IES-Menabe","IES-Toliara","IHSM","MEDECINE","SCIENCES",
];

export default function EnseignantForm({
  initialData, grades, onSave, onCancel, loading,
}: Props) {
  const [form, setForm] = useState<EnseignantData>({ ...EMPTY, ...initialData });
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setForm({ ...EMPTY, ...initialData });
  }, [initialData]);

  const set = (key: keyof EnseignantData, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const selectedGrade = grades.find((g) => String(g.id) === String(form.gradeId));
  const taux = selectedGrade ? selectedGrade.tauxHoraire : 0;
  const oblig = selectedGrade ? selectedGrade.obligationService : 0;

  const tabs = ["Identité", "Grade & Statut", "Banque / RIB"];

  const input = (
    label: string, key: keyof EnseignantData,
    type = "text", required = false
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
        required={required}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );

  const select = (
    label: string, key: keyof EnseignantData,
    options: { value: string; label: string }[], required = false
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      >
        <option value="">— Choisir —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === i
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0 : Identité */}
      {tab === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {input("Nom et Prénoms", "nomPrenom", "text", true)}
          {input("N° CIN", "cin")}
          {input("Date de naissance", "dateNaissance", "date")}
          {input("Lieu de naissance", "lieuNaissance")}
          {input("Nationalité", "nationalite")}
          {input("Adresse", "adresse")}
          {input("Téléphone", "telephone")}
          {input("Email", "email", "email")}
        </div>
      )}

      {/* Tab 1 : Grade & Statut */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {select("Grade", "gradeId",
              grades.map((g) => ({ value: String(g.id), label: `${g.code} – ${g.libelle}` })),
              true
            )}
            {select("Statut", "statut",
              [
                { value: "Permanent",  label: "Permanent" },
                { value: "Vacataire", label: "Vacataire" },
              ], true
            )}
          </div>

          {/* Affichage taux en temps réel */}
          {taux > 0 && (
            <div className="flex gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex-1 text-center">
                <p className="text-xs text-indigo-600 font-medium">Taux horaire</p>
                <p className="text-2xl font-bold text-indigo-800">
                  {taux.toLocaleString("fr-MG")} Ar
                </p>
              </div>
              {form.statut === "Permanent" && oblig > 0 && (
                <div className="flex-1 text-center border-l border-indigo-200">
                  <p className="text-xs text-orange-600 font-medium">Obligation de service</p>
                  <p className="text-2xl font-bold text-orange-700">{oblig} h/an</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {input("Spécialité", "specialite")}
            {select("Établissement principal", "etablissementPrincipal",
              ETABLISSEMENTS.map((e) => ({ value: e, label: e }))
            )}
            {input("Date de recrutement", "dateRecrutement", "date")}
          </div>
        </div>
      )}

      {/* Tab 2 : Banque */}
      {tab === 2 && (
        <div className="grid grid-cols-1 gap-4">
          {input("RIB (Relevé d'Identité Bancaire)", "rib")}
          {input("Banque", "banque")}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-indigo-700 text-white font-semibold text-sm hover:bg-indigo-800 disabled:opacity-60 transition"
        >
          {loading ? "Enregistrement..." : "💾 Enregistrer"}
        </button>
      </div>
    </form>
  );
}
