"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Modal from "@/components/Modal";
import { GradeBadge, StatutBadge } from "@/components/Badge";
import {
  Search, Plus, FileText, Settings,
  Trash2, Edit, BarChart3, X,
  RefreshCw, Users, GraduationCap, Building2,
  Calendar, DollarSign, Clock, CheckCircle2, AlertCircle,
  CreditCard, Wallet, ChevronDown,
} from "lucide-react";
import { calcHC, calcHCNette, calcMontantBrut, calcIRSA, formatAriary } from "@/lib/metier";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Annee {
  id: number; libelle: string; tranche: string; active: boolean;
  appliquerIRSA: boolean; tauxIRSA: number; plafondPaiement: string | null;
}
interface Grade {
  id: number; code: string; libelle: string;
  tauxHoraire: number; obligationService: number;
}
interface Faculte {
  id: number; etablissement: string;
  mention: string | null; parcours: string | null; niveau: string | null; code: string | null;
}
interface Enseignant {
  id: number; nomPrenom: string; cin: string | null; statut: string;
  gradeCode: string | null; gradeTaux: number | null; gradeObligation: number | null;
  etablissementPrincipal: string | null; rib: string | null; specialite: string | null;
  telephone: string | null; email: string | null; gradeId: number | null;
  total_et: number; total_ed: number; total_ep: number;
  total_soutenance: number; total_recherche: number; total_avance: number;
  obligation_custom: number | null; exempte: boolean;
}
interface EnseignantBase {
  id: number; nomPrenom: string; cin: string | null; statut: string;
  gradeId: number | null; gradeCode: string | null; gradeTaux: number | null;
  gradeObligation: number | null; etablissementPrincipal: string | null;
  rib: string | null; specialite: string | null; telephone: string | null; email: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [selectedAnnee, setSelectedAnnee] = useState<Annee | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [facultes, setFacultes] = useState<Faculte[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [allEnseignants, setAllEnseignants] = useState<EnseignantBase[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterGrade, setFilterGrade] = useState("Tous");
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Modals
  const [showEnsModal, setShowEnsModal] = useState(false);
  const [showHeuresModal, setShowHeuresModal] = useState(false);
  const [showFicheModal, setShowFicheModal] = useState(false);
  const [showFacModal, setShowFacModal] = useState(false);
  const [showAnneeModal, setShowAnneeModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showAddHeuresModal, setShowAddHeuresModal] = useState(false);

  const [editEns, setEditEns] = useState<Partial<Enseignant> | null>(null);
  const [selectedEns, setSelectedEns] = useState<Enseignant | null>(null);
  const [ficheData, setFicheData] = useState<Record<string, unknown> | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Enseignant search for heures
  const [ensSearchQuery, setEnsSearchQuery] = useState("");
  const [ensSearchResults, setEnsSearchResults] = useState<EnseignantBase[]>([]);
  const [selectedEnsForHeures, setSelectedEnsForHeures] = useState<EnseignantBase | null>(null);
  const [showEnsDropdown, setShowEnsDropdown] = useState(false);

  // Form states
  const [ensForm, setEnsForm] = useState({
    nomPrenom: "", cin: "", dateNaissance: "", lieuNaissance: "",
    nationalite: "Malagasy", adresse: "", telephone: "", email: "",
    rib: "", banque: "", statut: "Permanent", specialite: "",
    gradeId: "", etablissementPrincipal: "", dateRecrutement: "",
  });

  const [heuresForm, setHeuresForm] = useState({
    faculteId: "", heuresET: 0, heuresED: 0, heuresEP: 0,
    heuresSoutenance: 0, heuresRecherche: 0,
  });
  const [heuresList, setHeuresList] = useState<{
    id: number; faculteId: number | null; heuresET: number; heuresED: number;
    heuresEP: number; heuresSoutenance: number; heuresRecherche: number;
    faculte: Faculte | null;
  }[]>([]);

  const [facForm, setFacForm] = useState({ etablissement: "", mention: "", parcours: "", niveau: "", code: "" });
  const [anneeForm, setAnneeForm] = useState({
    libelle: "", tranche: "Première tranche", active: false,
    appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: "",
  });

  // Paiement form
  const [paiementForm, setPaiementForm] = useState({
    pourcentageTranche: 100,
    montantAvance: 0,
    dateAvance: "",
    datePaiement: new Date().toISOString().slice(0, 10),
    reference: "",
  });

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
    // Sélectionner la dernière année (première dans la liste triée desc)
    if (!selectedAnnee && data.length > 0) {
      setSelectedAnnee(data[0]); // Dernière année en premier
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

  const loadAllEnseignants = useCallback(async () => {
    const res = await fetch("/api/enseignants");
    setAllEnseignants(await res.json());
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
      loadAllEnseignants();
    });
  }, [initSeed, loadAnnees, loadGrades, loadFacultes, loadAllEnseignants]);

  useEffect(() => { loadEnseignants(); }, [loadEnseignants]);

  // Search enseignants for autocomplete
  useEffect(() => {
    if (ensSearchQuery.length >= 2) {
      const results = allEnseignants.filter(e =>
        e.nomPrenom.toLowerCase().includes(ensSearchQuery.toLowerCase())
      );
      setEnsSearchResults(results);
      setShowEnsDropdown(true);
    } else {
      setEnsSearchResults([]);
      setShowEnsDropdown(false);
    }
  }, [ensSearchQuery, allEnseignants]);

