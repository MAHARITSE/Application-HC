"use client";
import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/Modal";
import EnseignantForm from "@/components/EnseignantForm";
import HeuresForm from "@/components/HeuresForm";
import FicheIndividuelle from "@/components/FicheIndividuelle";
import { GradeBadge, StatutBadge } from "@/components/Badge";
import {
  calcHC, calcHCNette, formatAriary, TAUX_GRADE,
} from "@/lib/metier";
import {
  Search, Plus, FileSpreadsheet, FileText, Settings,
  ChevronDown, Trash2, Edit, BarChart3, BookOpen, X,
  Download, RefreshCw, Users, GraduationCap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Annee {
  id: number; libelle: string; tranche: string; active: boolean;
}
interface Grade {
  id: number; code: string; libelle: string;
  tauxHoraire: number; obligationService: number;
}
interface Faculte {
  id: number; etablissement: string;
  mention: string | null; parcours: string | null; niveau: string | null;
}
interface Enseignant {
  id: number; nom_prenom: string; cin: string; statut: string;
  grade_code: string; taux_horaire: number; obligation_service: number;
  etablissement_principal: string; rib: string; specialite: string;
  total_et: number; total_ed: number; total_ep: number;
  total_soutenance: number; total_recherche: number; total_avance: number;
  grade_id: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [annees,       setAnnees]       = useState<Annee[]>([]);
  const [selectedAnnee,setSelectedAnnee]= useState<Annee | null>(null);
  const [grades,       setGrades]       = useState<Grade[]>([]);
  const [facultes,     setFacultes]     = useState<Faculte[]>([]);
  const [enseignants,  setEnseignants]  = useState<Enseignant[]>([]);
  const [search,       setSearch]       = useState("");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterGrade,  setFilterGrade]  = useState("Tous");
  const [loading,      setLoading]      = useState(false);
  const [seeded,       setSeeded]       = useState(false);

  // Modals
  const [showEnsModal,   setShowEnsModal]   = useState(false);
  const [showHeuresModal,setShowHeuresModal] = useState(false);
  const [showFicheModal, setShowFicheModal]  = useState(false);
  const [showFacModal,   setShowFacModal]    = useState(false);
  const [showAnneeModal, setShowAnneeModal]  = useState(false);
  const [showGradeModal, setShowGradeModal]  = useState(false);
  const [showBaseModal,  setShowBaseModal]   = useState(false);

  const [editEns,   setEditEns]   = useState<Partial<{
    id: number; nomPrenom: string; cin: string; dateNaissance: string;
    lieuNaissance: string; nationalite: string; adresse: string;
    telephone: string; email: string; rib: string; banque: string;
    statut: string; specialite: string; gradeId: string;
    etablissementPrincipal: string; dateRecrutement: string;
  }> | null>(null);
  const [selectedEns, setSelectedEns] = useState<Enseignant | null>(null);
  const [ficheData,   setFicheData]   = useState<unknown>(null);
  const [ficheNum,    setFicheNum]    = useState("0001");
  const [baseData,    setBaseData]    = useState<unknown>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Faculté form
  const [facForm, setFacForm] = useState({ etablissement:"", mention:"", parcours:"", niveau:"", code:"" });
  const [editFacId, setEditFacId] = useState<number|null>(null);

  // Année form
  const [anneeForm, setAnneeForm] = useState({ libelle:"", tranche:"Première tranche", active: false });

  // Grade form
  const [gradeEdit, setGradeEdit] = useState<Grade|null>(null);
  const [gradeTauxEdit, setGradeTauxEdit] = useState({ tauxHoraire:0, obligationService:0 });

  // ── Initialisation ────────────────────────────────────────────────────────
  const initSeed = useCallback(async () => {
    if (seeded) return;
    await fetch("/api/seed", { method: "POST" });
    setSeeded(true);
  }, [seeded]);

  const loadAnnees = useCallback(async () => {
    const res = await fetch("/api/annees");
    const data: Annee[] = await res.json();
    setAnnees(data);
    if (!selectedAnnee && data.length > 0) {
      const active = data.find((a) => a.active) || data[0];
      setSelectedAnnee(active);
    }
  }, [selectedAnnee]);

  const loadGrades = useCallback(async () => {
    const res = await fetch("/api/grades");
    setGrades(await res.json());
  }, []);

  const loadFacultes = useCallback(async () => {
    const res = await fetch("/api/facultes");
    setFacultes(await res.json());
  }, []);

  const loadEnseignants = useCallback(async () => {
    if (!selectedAnnee) return;
    setLoading(true);
    const params = new URLSearchParams({
      search,
      anneeId: String(selectedAnnee.id),
    });
    const res = await fetch(`/api/enseignants?${params}`);
    setEnseignants(await res.json());
    setLoading(false);
  }, [selectedAnnee, search]);

  useEffect(() => {
    initSeed().then(() => {
      loadAnnees();
      loadGrades();
      loadFacultes();
    });
  }, []);

  useEffect(() => { loadEnseignants(); }, [loadEnseignants]);

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = enseignants.filter((e) => {
    if (filterStatut !== "Tous" && e.statut !== filterStatut) return false;
    if (filterGrade  !== "Tous" && e.grade_code !== filterGrade) return false;
    return true;
  });

  // ── Statistiques ─────────────────────────────────────────────────────────
  const stats = {
    total:    filtered.length,
    perm:     filtered.filter((e) => e.statut === "Permanent").length,
    vacat:    filtered.filter((e) => e.statut === "Vacataire").length,
    montant:  filtered.reduce((sum, e) => {
      const hc = calcHC(e.total_et,e.total_ed,e.total_ep,e.total_soutenance,e.total_recherche);
      const { hcNette } = calcHCNette(hc, e.grade_code, e.statut);
      return sum + Math.floor(hcNette) * (TAUX_GRADE[e.grade_code] ?? 0);
    }, 0),
  };

  // ── Handlers Enseignant ───────────────────────────────────────────────────
  const handleAddEns = () => { setEditEns(null); setShowEnsModal(true); };

  const handleEditEns = (e: Enseignant) => {
    setEditEns({
      id: e.id,
      nomPrenom: e.nom_prenom,
      cin: e.cin,
      statut: e.statut,
      specialite: e.specialite,
      gradeId: String(e.grade_id || ""),
      etablissementPrincipal: e.etablissement_principal,
      rib: e.rib,
    });
    setShowEnsModal(true);
  };

  const handleSaveEns = async (data: {
    nomPrenom: string; cin: string; dateNaissance: string;
    lieuNaissance: string; nationalite: string; adresse: string;
    telephone: string; email: string; rib: string; banque: string;
    statut: string; specialite: string; gradeId: string;
    etablissementPrincipal: string; dateRecrutement: string;
  }) => {
    setFormLoading(true);
    try {
      if (editEns?.id) {
        await fetch(`/api/enseignants/${editEns.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/enseignants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      setShowEnsModal(false);
      await loadEnseignants();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEns = async (id: number) => {
    if (!confirm("Supprimer cet enseignant et toutes ses heures ?")) return;
    await fetch(`/api/enseignants/${id}`, { method: "DELETE" });
    await loadEnseignants();
  };

  // ── Heures ─────────────────────────────────────────────────────────────────
  const handleOpenHeures = (e: Enseignant) => {
    setSelectedEns(e);
    setShowHeuresModal(true);
  };

  // ── Fiche individuelle ─────────────────────────────────────────────────────
  const handleOpenFiche = async (e: Enseignant, num: string) => {
    if (!selectedAnnee) return;
    const res = await fetch(
      `/api/export/fiche?enseignantId=${e.id}&anneeId=${selectedAnnee.id}&numeroEtat=${num}`
    );
    const data = await res.json();
    setFicheData(data);
    setSelectedEns(e);
    setShowFicheModal(true);
  };

  // ── Base globale ───────────────────────────────────────────────────────────
  const handleViewBase = async () => {
    if (!selectedAnnee) return;
    const res = await fetch(`/api/export/base?anneeId=${selectedAnnee.id}`);
    const data = await res.json();
    setBaseData(data);
    setShowBaseModal(true);
  };

  // ── Export XLSX (base globale) ─────────────────────────────────────────────
  const handleExportXLSX = async () => {
    if (!baseData) return;
    const { utils, writeFile } = await import("xlsx");
    const bd = baseData as { annee: string; data: Record<string, unknown>[] };

    const wsData = [
      ["N°","NOM ET PRENOMS","CIN","STATUT","GRADE","SPECIALITE","ETABLISSEMENT",
       "ET","ED","EP","SOUTENANCE","RECHERCHE","HC BRUT","OBLIGATION","HC CONVERTI",
       "TAUX","MONTANT","AVANCE","NET","TEL","EMAIL","RIB"],
      ...bd.data.map((r) => [
        r.numero, r.nomPrenom, r.cin, r.statut, r.grade, r.specialite,
        r.etablissement, r.et, r.ed, r.ep, r.soutenance, r.recherche,
        r.hcBrut, r.obligation, r.hcConverties, r.taux, r.montant,
        r.avance, r.netPayer, r.telephone, r.email, r.rib,
      ]),
    ];

    const ws  = utils.aoa_to_sheet(wsData);
    const wb  = utils.book_new();
    utils.book_append_sheet(wb, ws, `HC_${bd.annee}`);
    writeFile(wb, `Base_HC_${bd.annee?.replace("/","_")}.xlsx`);
  };

  // ── Année ─────────────────────────────────────────────────────────────────
  const handleSaveAnnee = async () => {
    if (!anneeForm.libelle) return;
    await fetch("/api/annees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anneeForm),
    });
    await loadAnnees();
    setShowAnneeModal(false);
    setAnneeForm({ libelle:"", tranche:"Première tranche", active:false });
  };

  // ── Faculté ───────────────────────────────────────────────────────────────
  const handleSaveFac = async () => {
    if (!facForm.etablissement) return;
    if (editFacId) {
      await fetch("/api/facultes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editFacId, ...facForm }),
      });
    } else {
      await fetch("/api/facultes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facForm),
      });
    }
    await loadFacultes();
    setFacForm({ etablissement:"", mention:"", parcours:"", niveau:"", code:"" });
    setEditFacId(null);
  };

  const handleDeleteFac = async (id: number) => {
    if (!confirm("Supprimer ?")) return;
    await fetch(`/api/facultes?id=${id}`, { method: "DELETE" });
    await loadFacultes();
  };

  // ── Grade (taux) ──────────────────────────────────────────────────────────
  const handleSaveGrade = async () => {
    if (!gradeEdit) return;
    await fetch("/api/grades", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: gradeEdit.id, ...gradeTauxEdit }),
    });
    await loadGrades();
    setGradeEdit(null);
  };

  // ── Calculs par enseignant ────────────────────────────────────────────────
  const calcRow = (e: Enseignant) => {
    const hc = calcHC(e.total_et,e.total_ed,e.total_ep,e.total_soutenance,e.total_recherche);
    const { hcNette, obligation } = calcHCNette(hc, e.grade_code, e.statut);
    const hcArr = Math.floor(hcNette);
    const taux  = TAUX_GRADE[e.grade_code] ?? 0;
    const montant = hcArr * taux;
    const net   = montant - (e.total_avance || 0);
    return { hc, hcNette, hcArr, obligation, taux, montant, net };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">

      {/* ─── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <GraduationCap size={24} className="text-yellow-300" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">
                  HC Manager – Université de Toliara
                </h1>
                <p className="text-indigo-300 text-xs">
                  Gestion des Heures Complémentaires
                </p>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnneeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-medium transition"
              >
                <Plus size={14} /> Année
              </button>
              <button
                onClick={() => setShowFacModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-medium transition"
              >
                <BookOpen size={14} /> Facultés
              </button>
              <button
                onClick={() => setShowGradeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-medium transition"
              >
                <Settings size={14} /> Taux
              </button>
              <button
                onClick={handleViewBase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition"
              >
                <FileSpreadsheet size={14} /> Base Globale
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

        {/* ─── SÉLECTEUR ANNÉE ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Année universitaire :</span>
          <div className="flex flex-wrap gap-2">
            {annees.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAnnee(a)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  selectedAnnee?.id === a.id
                    ? "bg-indigo-700 text-white border-indigo-700 shadow-md"
                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {a.libelle}
                {a.active && (
                  <span className="ml-1.5 text-xs text-yellow-300">●</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── STATS CARDS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Enseignants", value: stats.total, icon: <Users size={22} />, color: "from-indigo-500 to-indigo-700" },
            { label: "Permanents",  value: stats.perm,  icon: <GraduationCap size={22} />, color: "from-blue-500 to-blue-700" },
            { label: "Vacataires",  value: stats.vacat, icon: <BarChart3 size={22} />,      color: "from-orange-500 to-orange-700" },
            { label: "Total Net (Ar)", value: stats.montant.toLocaleString("fr-MG"), icon: <FileSpreadsheet size={22} />, color: "from-emerald-500 to-emerald-700" },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</span>
                <div className="opacity-70">{icon}</div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* ─── BARRE RECHERCHE + FILTRES ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, établissement, CIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtre Statut */}
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="Tous">Tous statuts</option>
              <option value="Permanent">Permanent</option>
              <option value="Vacataire">Vacataire</option>
            </select>

            {/* Filtre Grade */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="Tous">Tous grades</option>
              {grades.map((g) => (
                <option key={g.code} value={g.code}>{g.code} – {g.libelle}</option>
              ))}
            </select>

            <button
              onClick={loadEnseignants}
              className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-600"
              title="Rafraîchir"
            >
              <RefreshCw size={16} />
            </button>

            {/* Bouton Ajouter */}
            <button
              onClick={handleAddEns}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-700 text-white font-semibold text-sm hover:bg-indigo-800 shadow transition ml-auto"
            >
              <Plus size={16} /> Ajouter Enseignant
            </button>
          </div>
        </div>

        {/* ─── TABLEAU ENSEIGNANTS ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-indigo-600">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-700 mr-3" />
              Chargement...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
                    {[
                      "N°","Nom et Prénoms","Grade","Statut","Établissement",
                      "ET","ED","EP","Sout.","Rech.","HC Brut","HC Net",
                      "Montant Brut","Avance","Net à Payer","Actions",
                    ].map((h) => (
                      <th key={h} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-center whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="text-center py-16 text-gray-400">
                        <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun enseignant trouvé</p>
                        <button
                          onClick={handleAddEns}
                          className="mt-3 text-indigo-600 hover:underline text-sm"
                        >
                          + Ajouter le premier enseignant
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e, idx) => {
                      const { hc, hcNette, hcArr, montant, net } = calcRow(e);
                      return (
                        <tr
                          key={e.id}
                          className={`border-b border-gray-100 hover:bg-indigo-50/50 transition ${
                            e.statut === "Permanent"
                              ? "bg-purple-50/30"
                              : "bg-emerald-50/20"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center text-gray-500 font-mono text-xs">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">
                            {e.nom_prenom}
                            {e.specialite && (
                              <p className="text-xs text-gray-400 font-normal">{e.specialite}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <GradeBadge grade={e.grade_code} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <StatutBadge statut={e.statut} />
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-600">
                            {e.etablissement_principal || "—"}
                          </td>
                          {[e.total_et,e.total_ed,e.total_ep,e.total_soutenance,e.total_recherche].map((v,i) => (
                            <td key={i} className="px-2 py-2.5 text-center text-xs font-mono">
                              {v ? v.toFixed(v % 1 === 0 ? 0 : 2) : <span className="text-gray-300">-</span>}
                            </td>
                          ))}
                          <td className="px-2 py-2.5 text-center text-xs font-semibold text-indigo-700">
                            {hc.toFixed(2)}
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs font-semibold text-green-700">
                            {hcArr}
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs font-mono text-gray-800">
                            {montant ? montant.toLocaleString("fr-MG") : "-"}
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs font-mono text-orange-700">
                            {e.total_avance ? e.total_avance.toLocaleString("fr-MG") : "-"}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`text-xs font-bold ${net > 0 ? "text-emerald-700" : "text-red-600"}`}>
                              {net ? net.toLocaleString("fr-MG") : "-"}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-2 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditEns(e)}
                                title="Modifier"
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenHeures(e)}
                                title="Gérer heures"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                              >
                                <BarChart3 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const num = prompt("N° de l'état :", ficheNum) || ficheNum;
                                  setFicheNum(num);
                                  handleOpenFiche(e, num);
                                }}
                                title="Fiche individuelle"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition"
                              >
                                <FileText size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteEns(e.id)}
                                title="Supprimer"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer tableau */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{filtered.length} enseignant(s) – {selectedAnnee?.libelle}</span>
              <span className="font-semibold text-indigo-700">
                Total Net : {stats.montant.toLocaleString("fr-MG")} Ar
              </span>
            </div>
          )}
        </div>

        {/* ─── SECTION GRADES ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {grades.map((g) => (
            <div key={g.code} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <GradeBadge grade={g.code} />
                <span className="text-xs text-gray-400">Grade</span>
              </div>
              <p className="text-xs text-gray-500">{g.libelle}</p>
              <p className="text-xl font-bold text-indigo-800 mt-1">
                {g.tauxHoraire.toLocaleString("fr-MG")} Ar/h
              </p>
              {g.obligationService > 0 && (
                <p className="text-xs text-orange-600 mt-0.5">
                  Obligation: {g.obligationService}h
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal Enseignant */}
      <Modal
        isOpen={showEnsModal}
        onClose={() => setShowEnsModal(false)}
        title={editEns?.id ? "✏️ Modifier Enseignant" : "➕ Nouvel Enseignant"}
        size="2xl"
      >
        <EnseignantForm
          initialData={editEns ?? undefined}
          grades={grades}
          onSave={handleSaveEns}
          onCancel={() => setShowEnsModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Modal Heures */}
      <Modal
        isOpen={showHeuresModal}
        onClose={() => { setShowHeuresModal(false); loadEnseignants(); }}
        title={`📋 Heures – ${selectedEns?.nom_prenom || ""}`}
        size="2xl"
      >
        {selectedEns && selectedAnnee && (
          <HeuresForm
            enseignantId={selectedEns.id}
            anneeId={selectedAnnee.id}
            gradeCode={selectedEns.grade_code}
            statut={selectedEns.statut}
            facultes={facultes}
          />
        )}
      </Modal>

      {/* Modal Fiche Individuelle */}
      <Modal
        isOpen={showFicheModal}
        onClose={() => setShowFicheModal(false)}
        title="📄 Fiche Individuelle de Paiement"
        size="2xl"
      >
        {ficheData ? (
          <div className="space-y-4">
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-700 text-white text-sm font-medium hover:bg-indigo-800 transition"
              >
                🖨️ Imprimer / PDF
              </button>
            </div>
            <FicheIndividuelle data={ficheData as Parameters<typeof FicheIndividuelle>[0]["data"]} />
          </div>
        ) : null}
      </Modal>

      {/* Modal Base Globale */}
      <Modal
        isOpen={showBaseModal}
        onClose={() => setShowBaseModal(false)}
        title="📊 Base Globale des Heures Complémentaires"
        size="2xl"
      >
        {baseData ? (() => {
          const bd = baseData as { annee: string; data: Record<string, unknown>[] };
          const perms  = bd.data.filter((r) => r.statut === "Permanent");
          const vacats = bd.data.filter((r) => r.statut === "Vacataire");

          const TableSection = ({
            title, rows, color,
          }: { title: string; rows: Record<string, unknown>[]; color: string }) => (
            <div className="mb-6">
              <h3 className={`font-bold text-sm mb-2 px-3 py-1.5 rounded-lg ${color}`}>
                {title} ({rows.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-indigo-900 text-white">
                    <tr>
                      {["N°","Nom et Prénoms","Grade","Étab.","ET","ED","EP","Sout.","Rech.",
                        "HC","Oblig.","HC Conv.","Taux","Montant","RIB"].map((h) => (
                        <th key={h} className="px-2 py-2 font-semibold text-center whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-2 py-1.5 text-center">{r.numero as number}</td>
                        <td className="px-2 py-1.5 font-medium whitespace-nowrap">{r.nomPrenom as string}</td>
                        <td className="px-2 py-1.5 text-center"><GradeBadge grade={r.grade as string} /></td>
                        <td className="px-2 py-1.5 text-center text-gray-600">{r.etablissement as string || "-"}</td>
                        {["et","ed","ep","soutenance","recherche"].map((k) => (
                          <td key={k} className="px-2 py-1.5 text-center font-mono">
                            {(r[k] as number) || "-"}
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center font-semibold text-indigo-700">{(r.hcBrut as number)?.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-center text-orange-600">{(r.obligation as number) || "-"}</td>
                        <td className="px-2 py-1.5 text-center font-semibold text-green-700">{r.hcConverties as number}</td>
                        <td className="px-2 py-1.5 text-center">{(r.taux as number)?.toLocaleString("fr-MG")}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-indigo-900">{(r.montant as number)?.toLocaleString("fr-MG")}</td>
                        <td className="px-2 py-1.5 text-center text-gray-500">{r.rib as string || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-indigo-900">
                  Année : {bd.annee} — {bd.data.length} lignes
                </h2>
                <button
                  onClick={handleExportXLSX}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                >
                  <Download size={16} /> Exporter XLSX
                </button>
              </div>
              <TableSection
                title="Enseignants Permanents"
                rows={perms}
                color="bg-purple-100 text-purple-800"
              />
              <TableSection
                title="Enseignants Vacataires"
                rows={vacats}
                color="bg-emerald-100 text-emerald-800"
              />
            </div>
          );
        })() : null}
      </Modal>

      {/* Modal Facultés / Parcours */}
      <Modal
        isOpen={showFacModal}
        onClose={() => setShowFacModal(false)}
        title="🏫 Référentiel Facultés / Mentions / Parcours"
        size="2xl"
      >
        <div className="space-y-4">
          {/* Formulaire */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-800 mb-3">
              {editFacId ? "Modifier" : "Ajouter"} un établissement / parcours
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label:"Établissement *", key:"etablissement" },
                { label:"Mention",         key:"mention" },
                { label:"Parcours",        key:"parcours" },
                { label:"Code",            key:"code" },
              ].map(({ label, key }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">{label}</label>
                  <input
                    type="text"
                    value={facForm[key as keyof typeof facForm]}
                    onChange={(e) => setFacForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Niveau</label>
                <select
                  value={facForm.niveau}
                  onChange={(e) => setFacForm((f) => ({ ...f, niveau: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">—</option>
                  {["L","M","D"].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveFac}
                className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-sm font-medium hover:bg-indigo-800"
              >
                {editFacId ? "Mettre à jour" : "Ajouter"}
              </button>
              {editFacId && (
                <button
                  onClick={() => { setEditFacId(null); setFacForm({ etablissement:"",mention:"",parcours:"",niveau:"",code:"" }); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>

          {/* Liste */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-indigo-900 text-white">
                <tr>
                  {["Établissement","Mention","Parcours","Niveau","Code",""].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facultes.map((f, idx) => (
                  <tr key={f.id} className={`border-b ${idx%2===0?"bg-gray-50":"bg-white"}`}>
                    <td className="px-3 py-2 font-medium">{f.etablissement}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{f.mention || "-"}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{f.parcours || "-"}</td>
                    <td className="px-3 py-2 text-center">{f.niveau || "-"}</td>
                    <td className="px-3 py-2 text-center text-gray-400 text-xs">{f.id}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditFacId(f.id);
                            setFacForm({
                              etablissement: f.etablissement,
                              mention: f.mention||"",
                              parcours: f.parcours||"",
                              niveau: f.niveau||"",
                              code: "",
                            });
                          }}
                          className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteFac(f.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Année universitaire */}
      <Modal
        isOpen={showAnneeModal}
        onClose={() => setShowAnneeModal(false)}
        title="📅 Gestion des Années Universitaires"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Libellé *</label>
              <input
                type="text"
                placeholder="ex: 2024/2025"
                value={anneeForm.libelle}
                onChange={(e) => setAnneeForm((f) => ({ ...f, libelle: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Tranche</label>
              <select
                value={anneeForm.tranche}
                onChange={(e) => setAnneeForm((f) => ({ ...f, tranche: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option>Première tranche</option>
                <option>Deuxième tranche</option>
                <option>Troisième tranche</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={anneeForm.active}
                onChange={(e) => setAnneeForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded"
              />
              Définir comme année active
            </label>
            <button
              onClick={handleSaveAnnee}
              className="w-full py-2 rounded-lg bg-indigo-700 text-white font-medium text-sm hover:bg-indigo-800"
            >
              Ajouter
            </button>
          </div>

          {/* Liste des années */}
          <div className="space-y-2">
            {annees.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                  a.active ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
                }`}
              >
                <div>
                  <span className="font-semibold text-sm">{a.libelle}</span>
                  <span className="ml-2 text-xs text-gray-500">{a.tranche}</span>
                </div>
                <div className="flex items-center gap-2">
                  {a.active && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedAnnee(a);
                      setShowAnneeModal(false);
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Sélectionner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Taux Grades */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title="⚙️ Paramétrage des Taux Horaires"
        size="md"
      >
        <div className="space-y-4">
          {grades.map((g) => (
            <div
              key={g.id}
              className={`rounded-xl border p-4 ${
                gradeEdit?.id === g.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <GradeBadge grade={g.code} />
                  <span className="text-sm font-medium text-gray-700">{g.libelle}</span>
                </div>
                <button
                  onClick={() => {
                    setGradeEdit(g);
                    setGradeTauxEdit({ tauxHoraire: g.tauxHoraire, obligationService: g.obligationService });
                  }}
                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100"
                >
                  <Edit size={14} />
                </button>
              </div>

              {gradeEdit?.id === g.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Taux horaire (Ar)</label>
                      <input
                        type="number"
                        value={gradeTauxEdit.tauxHoraire}
                        onChange={(e) => setGradeTauxEdit((v) => ({ ...v, tauxHoraire: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Obligation service (h)</label>
                      <input
                        type="number"
                        value={gradeTauxEdit.obligationService}
                        onChange={(e) => setGradeTauxEdit((v) => ({ ...v, obligationService: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveGrade}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setGradeEdit(null)}
                      className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Taux : </span>
                    <span className="font-bold text-indigo-800">
                      {g.tauxHoraire.toLocaleString("fr-MG")} Ar/h
                    </span>
                  </div>
                  {g.obligationService > 0 && (
                    <div>
                      <span className="text-gray-500">Obligation : </span>
                      <span className="font-bold text-orange-700">{g.obligationService} h</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
