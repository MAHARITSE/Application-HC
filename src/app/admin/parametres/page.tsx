"use client";
import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Building2,
  Printer,
  Phone,
  Mail,
  MapPin,
  User,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ParametresPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data && !data.error) {
        setConfig(data);
        sessionStorage.setItem("hc_config", JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Erreur");
        return;
      }

      const updated = await res.json();
      setConfig(updated);
      sessionStorage.setItem("hc_config", JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Settings size={28} className="text-indigo-600" />
            Paramètres de l'application
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configuration générale de HC-Manager</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Feedback */}
        {saved && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 animate-fadeIn">
            <CheckCircle2 size={18} /> Paramètres enregistrés avec succès !
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fadeIn">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Carte 1: Établissement */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Building2 size={20} className="text-indigo-500" />
            Informations de l'établissement
          </h3>
          <p className="text-xs text-slate-500 mb-4">Ces informations apparaissent sur les fiches et tickets imprimables</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de l'établissement *</label>
              <input
                type="text"
                value={config.nomEtablissement}
                onChange={(e) => setConfig({ ...config, nomEtablissement: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service</label>
              <input
                type="text"
                value={config.service}
                onChange={(e) => setConfig({ ...config, service: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={12} /> Adresse
              </label>
              <input
                type="text"
                value={config.adresse}
                onChange={(e) => setConfig({ ...config, adresse: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logo (Emoji)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={config.logoEmoji}
                  onChange={(e) => setConfig({ ...config, logoEmoji: e.target.value, logoType: "emoji" })}
                  className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-3xl">{config.logoEmoji || "🎓"}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone size={12} /> Téléphone
              </label>
              <input
                type="text"
                value={config.telephone}
                onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Carte 2: Responsable */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <User size={20} className="text-emerald-500" />
            Responsable
          </h3>
          <p className="text-xs text-slate-500 mb-4">Informations du responsable figurant sur les documents officiels</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du responsable</label>
              <input
                type="text"
                value={config.responsableNom}
                onChange={(e) => setConfig({ ...config, responsableNom: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fonction</label>
              <input
                type="text"
                value={config.responsableFonction}
                onChange={(e) => setConfig({ ...config, responsableFonction: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Carte 3: Impression */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Printer size={20} className="text-amber-500" />
            Paramètres d'impression
          </h3>
          <p className="text-xs text-slate-500 mb-4">Configuration pour l'impression des tickets et fiches</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={config.utiliserImprimanteThermique}
                  onChange={(e) => setConfig({ ...config, utiliserImprimanteThermique: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Mode imprimante thermique</span>
                  <p className="text-xs text-slate-400 mt-0.5">Format ticket 80mm, police monospace</p>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Largeur ticket (mm)</label>
              <select
                value={config.largeurTicketMm}
                onChange={(e) => setConfig({ ...config, largeurTicketMm: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value={58}>58 mm</option>
                <option value={80}>80 mm (standard)</option>
                <option value={112}>112 mm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Devise</label>
              <input
                type="text"
                value={config.devise}
                onChange={(e) => setConfig({ ...config, devise: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pays</label>
              <input
                type="text"
                value={config.pays}
                onChange={(e) => setConfig({ ...config, pays: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pied de ticket</label>
              <input
                type="text"
                value={config.piedTicket}
                onChange={(e) => setConfig({ ...config, piedTicket: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bouton sauvegarde */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-indigo-800 transition shadow-md disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} />
                Enregistrer les paramètres
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