  // ── Calcul d'une ligne ──────────────────────────────────────────────────────
  const calcRow = useCallback((e: Enseignant) => {
    const hc = calcHC(e.total_et, e.total_ed, e.total_ep, e.total_soutenance, e.total_recherche);
    const obligation = e.exempte ? 0 : (e.obligation_custom ?? e.gradeObligation ?? 0);
    const { hcNette } = calcHCNette(hc, obligation, e.statut);
    const hcArr = Math.floor(hcNette);
    const taux = e.gradeTaux || 0;
    const montant = calcMontantBrut(hcArr, taux);

    let montantFinal = montant;
    if (selectedAnnee?.plafondPaiement && montant > Number(selectedAnnee.plafondPaiement)) {
      montantFinal = Number(selectedAnnee.plafondPaiement);
    }

    const irsa = calcIRSA(montantFinal, selectedAnnee?.tauxIRSA || 20, selectedAnnee?.appliquerIRSA ?? true);
    const montantNet = montantFinal - irsa;
    const net = montantNet - (e.total_avance || 0);

    return { hc, obligation, hcNette, hcArr, taux, montantBrut: montantFinal, irsa, montantNet, net };
  }, [selectedAnnee]);

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = enseignants.filter((e) => {
    if (filterStatut !== "Tous" && e.statut !== filterStatut) return false;
    if (filterGrade !== "Tous" && e.gradeCode !== filterGrade) return false;
    return true;
  });

