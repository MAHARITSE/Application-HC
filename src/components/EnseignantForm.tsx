"use client";

import { useState, useEffect, useMemo } from "react";
import type { EnseignantFormData } from "@/lib/types";
import {
  GRADES,
  STATUTS,
  TAUX_PAR_GRADE,
  calculerHC,
  calculerHeuresAPayer,
  calculerMontantBrut,
  calculerISRA,
  calculerNetAPayer,
  formatAriary,
  nombreEnLettres,
  OBLIGATION_SERVICE_PERMANENT,
} from "@/lib/constants";

interface EnseignantFormProps {
  editingId: number | null;
  onClose: () => void;
}

const INITIAL_FORM: EnseignantFormData = {
  nom: "",
  prenoms: "",
  grade: "A",
  etablissement: "",
  statut: "Permanent",
  heuresET: 0,
  heuresED: 0,
  heuresEP: 0,
  heuresSoutenance: 0,
  heuresRecherche: 0,
  rib: "",
  avance: 0,
  dateAvance: "",
};

export function EnseignantForm({ editingId, onClose }: EnseignantFormProps) {
  const [form, setForm] = useState<EnseignantFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingId !== null) {
      setLoadingData(true);
      fetch(`/api/enseignants/${editingId}`)
        .then((res) => res.json())
        .then((data) => {
          setForm({
            nom: data.nom || "",
            prenoms: data.prenoms || "",
            grade: data.grade || "A",
            etablissement: data.etablissement || "",
            statut: data.statut || "Permanent",
            heuresET: parseFloat(data.heuresET || "0"),
            heuresED: parseFloat(data.heuresED || "0"),
            heuresEP: parseFloat(data.heuresEP || "0"),
            heuresSoutenance: parseFloat(data.heuresSoutenance || "0"),
            heuresRecherche: parseFloat(data.heuresRecherche || "0"),
            rib: data.rib || "",
            avance: parseFloat(data.avance || "0"),
            dateAvance: data.dateAvance || "",
          });
        })
        .catch(() => setError("Erreur lors du chargement des données"))
        .finally(() => setLoadingData(false));
    }
  }, [editingId]);

  // Real-time calculations
  const calculations = useMemo(() => {
    const hcBrut = calculerHC(
      form.heuresET,
      form.heuresED,
      form.heuresEP,
      form.heuresSoutenance,
      form.heuresRecherche
    );
    const heuresPayer = calculerHeuresAPayer(hcBrut, form.statut);
    const taux = TAUX_PAR_GRADE[form.grade] || 0;
    const montantBrut = calculerMontantBrut(heuresPayer, form.grade);
    const isra = calculerISRA(montantBrut, form.statut);
    const netPayer = calculerNetAPayer(montantBrut, isra, form.avance);

    return { hcBrut, heuresPayer, taux, montantBrut, isra, netPayer };
  }, [form]);

  const handleChange = (
    field: keyof EnseignantFormData,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleNumberChange = (field: keyof EnseignantFormData, value: string) => {
    const num = value === "" ? 0 : parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.nom.trim()) {
      setError("Le nom est obligatoire");
      return;
    }
    if (!form.prenoms.trim()) {
      setError("Les prénoms sont obligatoires");
      return;
    }
    if (!form.etablissement.trim()) {
      setError("L'établissement est obligatoire");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url =
        editingId !== null
          ? `/api/enseignants/${editingId}`
          : "/api/enseignants";
      const method = editingId !== null ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }

      onClose();
    } catch {
      setError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">
            Chargement des données...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {editingId !== null
                  ? "✏️ Modifier l'enseignant"
                  : "➕ Nouvel enseignant"}
              </h2>
              <p className="text-blue-200 text-xs mt-0.5">
                {editingId !== null
                  ? "Mettez à jour les informations"
                  : "Remplissez le formulaire ci-dessous"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Personal info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Identity Section */}
              <fieldset className="border border-slate-200 rounded-lg p-4">
                <legend className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Identité
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={(e) => handleChange("nom", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="RAKOTO"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Prénoms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.prenoms}
                      onChange={(e) => handleChange("prenoms", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Jean Baptiste"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Academic Info */}
              <fieldset className="border border-slate-200 rounded-lg p-4">
                <legend className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Informations académiques
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Grade
                    </label>
                    <select
                      value={form.grade}
                      onChange={(e) => handleChange("grade", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g} — {formatAriary(TAUX_PAR_GRADE[g]!)}/h
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Statut
                    </label>
                    <select
                      value={form.statut}
                      onChange={(e) => handleChange("statut", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Établissement <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.etablissement}
                      onChange={(e) =>
                        handleChange("etablissement", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Université de..."
                    />
                  </div>
                </div>
              </fieldset>

              {/* Hours Section */}
              <fieldset className="border border-slate-200 rounded-lg p-4">
                <legend className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Heures effectuées
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { field: "heuresET" as const, label: "ET", desc: "Théorique" },
                    { field: "heuresED" as const, label: "ED", desc: "Dirigé" },
                    { field: "heuresEP" as const, label: "EP", desc: "Pratique" },
                    {
                      field: "heuresSoutenance" as const,
                      label: "Sout.",
                      desc: "Soutenance",
                    },
                    {
                      field: "heuresRecherche" as const,
                      label: "Rech.",
                      desc: "Recherche",
                    },
                  ].map((item) => (
                    <div key={item.field}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {item.label}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {item.desc}
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={form[item.field] || ""}
                        onChange={(e) =>
                          handleNumberChange(item.field, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Financial Section */}
              <fieldset className="border border-slate-200 rounded-lg p-4">
                <legend className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Paiement
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      RIB
                    </label>
                    <input
                      type="text"
                      value={form.rib}
                      onChange={(e) => handleChange("rib", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="00001 00002 ..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Avance (Ar)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.avance || ""}
                      onChange={(e) =>
                        handleNumberChange("avance", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Date avance
                    </label>
                    <input
                      type="date"
                      value={form.dateAvance}
                      onChange={(e) =>
                        handleChange("dateAvance", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Right column - Live Calculation Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-gradient-to-b from-navy-900 to-navy-800 rounded-xl p-5 text-white shadow-lg">
                <h3 className="font-bold text-sm uppercase tracking-wider text-blue-200 mb-4 flex items-center gap-2">
                  <span className="text-lg">🧮</span> Calcul en temps réel
                </h3>

                <div className="space-y-3">
                  {/* Grade & Rate */}
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-blue-200">
                      <span>Grade</span>
                      <span className="font-bold text-white">{form.grade}</span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-200 mt-1">
                      <span>Taux horaire</span>
                      <span className="font-mono font-bold text-yellow-300">
                        {formatAriary(calculations.taux)}
                      </span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-blue-200">
                      <span>HC Brut</span>
                      <span className="font-mono font-bold text-white">
                        {calculations.hcBrut}h
                      </span>
                    </div>
                    {form.statut === "Permanent" && (
                      <div className="flex justify-between text-xs text-orange-300 mt-1">
                        <span>
                          Obligation service
                        </span>
                        <span className="font-mono">-{OBLIGATION_SERVICE_PERMANENT}h</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-blue-200 mt-1 pt-1 border-t border-white/10">
                      <span>Heures à payer</span>
                      <span className="font-mono font-bold text-white">
                        {calculations.heuresPayer}h
                      </span>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-blue-200">
                      <span>Montant Brut</span>
                      <span className="font-mono font-semibold text-white">
                        {formatAriary(calculations.montantBrut)}
                      </span>
                    </div>
                    {form.statut === "Vacataire" && (
                      <div className="flex justify-between text-xs text-red-300 mt-1">
                        <span>ISRA (20%)</span>
                        <span className="font-mono">
                          -{formatAriary(calculations.isra)}
                        </span>
                      </div>
                    )}
                    {form.avance > 0 && (
                      <div className="flex justify-between text-xs text-orange-300 mt-1">
                        <span>Avance</span>
                        <span className="font-mono">
                          -{formatAriary(form.avance)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* NET */}
                  <div className="bg-emerald-500/30 border border-emerald-400/30 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-200 uppercase">
                        Net à Payer
                      </span>
                      <span className="font-mono font-bold text-lg text-white">
                        {formatAriary(calculations.netPayer)}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-200/70 mt-1 italic leading-relaxed">
                      {nombreEnLettres(calculations.netPayer)} Ariary
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  💾{" "}
                  {editingId !== null
                    ? "Mettre à jour"
                    : "Enregistrer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
