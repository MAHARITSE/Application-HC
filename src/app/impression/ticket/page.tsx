"use client";
import { useState, useEffect } from "react";
import TicketImprimable, { printTicketDirect, printTicketPreview } from "@/components/TicketImprimable";
import { useAuth } from "@/components/LoginForm";
import {
  Printer,
  Search,
  FileText,
  Users,
  RefreshCw,
  CheckCircle2,
  Ticket,
  Download,
  Eye,
  CreditCard,
} from "lucide-react";

export default function TicketPage() {
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [annees, setAnnees] = useState<any[]>([]);
  const [selectedAnnee, setSelectedAnnee] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMode, setTicketMode] = useState<"fiche" | "ticket" | "recu">("ticket");
  const [batchMode, setBatchMode] = useState(false);
  const [batchData, setBatchData] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  const user = useAuth();

  useEffect(() => {
    loadInitialData();
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => { if (c && !c.error) setConfig(c); })
      .catch(() => {});
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [anneesRes] = await Promise.all([
        fetch("/api/annees"),
      ]);
      const anneesData = await anneesRes.json();
      const sorted = [...(anneesData || [])].sort((a: any, b: any) => b.libelle.localeCompare(a.libelle));
      setAnnees(sorted);
      if (sorted.length > 0) {
        setSelectedAnnee(sorted[0]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadEnseignants = async () => {
    if (!selectedAnnee) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/enseignants?anneeId=${selectedAnnee.id}`);
      const data = await res.json();
      setEnseignants(Array.isArray(data) ? data : []);
    } catch {
      setEnseignants([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEnseignants();
  }, [selectedAnnee]);

  const generateFiche = async (enseignantId: number) => {
    if (!selectedAnnee) return null;
    const res = await fetch(
      `/api/export/fiche?enseignantId=${enseignantId}&anneeId=${selectedAnnee.id}&numeroEtat=${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`
    );
    if (!res.ok) return null;
    return res.json();
  };

  const handlePrintOne = async (ens: any) => {
    const fiche = await generateFiche(ens.id);
    if (fiche) {
      setSelectedTicket(fiche);
      setBatchMode(false);
      setTimeout(() => window.print(), 400);
    }
  };

  const handlePrintAll = async () => {
    setLoading(true);
    const fiches = [];
    let num = 1;
    for (const ens of filtered) {
      const fiche = await generateFiche(ens.id);
      if (fiche) {
        fiche.numeroEtat = String(num++).padStart(4, "0");
        fiches.push(fiche);
      }
    }
    setBatchData(fiches);
    setBatchMode(true);
    setLoading(false);
    setTimeout(() => window.print(), 500);
  };

  const handleQuickTicket = async (ens: any) => {
    const fiche = await generateFiche(ens.id);
    if (fiche) {
      let content = "";
      content += `<div class="center bold">FICHE DE PAIEMENT</div>\n`;
      content += `<div class="separator"></div>\n`;
      content += `<div class="inline"><span>N° ${fiche.numeroEtat}</span><span>${fiche.annee.libelle}</span></div>\n`;
      content += `<div class="inline"><span>${fiche.enseignant.nomPrenom}</span><span>${fiche.enseignant.statut}</span></div>\n`;
      if (fiche.enseignant.cin) content += `<div>CIN: ${fiche.enseignant.cin}</div>\n`;
      content += `<div class="separator"></div>\n`;
      content += `<div>HC Nette: ${fiche.totaux.hcArrondi}h × ${fiche.calculs.taux.toLocaleString()} Ar/h</div>\n`;
      content += `<div class="total-box"><div>NET À PAYER</div><div class="bold" style="font-size:14pt">${fiche.calculs.netAPayer.toLocaleString("fr-MG")} Ar</div></div>\n`;
      content += `<div class="inline"><span></span><span>${fiche.calculs.netEnLettres}</span></div>\n`;

      printTicketDirect(content, config);
    }
  };

  const filtered = enseignants.filter((e: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.nomPrenom || "").toLowerCase().includes(q);
  });

  if (loading && !selectedAnnee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <RefreshCw size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  // Mode batch (toutes les fiches)
  if (batchMode && batchData.length > 0) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4 no-print bg-white p-3 rounded-xl shadow-sm border">
            <h2 className="font-bold text-lg">{batchData.length} ticket(s) prêt(s)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-bold hover:bg-indigo-800 shadow"
              >
                <Printer size={16} /> Imprimer tout
              </button>
              <button
                onClick={() => { setBatchMode(false); setBatchData([]); }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                Retour
              </button>
            </div>
          </div>
          {batchData.map((fiche, idx) => (
            <div key={idx} className="page-break-after mb-8">
              <TicketImprimable data={fiche} config={config} mode={ticketMode} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mode fiche unique
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto p-4">
          <TicketImprimable data={selectedTicket} config={config} mode={ticketMode} />
          <div className="text-center mt-4 no-print">
            <button
              onClick={() => setSelectedTicket(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
            >
              ← Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interface de sélection
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Ticket size={28} className="text-indigo-600" />
              Tickets & Fiches imprimables
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Générez et imprimez des tickets de paiement (style thermique) ou des fiches A4
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              ← Retour App
            </a>
            <a href="/admin" className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              Admin
            </a>
          </div>
        </div>

        {/* Contrôles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sélecteur année */}
              <select
                value={selectedAnnee?.id || ""}
                onChange={(e) => {
                  const a = annees.find((x) => x.id === Number(e.target.value));
                  if (a) setSelectedAnnee(a);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>{a.libelle} {a.active ? "✓" : ""}</option>
                ))}
              </select>

              {/* Mode ticket */}
              <select
                value={ticketMode}
                onChange={(e) => setTicketMode(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ticket">🎫 Ticket thermique (80mm)</option>
                <option value="fiche">📄 Fiche A4</option>
                <option value="recu">🧾 Reçu de paiement</option>
              </select>

              {/* Recherche */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrintAll}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition"
              >
                <Download size={16} /> Tout imprimer ({filtered.length})
              </button>
            </div>
          </div>
        </div>

        {/* Info tickets */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 text-sm">
          <div className="flex items-start gap-3">
            <Printer size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {ticketMode === "ticket"
                  ? "Mode Ticket Thermique — Format 80mm, idéal pour imprimante thermique de caisse"
                  : ticketMode === "recu"
                  ? "Mode Reçu — Format compact avec montant en évidence"
                  : "Mode Fiche A4 — Format standard pour impression bureau"}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Cliquez sur <strong>🎫 Ticket rapide</strong> pour une impression directe sans aperçu, ou sur <strong>👁 Voir</strong> pour prévisualiser.
              </p>
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {["Enseignant", "Grade", "Statut", "Établissement", "HC Nette", "Net à Payer", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((ens) => (
                    <tr key={ens.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                            {ens.nom?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{ens.nomPrenom}</p>
                            {ens.cin && <p className="text-[10px] text-slate-400">CIN: {ens.cin}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {ens.gradeCode || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{ens.statut || "—"}</td>
                      <td className="px-4 py-3 text-xs max-w-[120px] truncate" title={ens.structureEtablissement || ens.etablissementPrincipal}>
                        {ens.structureEtablissement || ens.etablissementPrincipal || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">{ens.hcArrondi || 0}h</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {((ens.montantNet || 0) - (ens.total_avance || 0)).toLocaleString("fr-MG")} Ar
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickTicket(ens)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition"
                            title="Ticket rapide (impression directe)"
                          >
                            <Ticket size={14} />
                          </button>
                          <button
                            onClick={() => handlePrintOne(ens)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition"
                            title="Voir et imprimer"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun enseignant trouvé</p>
                        <p className="text-xs mt-1">Saisissez des heures pour voir les enseignants ici</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