  // ── Statistiques ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: filtered.length,
    perm: filtered.filter((e) => e.statut === "Permanent").length,
    vacat: filtered.filter((e) => e.statut === "Vacataire").length,
    totalHeures: filtered.reduce((sum, e) => sum + calcHC(e.total_et, e.total_ed, e.total_ep, e.total_soutenance, e.total_recherche), 0),
    montant: filtered.reduce((sum, e) => sum + calcRow(e).net, 0),
  }), [filtered, calcRow]);

  // ── Handlers Enseignant ───────────────────────────────────────────────────
  const handleAddEns = () => {
    setEditEns(null);
    setEnsForm({
      nomPrenom: "", cin: "", dateNaissance: "", lieuNaissance: "",
      nationalite: "Malagasy", adresse: "", telephone: "", email: "",
      rib: "", banque: "", statut: "Permanent", specialite: "",
      gradeId: "", etablissementPrincipal: "", dateRecrutement: "",
    });
    setShowEnsModal(true);
  };

  const handleEditEns = (e: Enseignant) => {
    setEditEns(e);
    setEnsForm({
      nomPrenom: e.nomPrenom,
      cin: e.cin || "",
      dateNaissance: "",
      lieuNaissance: "",
      nationalite: "Malagasy",
      adresse: "",
      telephone: e.telephone || "",
      email: e.email || "",
      rib: e.rib || "",
      banque: "",
      statut: e.statut,
      specialite: e.specialite || "",
      gradeId: String(e.gradeId || ""),
      etablissementPrincipal: e.etablissementPrincipal || "",
      dateRecrutement: "",
    });
    setShowEnsModal(true);
  };

  const handleSaveEns = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editEns?.id) {
        await fetch(`/api/enseignants/${editEns.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ensForm),
        });
      } else {
        await fetch("/api/enseignants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ensForm),
        });
      }
      setShowEnsModal(false);
      await loadEnseignants();
      await loadAllEnseignants();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEns = async (id: number) => {
    if (!confirm("Supprimer cet enseignant et toutes ses heures ?")) return;
    await fetch(`/api/enseignants/${id}`, { method: "DELETE" });
    await loadEnseignants();
    await loadAllEnseignants();
  };

  // ── Heures (with autocomplete) ─────────────────────────────────────────────
  const handleOpenAddHeures = () => {
    setSelectedEnsForHeures(null);
    setEnsSearchQuery("");
    setHeuresForm({ faculteId: "", heuresET: 0, heuresED: 0, heuresEP: 0, heuresSoutenance: 0, heuresRecherche: 0 });
    setShowAddHeuresModal(true);
  };

  const handleSelectEnsForHeures = (ens: EnseignantBase) => {
    setSelectedEnsForHeures(ens);
    setEnsSearchQuery(ens.nomPrenom);
    setShowEnsDropdown(false);
  };

  const handleCreateAndSelectEns = async () => {
    // Create new enseignant with minimal info
    const res = await fetch("/api/enseignants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomPrenom: ensSearchQuery, statut: "Vacataire" }),
    });
    const newEns = await res.json();
    await loadAllEnseignants();
    setSelectedEnsForHeures({
      id: newEns.id,
      nomPrenom: newEns.nomPrenom,
      cin: null,
      statut: newEns.statut,
      gradeId: null,
      gradeCode: null,
      gradeTaux: null,
      gradeObligation: null,
      etablissementPrincipal: null,
      rib: null,
      specialite: null,
      telephone: null,
      email: null,
    });
    setShowEnsDropdown(false);
  };

  const handleAddHeuresForSelected = async () => {
    if (!selectedEnsForHeures || !selectedAnnee) return;
    await fetch("/api/heures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignantId: selectedEnsForHeures.id,
        anneeId: selectedAnnee.id,
        ...heuresForm,
      }),
    });
    setShowAddHeuresModal(false);
    await loadEnseignants();
  };

  const handleOpenHeures = async (e: Enseignant) => {
    setSelectedEns(e);
    setHeuresForm({ faculteId: "", heuresET: 0, heuresED: 0, heuresEP: 0, heuresSoutenance: 0, heuresRecherche: 0 });
    if (selectedAnnee) {
      const res = await fetch(`/api/heures?enseignantId=${e.id}&anneeId=${selectedAnnee.id}`);
      const data = await res.json();
      setHeuresList(data.map((d: { heures: Record<string, unknown>; faculte: Faculte | null }) => ({
        id: d.heures.id,
        faculteId: d.heures.faculteId,
        heuresET: d.heures.heuresET || 0,
        heuresED: d.heures.heuresED || 0,
        heuresEP: d.heures.heuresEP || 0,
        heuresSoutenance: d.heures.heuresSoutenance || 0,
        heuresRecherche: d.heures.heuresRecherche || 0,
        faculte: d.faculte,
      })));
    }
    setShowHeuresModal(true);
  };

  const handleAddHeures = async () => {
    if (!selectedEns || !selectedAnnee) return;
    await fetch("/api/heures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignantId: selectedEns.id,
        anneeId: selectedAnnee.id,
        ...heuresForm,
      }),
    });
    handleOpenHeures(selectedEns);
    await loadEnseignants();
  };

  const handleDeleteHeures = async (id: number) => {
    await fetch(`/api/heures/${id}`, { method: "DELETE" });
    if (selectedEns) handleOpenHeures(selectedEns);
    await loadEnseignants();
  };

  // ── Fiche individuelle ─────────────────────────────────────────────────────
  const handleOpenFiche = async (e: Enseignant) => {
    if (!selectedAnnee) return;
    const num = prompt("N° de l'état :", "0001") || "0001";
    const res = await fetch(
      `/api/export/fiche?enseignantId=${e.id}&anneeId=${selectedAnnee.id}&numeroEtat=${num}`
    );
    const data = await res.json();
    setFicheData(data);
    setSelectedEns(e);
    setShowFicheModal(true);
  };

  // ── Préparation Paiement ───────────────────────────────────────────────────
  const handleOpenPaiement = (e: Enseignant) => {
    setSelectedEns(e);
    const calc = calcRow(e);
    // Detect tranche number based on existing payments
    const trancheNum = Math.floor((e.total_avance || 0) / calc.montantNet * 100);
    
    setPaiementForm({
      pourcentageTranche: 100,
      montantAvance: 0,
      dateAvance: "",
      datePaiement: new Date().toISOString().slice(0, 10),
      reference: "",
    });
    setShowPaiementModal(true);
  };

  const handleSavePaiement = async () => {
    if (!selectedEns || !selectedAnnee) return;
    const calc = calcRow(selectedEns);
    const montantTranche = Math.round(calc.montantNet * paiementForm.pourcentageTranche / 100);
    const montantPaye = montantTranche - paiementForm.montantAvance;

    await fetch("/api/paiements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignantId: selectedEns.id,
        anneeId: selectedAnnee.id,
        montantAvance: paiementForm.montantAvance,
        dateAvance: paiementForm.dateAvance || null,
        pourcentageTranche: paiementForm.pourcentageTranche,
        montantPaye,
        datePaiement: paiementForm.datePaiement || null,
        reference: paiementForm.reference || null,
        statut: paiementForm.pourcentageTranche >= 100 ? "Payé" : "Partiel",
      }),
    });
    setShowPaiementModal(false);
    await loadEnseignants();
  };

  // ── Faculté ─────────────────────────────────────────────────────────────────
  const handleSaveFac = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/facultes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facForm),
    });
    setShowFacModal(false);
    setFacForm({ etablissement: "", mention: "", parcours: "", niveau: "", code: "" });
    loadFacultes();
  };

  const handleDeleteFac = async (id: number) => {
    if (!confirm("Supprimer cette faculté ?")) return;
    await fetch(`/api/facultes?id=${id}`, { method: "DELETE" });
    loadFacultes();
  };

  // ── Année ─────────────────────────────────────────────────────────────────
  const handleSaveAnnee = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/annees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anneeForm),
    });
    setShowAnneeModal(false);
    setAnneeForm({ libelle: "", tranche: "Première tranche", active: false, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: "" });
    loadAnnees();
  };

  const handleUpdateAnnee = async (annee: Annee, field: string, value: unknown) => {
    await fetch("/api/annees", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...annee, [field]: value }),
    });
    loadAnnees();
    if (selectedAnnee?.id === annee.id) {
      setSelectedAnnee({ ...annee, [field]: value } as Annee);
    }
  };

  // Calculate paiement preview
  const paiementPreview = useMemo(() => {
    if (!selectedEns || !selectedAnnee) return null;
    const calc = calcRow(selectedEns);
    const montantTranche = Math.round(calc.montantNet * paiementForm.pourcentageTranche / 100);
    const montantPaye = montantTranche - paiementForm.montantAvance;
    const resteAPayer = calc.montantNet - (selectedEns.total_avance || 0) - montantPaye;
    
    return {
      ...calc,
      montantTranche,
      montantPaye: Math.max(0, montantPaye),
      resteAPayer: Math.max(0, resteAPayer),
    };
  }, [selectedEns, selectedAnnee, paiementForm, calcRow]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50">
      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap size={32} className="text-indigo-300" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">HC-Manager</h1>
                <p className="text-xs text-indigo-300">Gestion des Heures Complémentaires</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Année selector */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <Calendar size={16} className="text-indigo-300" />
                <select
                  value={selectedAnnee?.id || ""}
                  onChange={(e) => {
                    const a = annees.find(x => x.id === Number(e.target.value));
                    if (a) setSelectedAnnee(a);
                  }}
                  className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
                >
                  {annees.map(a => (
                    <option key={a.id} value={a.id} className="text-gray-900">
                      {a.libelle} {a.active && "✓"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tranche indicator */}
              {selectedAnnee && (
                <div className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium">
                  {selectedAnnee.tranche}
                </div>
              )}

              {/* IRSA indicator */}
              {selectedAnnee && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  selectedAnnee.appliquerIRSA
                    ? "bg-red-500/20 text-red-200"
                    : "bg-green-500/20 text-green-200"
                }`}>
                  {selectedAnnee.appliquerIRSA ? (
                    <>
                      <AlertCircle size={12} />
                      IRSA {selectedAnnee.tauxIRSA}%
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} />
                      Sans IRSA
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowAnneeModal(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title="Gérer les années"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<Users />} label="Enseignants" value={stats.total} sub={`${stats.perm} perm. · ${stats.vacat} vac.`} color="blue" />
          <StatCard icon={<Clock />} label="Total Heures" value={`${stats.totalHeures.toFixed(0)}h`} sub="Heures complémentaires" color="emerald" />
          <StatCard icon={<DollarSign />} label="Montant Net Total" value={formatAriary(stats.montant)} sub="À payer" color="amber" />
          <StatCard icon={<Building2 />} label="Facultés" value={facultes.length} sub="Établissements" color="purple" />
          <StatCard icon={<GraduationCap />} label="Grades" value={grades.length} sub="Niveaux" color="rose" />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 transition"
                />
              </div>
              {/* Filters */}
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Tous">Tous statuts</option>
                <option value="Permanent">Permanent</option>
                <option value="Vacataire">Vacataire</option>
              </select>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Tous">Tous grades</option>
                {grades.map(g => <option key={g.code} value={g.code}>{g.code} - {g.libelle}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddHeures}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
              >
                <BarChart3 size={16} /> Saisir Heures
              </button>
              <button
                onClick={() => setShowFacModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
              >
                <Building2 size={16} /> Facultés
              </button>
              <button
                onClick={() => setShowGradeModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-sm"
              >
                <GraduationCap size={16} /> Grades
              </button>
              <button
                onClick={handleAddEns}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                <Plus size={18} /> Nouvel Enseignant
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    {["N°", "Nom et Prénoms", "Grade", "Statut", "Établissement", "ET", "ED", "EP", "Sout.", "Rech.", "HC Brut", "Oblig.", "HC Net", "Brut", "IRSA", "Net", "Actions"].map(h => (
                      <th key={h} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 text-center whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="text-center py-16 text-slate-400">
                        <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun enseignant avec heures pour {selectedAnnee?.libelle}</p>
                        <button onClick={handleOpenAddHeures} className="mt-3 text-emerald-600 hover:underline text-sm">
                          + Saisir des heures complémentaires
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e, idx) => {
                      const { hc, obligation, hcArr, montantBrut, irsa, net } = calcRow(e);
                      return (
                        <tr
                          key={e.id}
                          className={`hover:bg-indigo-50/50 transition ${
                            e.statut === "Permanent" ? "bg-purple-50/20" : "bg-emerald-50/20"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-xs">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                            {e.nomPrenom}
                            {e.specialite && <p className="text-xs text-slate-400 font-normal">{e.specialite}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <GradeBadge grade={e.gradeCode || "-"} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <StatutBadge statut={e.statut} />
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-slate-600 max-w-[120px] truncate">
                            {e.etablissementPrincipal || "—"}
                          </td>
                          {[e.total_et, e.total_ed, e.total_ep, e.total_soutenance, e.total_recherche].map((v, i) => (
                            <td key={i} className="px-2 py-2.5 text-center text-xs font-mono">
                              {v ? v.toFixed(v % 1 === 0 ? 0 : 1) : <span className="text-slate-300">-</span>}
                            </td>
                          ))}
                          <td className="px-2 py-2.5 text-center text-xs font-semibold text-indigo-700">{hc.toFixed(0)}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-orange-600">
                            {e.exempte ? "Exempt" : obligation}
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs font-semibold text-green-700">{hcArr}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-mono">{montantBrut.toLocaleString("fr-MG")}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-mono text-red-600">
                            {irsa > 0 ? `-${irsa.toLocaleString("fr-MG")}` : "—"}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`text-xs font-bold ${net > 0 ? "text-emerald-700" : "text-red-600"}`}>
                              {net.toLocaleString("fr-MG")}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center justify-center gap-0.5">
                              <button onClick={() => handleEditEns(e)} title="Modifier"
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleOpenHeures(e)} title="Heures"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition">
                                <BarChart3 size={14} />
                              </button>
                              <button onClick={() => handleOpenPaiement(e)} title="Préparer paiement"
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition">
                                <Wallet size={14} />
                              </button>
                              <button onClick={() => handleOpenFiche(e)} title="Fiche"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition">
                                <FileText size={14} />
                              </button>
                              <button onClick={() => handleDeleteEns(e.id)} title="Supprimer"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
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

          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{filtered.length} enseignant(s) – {selectedAnnee?.libelle}</span>
              <span className="font-semibold text-indigo-700">
                Total Net : {formatAriary(stats.montant)}
              </span>
            </div>
          )}
        </div>

        {/* Grades Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {grades.map((g) => (
            <div key={g.code} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <GradeBadge grade={g.code} />
                <span className="text-xs text-slate-400">Taux horaire</span>
              </div>
              <p className="text-xs text-slate-500">{g.libelle}</p>
              <p className="text-xl font-bold text-indigo-800 mt-1">{g.tauxHoraire.toLocaleString("fr-MG")} Ar/h</p>
              {g.obligationService > 0 && (
                <p className="text-xs text-orange-600 mt-0.5">Obligation: {g.obligationService}h</p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* Modal Saisie Heures avec Autocomplete */}
      <Modal isOpen={showAddHeuresModal} onClose={() => setShowAddHeuresModal(false)}
        title="📋 Saisir des Heures Complémentaires" size="2xl">
        <div className="space-y-4">
          {/* Recherche enseignant */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Enseignant <span className="text-slate-400">(rechercher ou créer)</span>
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tapez le nom de l'enseignant..."
                value={ensSearchQuery}
                onChange={(e) => setEnsSearchQuery(e.target.value)}
                onFocus={() => ensSearchQuery.length >= 2 && setShowEnsDropdown(true)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            {/* Dropdown */}
            {showEnsDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {ensSearchResults.length > 0 ? (
                  ensSearchResults.map(ens => (
                    <button
                      key={ens.id}
                      onClick={() => handleSelectEnsForHeures(ens)}
                      className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{ens.nomPrenom}</span>
                        {ens.gradeCode && <GradeBadge grade={ens.gradeCode} />}
                      </div>
                      <span className="text-xs text-slate-400">{ens.etablissementPrincipal}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-500 mb-2">Aucun enseignant trouvé</p>
                    <button
                      onClick={handleCreateAndSelectEns}
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mx-auto"
                    >
                      <Plus size={14} /> Créer "{ensSearchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enseignant sélectionné */}
          {selectedEnsForHeures && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-indigo-600" />
                <div>
                  <p className="font-semibold text-indigo-900">{selectedEnsForHeures.nomPrenom}</p>
                  <p className="text-xs text-indigo-600">
                    {selectedEnsForHeures.gradeCode || "Sans grade"} • {selectedEnsForHeures.statut}
                  </p>
                </div>
              </div>
              <button onClick={() => { setSelectedEnsForHeures(null); setEnsSearchQuery(""); }}
                className="p-1 hover:bg-indigo-100 rounded">
                <X size={16} className="text-indigo-600" />
              </button>
            </div>
          )}

          {/* Form heures */}
          {selectedEnsForHeures && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Faculté / Parcours</label>
                <select value={heuresForm.faculteId} onChange={(e) => setHeuresForm({ ...heuresForm, faculteId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- Sélectionner --</option>
                  {facultes.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.etablissement} {f.mention && `- ${f.mention}`} {f.parcours && `- ${f.parcours}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <NumInput label="ET" value={heuresForm.heuresET} onChange={(v) => setHeuresForm({ ...heuresForm, heuresET: v })} />
                <NumInput label="ED" value={heuresForm.heuresED} onChange={(v) => setHeuresForm({ ...heuresForm, heuresED: v })} />
                <NumInput label="EP" value={heuresForm.heuresEP} onChange={(v) => setHeuresForm({ ...heuresForm, heuresEP: v })} />
                <NumInput label="Soutenance" value={heuresForm.heuresSoutenance} onChange={(v) => setHeuresForm({ ...heuresForm, heuresSoutenance: v })} />
                <NumInput label="Recherche" value={heuresForm.heuresRecherche} onChange={(v) => setHeuresForm({ ...heuresForm, heuresRecherche: v })} />
              </div>
              <div className="flex justify-end">
                <button onClick={handleAddHeuresForSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                  <Plus size={16} /> Enregistrer les heures
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Enseignant */}
      <Modal isOpen={showEnsModal} onClose={() => setShowEnsModal(false)}
        title={editEns?.id ? "✏️ Modifier Enseignant" : "➕ Nouvel Enseignant"} size="2xl">
        <form onSubmit={handleSaveEns} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom et Prénoms *" value={ensForm.nomPrenom}
              onChange={(v) => setEnsForm({ ...ensForm, nomPrenom: v })} required />
            <Input label="CIN" value={ensForm.cin}
              onChange={(v) => setEnsForm({ ...ensForm, cin: v })} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
              <select value={ensForm.gradeId} onChange={(e) => setEnsForm({ ...ensForm, gradeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">-- Sélectionner --</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.code} - {g.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
              <select value={ensForm.statut} onChange={(e) => setEnsForm({ ...ensForm, statut: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Permanent">Permanent</option>
                <option value="Vacataire">Vacataire</option>
              </select>
            </div>
            <Input label="Spécialité" value={ensForm.specialite}
              onChange={(v) => setEnsForm({ ...ensForm, specialite: v })} />
            <Input label="Établissement principal" value={ensForm.etablissementPrincipal}
              onChange={(v) => setEnsForm({ ...ensForm, etablissementPrincipal: v })} />
            <Input label="Téléphone" value={ensForm.telephone}
              onChange={(v) => setEnsForm({ ...ensForm, telephone: v })} />
            <Input label="Email" value={ensForm.email}
              onChange={(v) => setEnsForm({ ...ensForm, email: v })} />
            <Input label="RIB" value={ensForm.rib}
              onChange={(v) => setEnsForm({ ...ensForm, rib: v })} />
            <Input label="Banque" value={ensForm.banque}
              onChange={(v) => setEnsForm({ ...ensForm, banque: v })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowEnsModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={formLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {formLoading ? "..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Heures */}
      <Modal isOpen={showHeuresModal} onClose={() => { setShowHeuresModal(false); loadEnseignants(); }}
        title={`📋 Heures – ${selectedEns?.nomPrenom || ""}`} size="2xl">
        <div className="space-y-4">
          {/* Form to add */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-700">Ajouter des heures</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Faculté / Parcours</label>
                <select value={heuresForm.faculteId} onChange={(e) => setHeuresForm({ ...heuresForm, faculteId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- Sélectionner --</option>
                  {facultes.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.etablissement} {f.mention && `- ${f.mention}`} {f.parcours && `- ${f.parcours}`}
                    </option>
                  ))}
                </select>
              </div>
              <NumInput label="ET" value={heuresForm.heuresET} onChange={(v) => setHeuresForm({ ...heuresForm, heuresET: v })} />
              <NumInput label="ED" value={heuresForm.heuresED} onChange={(v) => setHeuresForm({ ...heuresForm, heuresED: v })} />
              <NumInput label="EP" value={heuresForm.heuresEP} onChange={(v) => setHeuresForm({ ...heuresForm, heuresEP: v })} />
              <NumInput label="Soutenance" value={heuresForm.heuresSoutenance} onChange={(v) => setHeuresForm({ ...heuresForm, heuresSoutenance: v })} />
              <NumInput label="Recherche" value={heuresForm.heuresRecherche} onChange={(v) => setHeuresForm({ ...heuresForm, heuresRecherche: v })} />
            </div>
            <button onClick={handleAddHeures}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Plus size={16} /> Ajouter
            </button>
          </div>

          {/* List */}
          {heuresList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Faculté</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600">ET</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600">ED</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600">EP</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600">Sout.</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600">Rech.</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600">Total</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heuresList.map(h => {
                    const tot = h.heuresET + h.heuresED + h.heuresEP + h.heuresSoutenance + h.heuresRecherche;
                    return (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs">
                          {h.faculte?.etablissement || "—"} {h.faculte?.parcours && `- ${h.faculte.parcours}`}
                        </td>
                        <td className="px-2 py-2 text-center text-xs">{h.heuresET}</td>
                        <td className="px-2 py-2 text-center text-xs">{h.heuresED}</td>
                        <td className="px-2 py-2 text-center text-xs">{h.heuresEP}</td>
                        <td className="px-2 py-2 text-center text-xs">{h.heuresSoutenance}</td>
                        <td className="px-2 py-2 text-center text-xs">{h.heuresRecherche}</td>
                        <td className="px-2 py-2 text-center text-xs font-bold text-indigo-700">{tot}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => handleDeleteHeures(h.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded">
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
        </div>
      </Modal>

      {/* Modal Préparation Paiement */}
      <Modal isOpen={showPaiementModal} onClose={() => setShowPaiementModal(false)}
        title="💰 Préparation du Paiement" size="lg">
        {selectedEns && paiementPreview && (
          <div className="space-y-4">
            {/* Info enseignant */}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-semibold">{selectedEns.nomPrenom}</p>
              <p className="text-xs text-slate-500">
                {selectedEns.gradeCode} • {selectedEns.statut} • {selectedEns.etablissementPrincipal}
              </p>
            </div>

            {/* Détection automatique */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${selectedAnnee?.appliquerIRSA ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                <p className="text-xs font-medium text-slate-600">IRSA</p>
                <p className={`font-bold ${selectedAnnee?.appliquerIRSA ? "text-red-700" : "text-green-700"}`}>
                  {selectedAnnee?.appliquerIRSA ? `Appliqué (${selectedAnnee.tauxIRSA}%)` : "Non appliqué"}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200">
                <p className="text-xs font-medium text-slate-600">Tranche</p>
                <p className="font-bold text-indigo-700">{selectedAnnee?.tranche}</p>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="px-3 py-2">HC Nette (arrondie)</td><td className="px-3 py-2 text-right font-bold">{paiementPreview.hcArr} h</td></tr>
                  <tr className="border-b"><td className="px-3 py-2">Taux horaire</td><td className="px-3 py-2 text-right">{paiementPreview.taux.toLocaleString("fr-MG")} Ar</td></tr>
                  <tr className="border-b bg-amber-50"><td className="px-3 py-2 font-bold">Montant Brut</td><td className="px-3 py-2 text-right font-bold text-amber-700">{paiementPreview.montantBrut.toLocaleString("fr-MG")} Ar</td></tr>
                  {selectedAnnee?.appliquerIRSA && (
                    <tr className="border-b"><td className="px-3 py-2 text-red-600">IRSA ({selectedAnnee.tauxIRSA}%)</td><td className="px-3 py-2 text-right text-red-600">-{paiementPreview.irsa.toLocaleString("fr-MG")} Ar</td></tr>
                  )}
                  <tr className="border-b"><td className="px-3 py-2">Montant Net</td><td className="px-3 py-2 text-right">{paiementPreview.montantNet.toLocaleString("fr-MG")} Ar</td></tr>
                  {(selectedEns.total_avance || 0) > 0 && (
                    <tr className="border-b"><td className="px-3 py-2">Déjà payé</td><td className="px-3 py-2 text-right">-{(selectedEns.total_avance || 0).toLocaleString("fr-MG")} Ar</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Form paiement */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pourcentage de la tranche (%)</label>
                <input type="number" min={1} max={100} value={paiementForm.pourcentageTranche}
                  onChange={(e) => setPaiementForm({ ...paiementForm, pourcentageTranche: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Avance à déduire</label>
                <input type="number" min={0} value={paiementForm.montantAvance}
                  onChange={(e) => setPaiementForm({ ...paiementForm, montantAvance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date paiement</label>
                <input type="date" value={paiementForm.datePaiement}
                  onChange={(e) => setPaiementForm({ ...paiementForm, datePaiement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Référence</label>
                <input type="text" value={paiementForm.reference}
                  onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <p className="text-xs text-emerald-600 mb-1">Montant de cette tranche ({paiementForm.pourcentageTranche}%)</p>
              <p className="text-3xl font-bold text-emerald-700">{paiementPreview.montantPaye.toLocaleString("fr-MG")} Ar</p>
              {paiementPreview.resteAPayer > 0 && (
                <p className="text-xs text-slate-500 mt-1">Reste à payer: {paiementPreview.resteAPayer.toLocaleString("fr-MG")} Ar</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPaiementModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Annuler</button>
              <button onClick={handleSavePaiement}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                <CreditCard size={16} /> Enregistrer le paiement
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Fiche */}
      <Modal isOpen={showFicheModal} onClose={() => setShowFicheModal(false)}
        title="📄 Fiche Individuelle de Paiement" size="full">
        {ficheData && <FicheIndividuelle data={ficheData} />}
      </Modal>

      {/* Modal Facultés */}
      <Modal isOpen={showFacModal} onClose={() => setShowFacModal(false)}
        title="🏛️ Gestion des Facultés / Parcours" size="2xl">
        <div className="space-y-4">
          <form onSubmit={handleSaveFac} className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Établissement *" value={facForm.etablissement}
                onChange={(v) => setFacForm({ ...facForm, etablissement: v })} required />
              <Input label="Mention" value={facForm.mention}
                onChange={(v) => setFacForm({ ...facForm, mention: v })} />
              <Input label="Parcours" value={facForm.parcours}
                onChange={(v) => setFacForm({ ...facForm, parcours: v })} />
              <Input label="Niveau" value={facForm.niveau}
                onChange={(v) => setFacForm({ ...facForm, niveau: v })} />
            </div>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              <Plus size={16} /> Ajouter
            </button>
          </form>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Établissement</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Mention</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Parcours</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Niveau</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultes.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs font-medium">{f.etablissement}</td>
                    <td className="px-3 py-2 text-xs">{f.mention || "—"}</td>
                    <td className="px-3 py-2 text-xs">{f.parcours || "—"}</td>
                    <td className="px-3 py-2 text-xs">{f.niveau || "—"}</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => handleDeleteFac(f.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Année / IRSA */}
      <Modal isOpen={showAnneeModal} onClose={() => setShowAnneeModal(false)}
        title="📅 Gestion des Années Universitaires" size="2xl">
        <div className="space-y-6">
          {/* Add form */}
          <form onSubmit={handleSaveAnnee} className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-700">Nouvelle année</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Libellé *" value={anneeForm.libelle} placeholder="ex: 2026-2027"
                onChange={(v) => setAnneeForm({ ...anneeForm, libelle: v })} required />
              <Input label="Tranche" value={anneeForm.tranche}
                onChange={(v) => setAnneeForm({ ...anneeForm, tranche: v })} />
              <div className="flex items-center gap-3 col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={anneeForm.appliquerIRSA}
                    onChange={(e) => setAnneeForm({ ...anneeForm, appliquerIRSA: e.target.checked })}
                    className="rounded" />
                  Appliquer IRSA
                </label>
                {anneeForm.appliquerIRSA && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Taux:</span>
                    <input type="number" min={0} max={100} value={anneeForm.tauxIRSA}
                      onChange={(e) => setAnneeForm({ ...anneeForm, tauxIRSA: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                )}
              </div>
              <Input label="Plafond paiement (Ar)" value={anneeForm.plafondPaiement}
                onChange={(v) => setAnneeForm({ ...anneeForm, plafondPaiement: v })} />
            </div>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Plus size={16} /> Ajouter
            </button>
          </form>

          {/* List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Année</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Tranche</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">IRSA</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Taux</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Plafond</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {annees.map(a => (
                  <tr key={a.id} className={`hover:bg-slate-50 ${a.active ? "bg-green-50" : ""}`}>
                    <td className="px-3 py-2 font-medium">{a.libelle}</td>
                    <td className="px-3 py-2 text-xs">{a.tranche}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleUpdateAnnee(a, "appliquerIRSA", !a.appliquerIRSA)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          a.appliquerIRSA ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {a.appliquerIRSA ? "Oui" : "Non"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {a.appliquerIRSA ? `${a.tauxIRSA}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-mono">
                      {a.plafondPaiement ? Number(a.plafondPaiement).toLocaleString("fr-MG") : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleUpdateAnnee(a, "active", !a.active)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          a.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.active ? "✓ Active" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Grades */}
      <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)}
        title="🎓 Gestion des Grades et Taux" size="lg">
        <div className="space-y-3">
          {grades.map(g => (
            <div key={g.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <GradeBadge grade={g.code} />
              <div className="flex-1">
                <p className="text-sm font-medium">{g.libelle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Taux:</span>
                <input
                  type="number"
                  defaultValue={g.tauxHoraire}
                  onBlur={(e) => {
                    const newVal = Number(e.target.value);
                    if (newVal !== g.tauxHoraire) {
                      fetch("/api/grades", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: g.id, tauxHoraire: newVal, obligationService: g.obligationService }),
                      }).then(() => loadGrades());
                    }
                  }}
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                />
                <span className="text-xs text-slate-500">Ar/h</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Oblig:</span>
                <input
                  type="number"
                  defaultValue={g.obligationService}
                  onBlur={(e) => {
                    const newVal = Number(e.target.value);
                    if (newVal !== g.obligationService) {
                      fetch("/api/grades", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: g.id, tauxHoraire: g.tauxHoraire, obligationService: newVal }),
                      }).then(() => loadGrades());
                    }
                  }}
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                />
                <span className="text-xs text-slate-500">h</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; color: string;
}) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    rose: "from-rose-500 to-rose-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
          <span className={`p-2 rounded-lg bg-gradient-to-br ${colors[color]} text-white`}>{icon}</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
        <div className="text-xs text-slate-400">{sub}</div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${colors[color]}`} />
    </div>
  );
}

function Input({ label, value, onChange, required = false, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>
  );
}

function FicheIndividuelle({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    numeroEtat: string;
    annee: string;
    tranche: string;
    enseignant: { nomPrenom: string; cin: string; statut: string; telephone: string; email: string; rib: string; banque: string; etablissementPrincipal: string; specialite: string };
    grade: { code: string; libelle: string; taux: number } | null;
    detailsParFaculte: Record<string, { etablissement: string; mention: string; parcours: string; et: number; ed: number; ep: number; sout: number; rech: number }[]>;
    totaux: { et: number; ed: number; ep: number; soutenance: number; recherche: number; hcBrut: number; obligation: number; exempte: boolean; hcNette: number; hcArrondi: number };
    calculs: { taux: number; montantBrut: number; plafondApplique: number | null; appliquerIRSA: boolean; tauxIRSA: number; montantIRSA: number; montantNet: number; totalAvance: number; netAPayer: number; netEnLettres: string };
  };

  return (
    <div className="print:text-black">
      <div className="flex justify-end gap-3 mb-4 no-print">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800">
          🖨️ Imprimer / PDF
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 text-sm">
        {/* Header */}
        <div className="text-center border-b border-slate-300 pb-4">
          <h2 className="text-lg font-bold uppercase">Fiche Individuelle de Paiement</h2>
          <h3 className="text-base font-semibold text-slate-700">Heures Complémentaires</h3>
          <p className="text-sm text-slate-600">Année Universitaire: <strong>{d.annee}</strong> — {d.tranche}</p>
          <p className="text-xs text-slate-500">État N° {d.numeroEtat}</p>
        </div>

        {/* Enseignant info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Nom et Prénoms:</span> <strong>{d.enseignant.nomPrenom}</strong></div>
          <div><span className="text-slate-500">CIN:</span> {d.enseignant.cin || "—"}</div>
          <div><span className="text-slate-500">Grade:</span> <strong>{d.grade?.code}</strong> ({d.grade?.libelle})</div>
          <div><span className="text-slate-500">Statut:</span> {d.enseignant.statut}</div>
          <div><span className="text-slate-500">Établissement:</span> {d.enseignant.etablissementPrincipal || "—"}</div>
          <div><span className="text-slate-500">RIB:</span> {d.enseignant.rib || "—"}</div>
        </div>

        {/* Details par faculté */}
        <div className="space-y-2">
          <h4 className="font-semibold border-b pb-1">Détail des heures par établissement</h4>
          {Object.entries(d.detailsParFaculte).map(([etab, rows]) => (
            <div key={etab} className="mb-2">
              <p className="font-medium text-slate-700">{etab}</p>
              <table className="w-full text-xs border border-slate-200 mt-1">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1 border text-left">Parcours</th>
                    <th className="px-2 py-1 border text-center">ET</th>
                    <th className="px-2 py-1 border text-center">ED</th>
                    <th className="px-2 py-1 border text-center">EP</th>
                    <th className="px-2 py-1 border text-center">Sout.</th>
                    <th className="px-2 py-1 border text-center">Rech.</th>
                    <th className="px-2 py-1 border text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const tot = r.et + r.ed + r.ep + r.sout + r.rech;
                    return (
                      <tr key={i}>
                        <td className="px-2 py-1 border">{r.parcours || r.mention || "—"}</td>
                        <td className="px-2 py-1 border text-center">{r.et}</td>
                        <td className="px-2 py-1 border text-center">{r.ed}</td>
                        <td className="px-2 py-1 border text-center">{r.ep}</td>
                        <td className="px-2 py-1 border text-center">{r.sout}</td>
                        <td className="px-2 py-1 border text-center">{r.rech}</td>
                        <td className="px-2 py-1 border text-center font-bold">{tot}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Calculs */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="px-3 py-2">Total HC Brut</td><td className="px-3 py-2 text-right font-bold">{d.totaux.hcBrut.toFixed(2)} h</td></tr>
              <tr className="border-b"><td className="px-3 py-2">Obligation de service</td><td className="px-3 py-2 text-right">{d.totaux.exempte ? "Exempté" : `${d.totaux.obligation} h`}</td></tr>
              <tr className="border-b bg-blue-50"><td className="px-3 py-2 font-bold">HC Nette (arrondie)</td><td className="px-3 py-2 text-right font-bold text-blue-700">{d.totaux.hcArrondi} h</td></tr>
              <tr className="border-b"><td className="px-3 py-2">Taux horaire ({d.grade?.code})</td><td className="px-3 py-2 text-right">{d.calculs.taux.toLocaleString("fr-MG")} Ar</td></tr>
              <tr className="border-b bg-amber-50"><td className="px-3 py-2 font-bold">Montant Brut</td><td className="px-3 py-2 text-right font-bold text-amber-700">{d.calculs.montantBrut.toLocaleString("fr-MG")} Ar</td></tr>
              {d.calculs.plafondApplique && (
                <tr className="border-b"><td className="px-3 py-2 text-orange-600">Plafond appliqué</td><td className="px-3 py-2 text-right text-orange-600">{d.calculs.plafondApplique.toLocaleString("fr-MG")} Ar</td></tr>
              )}
              {d.calculs.appliquerIRSA ? (
                <tr className="border-b"><td className="px-3 py-2 text-red-600">IRSA ({d.calculs.tauxIRSA}%)</td><td className="px-3 py-2 text-right text-red-600">-{d.calculs.montantIRSA.toLocaleString("fr-MG")} Ar</td></tr>
              ) : (
                <tr className="border-b"><td className="px-3 py-2 text-green-600">IRSA</td><td className="px-3 py-2 text-right text-green-600">Non appliqué</td></tr>
              )}
              <tr className="border-b"><td className="px-3 py-2">Montant Net</td><td className="px-3 py-2 text-right">{d.calculs.montantNet.toLocaleString("fr-MG")} Ar</td></tr>
              {d.calculs.totalAvance > 0 && (
                <tr className="border-b"><td className="px-3 py-2">Avance déduite</td><td className="px-3 py-2 text-right">-{d.calculs.totalAvance.toLocaleString("fr-MG")} Ar</td></tr>
              )}
              <tr className="bg-emerald-50"><td className="px-3 py-2 font-bold text-lg">NET À PAYER</td><td className="px-3 py-2 text-right font-bold text-lg text-emerald-700">{d.calculs.netAPayer.toLocaleString("fr-MG")} Ar</td></tr>
            </tbody>
          </table>
        </div>

        {/* Montant en lettres */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500">Montant net en toutes lettres:</p>
          <p className="font-bold italic">{d.calculs.netEnLettres}</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-4">
          <div className="text-center">
            <p className="font-semibold mb-16">L&apos;intéressé(e)</p>
            <div className="border-t border-slate-400 pt-1">Signature</div>
          </div>
          <div className="text-center">
            <p className="font-semibold mb-16">Le Responsable</p>
            <div className="border-t border-slate-400 pt-1">Signature et cachet</div>
          </div>
        </div>
      </div>
    </div>
  );
}
