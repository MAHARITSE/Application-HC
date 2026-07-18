"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Modal from "@/components/Modal";
import { GradeBadge, StatutBadge } from "@/components/Badge";
import EnseignantForm from "@/components/EnseignantForm";
import {
  Search,
  Plus,
  FileText,
  Settings,
  Trash2,
  Edit,
  BarChart3,
  X,
  RefreshCw,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  Download,
  Printer,
  Shield,
  Ticket,
} from "lucide-react";
import { calcHC, calcHCNette, calcHCArrondie, calcMontantBrut, calcIRSA, formatAriary, DEFAULT_HC_FORMULA } from "@/lib/metier";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Annee {
  id: number;
  libelle: string;
  tranche: string;
  active: boolean;
  appliquerIRSA: boolean;
  tauxIRSA: number;
  plafondPaiement: string | null;
  formuleHC?: string;
}
interface Grade {
  id: number;
  code: string;
  libelle: string;
  tauxHoraire: number;
}
interface Faculte {
  id: number;
  etablissement: string;
  domaine: string;
  mention: string;
  parcours: string | null;
  code: string | null;
}
interface EnseignantRow {
  id: number;
  nom: string;
  prenom: string | null;
  nomPrenom: string;
  cin: string | null;
  dateCIN?: string | null;
  statut: string;
  gradeCode: string | null;
  gradeLibelle?: string | null;
  gradeTaux: number | null;
  gradeId?: number | null;
  etablissementPrincipal: string | null;
  structureEtablissement?: string | null;
  structureDomaine?: string | null;
  structureMention?: string | null;
  rib: string | null;
  telephone: string | null;
  email: string | null;
  specialite: string | null;
  adresse?: string | null;
  total_et: number;
  total_ed: number;
  total_ep: number;
  total_soutenance: number;
  total_recherche: number;
  total_avance: number;
  total_paye?: number;
  pourcentage_tranche?: number;
  nb_paiements?: number;
  obligation: number;
  obligation_custom?: number | null;
  exempte?: boolean;
}
interface EnseignantBase {
  id: number;
  nom: string;
  prenom: string | null;
  nomPrenom: string;
  cin: string | null;
  telephone: string | null;
  email: string | null;
  rib: string | null;
  etablissementPrincipal: string | null;
  specialite: string | null;
  adresse?: string | null;
  nationalite?: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  dateRecrutement?: string | null;
  dateCIN?: string | null;
  gradeId?: number | null;
  gradeCode?: string | null;
  gradeLibelle?: string | null;
}

interface HeureDetail {
  id: number;
  enseignantId: number;
  anneeId: number;
  parcoursId: number | null;
  gradeId: number | null;
  statut: string;
  heuresET: number;
  heuresED: number;
  heuresEP: number;
  heuresSoutenance: number;
  heuresRecherche: number;
  obligation: number;
  structure: Faculte | null;
  grade: Grade | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  // ── State principaux ────────────────────────────────────────────────────────
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [selectedAnnee, setSelectedAnnee] = useState<Annee | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [facultes, setFacultes] = useState<Faculte[]>([]);
  const [enseignants, setEnseignants] = useState<EnseignantRow[]>([]);
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
  const [showAllEnsModal, setShowAllEnsModal] = useState(false);

  const [editEns, setEditEns] = useState<EnseignantBase | null>(null);
  const [selectedEns, setSelectedEns] = useState<EnseignantRow | null>(null);
  const [ficheData, setFicheData] = useState<Record<string, unknown> | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [allEnsSearch, setAllEnsSearch] = useState("");
  const [returnToAllEnsAfterEdit, setReturnToAllEnsAfterEdit] = useState(false);

  // Recherche enseignant pour heures (autocomplete)
  const [ensSearchQuery, setEnsSearchQuery] = useState("");
  const [ensSearchResults, setEnsSearchResults] = useState<EnseignantBase[]>([]);
  const [selectedEnsForHeures, setSelectedEnsForHeures] = useState<EnseignantBase | null>(null);

  // Formulaire saisie HC (étape 2) - conforme prompt.md: grade et statut stockés dans heures
  const [heuresHCForm, setHeuresHCForm] = useState({
    gradeId: "",
    statut: "Vacataire" as "Permanent" | "Vacataire",
    parcoursId: "",
    heuresET: 0,
    heuresED: 0,
    heuresEP: 0,
    heuresSoutenance: 0,
    heuresRecherche: 0,
    obligation: 125,
  });

  // Heures detail list
  const [heuresList, setHeuresList] = useState<HeureDetail[]>([]);
  const [heuresForm, setHeuresForm] = useState({
    parcoursId: "",
    gradeId: "",
    statut: "Vacataire" as "Permanent" | "Vacataire",
    heuresET: 0,
    heuresED: 0,
    heuresEP: 0,
    heuresSoutenance: 0,
    heuresRecherche: 0,
    obligation: 125,
  });
  const [editingHeureId, setEditingHeureId] = useState<number | null>(null);

  // Structure académique : Établissement*, Domaine*, Mention*, Parcours
  const [facForm, setFacForm] = useState({
    etablissement: "",
    domaine: "",
    mention: "",
    parcours: "",
    code: "",
  });
  const [editingFacId, setEditingFacId] = useState<number | null>(null);
  const [facSuggestions, setFacSuggestions] = useState<Record<string, string[]>>({});
  const [facError, setFacError] = useState("");

  const [anneeForm, setAnneeForm] = useState({
    libelle: "",
    tranche: "Première tranche",
    active: false,
    appliquerIRSA: true,
    tauxIRSA: 20,
    plafondPaiement: "",
    formuleHC: DEFAULT_HC_FORMULA,
  });
  const [editingAnneeId, setEditingAnneeId] = useState<number | null>(null);

  const [paiementForm, setPaiementForm] = useState({
    pourcentageTranche: 100,
    montantAvance: 0,
    dateAvance: "",
    datePaiement: new Date().toISOString().slice(0, 10),
    reference: "",
  });

  const [returnToHeuresAfterCreate, setReturnToHeuresAfterCreate] = useState(false);

  // Nouveaux états pour la gestion des paiements et fiches individuelles demandées
  const [showEtatFicheModal, setShowEtatFicheModal] = useState(false);
  const [etatFicheForm, setEtatFicheForm] = useState({ numeroEtat: "0001", tranche: "" });
  const [targetEnsForFiche, setTargetEnsForFiche] = useState<EnseignantRow | null>(null);

  const [showPaiementManagerModal, setShowPaiementManagerModal] = useState(false);
  const [paiementManagerTab, setPaiementManagerTab] = useState<"choice" | "list" | "batch">("choice");
  const [allPaiements, setAllPaiements] = useState<any[]>([]);
  const [batchPaiementForm, setBatchPaiementForm] = useState({
    pourcentageTranche: 100,
    montantAvance: 0,
    datePaiement: new Date().toISOString().slice(0, 10),
    reference: "",
  });
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [batchFichesData, setBatchFichesData] = useState<any[]>([]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fetchDistinct = useCallback(async (field: string, q: string) => {
    if (!q || q.length < 1) return [];
    try {
      const res = await fetch(`/api/structures?field=${field}&distinct=true&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, []);

  const handleFacFieldChange = async (field: keyof typeof facForm, value: string) => {
    setFacForm((f) => ({ ...f, [field]: value }));
    // Autocomplete
    if (["etablissement", "domaine", "mention", "parcours"].includes(field) && value.length >= 1) {
      const sugg = await fetchDistinct(field, value);
      setFacSuggestions((s) => ({ ...s, [field]: sugg }));
    }
  };

  // ── Initialisation ──────────────────────────────────────────────────────────
  const initSeed = useCallback(async () => {
    if (seeded) return;
    await fetch("/api/seed", { method: "POST" });
    setSeeded(true);
  }, [seeded]);

  const loadAnnees = useCallback(async () => {
    const res = await fetch("/api/annees");
    const data: Annee[] = await res.json();
    // Tri desc par libelle déjà, mais on s'assure que la dernière année est en premier
    const sorted = [...data].sort((a, b) => b.libelle.localeCompare(a.libelle));
    setAnnees(sorted);
    if (!selectedAnnee && sorted.length > 0) {
      // Se place sur la DERNIÈRE année au lancement selon prompt.md
      setSelectedAnnee(sorted[0]);
    }
  }, [selectedAnnee]);

  const loadGrades = useCallback(async () => {
    const res = await fetch("/api/grades");
    setGrades(await res.json());
  }, []);

  const loadFacultes = useCallback(async () => {
    const res = await fetch("/api/structures");
    setFacultes(await res.json());
  }, []);

  const loadAllEnseignants = useCallback(async () => {
    const res = await fetch("/api/enseignants");
    const data = await res.json();
    setAllEnseignants(data);
  }, []);

  const loadEnseignants = useCallback(async () => {
    if (!selectedAnnee) return;
    setLoading(true);
    const params = new URLSearchParams({
      search,
      anneeId: String(selectedAnnee.id),
    });
    try {
      const res = await fetch(`/api/enseignants?${params}`);
      const data = await res.json();
      setEnseignants(Array.isArray(data) ? data : []);
    } catch {
      setEnseignants([]);
    }
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

  useEffect(() => {
    loadEnseignants();
  }, [loadEnseignants]);

  // Autocomplete enseignants
  useEffect(() => {
    if (ensSearchQuery.length >= 2) {
      const results = allEnseignants.filter((e) => e.nomPrenom.toLowerCase().includes(ensSearchQuery.toLowerCase()));
      setEnsSearchResults(results.slice(0, 20));
    } else {
      setEnsSearchResults([]);
    }
  }, [ensSearchQuery, allEnseignants]);

  // ── Calcul d'une ligne tableau principal ────────────────────────────────────
  const calcRow = useCallback(
    (e: EnseignantRow) => {
      const hcBrut = calcHC(e.total_et, e.total_ed, e.total_ep, e.total_soutenance, e.total_recherche, selectedAnnee?.formuleHC || DEFAULT_HC_FORMULA);
      const obligation = e.obligation ?? (e.statut === "Permanent" ? 125 : 0);
      const { hcNette } = calcHCNette(hcBrut, obligation, e.statut);
      const hcArr = calcHCArrondie(hcNette);
      const taux = e.gradeTaux || 0;
      let montantBrut = calcMontantBrut(hcArr, taux);
      if (selectedAnnee?.plafondPaiement && montantBrut > Number(selectedAnnee.plafondPaiement)) {
        montantBrut = Number(selectedAnnee.plafondPaiement);
      }
      const irsa = calcIRSA(montantBrut, selectedAnnee?.tauxIRSA || 20, selectedAnnee?.appliquerIRSA ?? true);
      const montantNet = montantBrut - irsa;
      // total_avance = avances déduites ; total_paye = montants déjà versés (tranches)
      const totalAvance = e.total_avance || 0;
      const totalPaye = e.total_paye || 0;
      const dejaVerse = totalAvance + totalPaye;
      const resteAPayer = Math.max(0, montantNet - dejaVerse);
      const net = resteAPayer; // Net à payer = reste après avances + paiements
      const pourcentageTranche = Math.min(100, Math.max(0, e.pourcentage_tranche || 0));
      const trancheLabel = selectedAnnee?.tranche || "—";

      return {
        hcBrut,
        obligation,
        hcNette,
        hcArr,
        taux,
        montantBrut,
        irsa,
        montantNet,
        totalAvance,
        totalPaye,
        dejaVerse,
        resteAPayer,
        pourcentageTranche,
        trancheLabel,
        net,
      };
    },
    [selectedAnnee]
  );

  // ── Filtrage tableau ────────────────────────────────────────────────────────
  const filtered = enseignants.filter((e) => {
    if (filterStatut !== "Tous" && e.statut !== filterStatut) return false;
    if (filterGrade !== "Tous" && e.gradeCode !== filterGrade) return false;
    return true;
  });

  const filteredAllEns = allEnseignants.filter((e) => {
    if (!allEnsSearch) return true;
    return e.nomPrenom.toLowerCase().includes(allEnsSearch.toLowerCase());
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: filtered.length,
      perm: filtered.filter((e) => e.statut === "Permanent").length,
      vacat: filtered.filter((e) => e.statut === "Vacataire").length,
      totalHeures: filtered.reduce((sum, e) => sum + calcHC(e.total_et, e.total_ed, e.total_ep, e.total_soutenance, e.total_recherche, selectedAnnee?.formuleHC || DEFAULT_HC_FORMULA), 0),
      montant: filtered.reduce((sum, e) => sum + calcRow(e).net, 0),
      totalAvances: filtered.reduce((sum, e) => sum + (calcRow(e).totalAvance || 0), 0),
      totalPaye: filtered.reduce((sum, e) => sum + (calcRow(e).totalPaye || 0), 0),
      totalReste: filtered.reduce((sum, e) => sum + (calcRow(e).resteAPayer || 0), 0),
    }),
    [filtered, calcRow, selectedAnnee]
  );

  // ── Handlers Enseignant Base (sans grade/statut) ───────────────────────────
  const handleAddEns = () => {
    setEditEns(null);
    setShowEnsModal(true);
  };

  const handleEditEns = (ens: EnseignantBase | EnseignantRow) => {
    if (showAllEnsModal) {
      setShowAllEnsModal(false);
      setReturnToAllEnsAfterEdit(true);
    }
    setEditEns({
      id: ens.id,
      nom: (ens as any).nom || ens.nomPrenom.split(" ")[0],
      prenom: (ens as any).prenom || ens.nomPrenom.split(" ").slice(1).join(" ") || "",
      nomPrenom: ens.nomPrenom,
      cin: (ens as any).cin || null,
      telephone: (ens as any).telephone || null,
      email: (ens as any).email || null,
      rib: (ens as any).rib || null,
      etablissementPrincipal: (ens as any).etablissementPrincipal || null,
      specialite: (ens as any).specialite || null,
      adresse: (ens as any).adresse || null,
      nationalite: (ens as any).nationalite || "Malagasy",
    });
    setShowEnsModal(true);
  };

  const handleSaveEns = async (data: any) => {
    setFormLoading(true);
    try {
      let newEnseignant: any = null;
      if (editEns?.id) {
        const res = await fetch(`/api/enseignants/${editEns.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        newEnseignant = await res.json();
      } else {
        const res = await fetch("/api/enseignants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        newEnseignant = await res.json();
      }
      setShowEnsModal(false);
      await loadEnseignants();
      await loadAllEnseignants();
      if (returnToAllEnsAfterEdit) {
        setShowAllEnsModal(true);
        setReturnToAllEnsAfterEdit(false);
      }

      if (returnToHeuresAfterCreate && newEnseignant) {
        const mapped: EnseignantBase = {
          id: newEnseignant.id,
          nom: newEnseignant.nom,
          prenom: newEnseignant.prenom,
          nomPrenom: `${newEnseignant.nom} ${newEnseignant.prenom || ""}`.trim(),
          cin: newEnseignant.cin,
          telephone: newEnseignant.telephone,
          email: newEnseignant.email,
          rib: newEnseignant.rib,
          etablissementPrincipal: newEnseignant.etablissementPrincipal,
          specialite: newEnseignant.specialite,
        };
        setSelectedEnsForHeures(mapped);
        setEnsSearchQuery(mapped.nomPrenom);
        setShowAddHeuresModal(true);
        setReturnToHeuresAfterCreate(false);
      }
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

  // ── Saisir Heures (2 étapes) ────────────────────────────────────────────────
  const handleOpenAddHeures = () => {
    setSelectedEnsForHeures(null);
    setEnsSearchQuery("");
    setEnsSearchResults([]);
    setHeuresHCForm({
      gradeId: "",
      statut: "Vacataire",
      parcoursId: "",
      heuresET: 0,
      heuresED: 0,
      heuresEP: 0,
      heuresSoutenance: 0,
      heuresRecherche: 0,
      obligation: 0, // vacataire défaut 0
    });
    setShowAddHeuresModal(true);
  };

  const handleSelectEnsForHeures = (ens: EnseignantBase) => {
    setSelectedEnsForHeures(ens);
    setEnsSearchQuery(ens.nomPrenom);
    setEnsSearchResults([]);
  };

  const handleStatutChange = (statut: "Permanent" | "Vacataire") => {
    setHeuresHCForm((f) => ({
      ...f,
      statut,
      obligation: statut === "Vacataire" ? 0 : f.obligation === 0 ? 125 : f.obligation,
    }));
  };

  const handleOpenCreateEnseignant = () => {
    setEditEns(null);
    setReturnToHeuresAfterCreate(true);
    setShowAddHeuresModal(false);
    setShowEnsModal(true);
  };

  const buildHeuresMissingMessage = (form: { gradeId: string; parcoursId: string; heuresET: number; heuresED: number; heuresEP: number; heuresSoutenance: number; heuresRecherche: number }) => {
    const missing: string[] = [];
    if (!form.gradeId) missing.push("Grade * (au moment de la saisie)");
    if (!form.parcoursId) missing.push("Structure académique / parcours (saisie assistée)");
    const total = Number(form.heuresET || 0) + Number(form.heuresED || 0) + Number(form.heuresEP || 0) + Number(form.heuresSoutenance || 0) + Number(form.heuresRecherche || 0);
    if (total === 0) missing.push("Heures complémentaires : ET, ED, EP, Soutenance et Recherche sont tous égaux à 0");
    return missing.length ? `Information manquante ou incohérente :\n- ${missing.join("\n- ")}` : "";
  };

  const handleAddHeuresForSelected = async () => {
    if (!selectedEnsForHeures || !selectedAnnee) return;
    const missingMessage = buildHeuresMissingMessage(heuresHCForm);
    if (missingMessage) {
      alert(missingMessage);
      return;
    }
    const payload = {
      enseignantId: selectedEnsForHeures.id,
      anneeId: selectedAnnee.id,
      gradeId: Number(heuresHCForm.gradeId),
      statut: heuresHCForm.statut,
      parcoursId: heuresHCForm.parcoursId ? Number(heuresHCForm.parcoursId) : null,
      heuresET: heuresHCForm.heuresET,
      heuresED: heuresHCForm.heuresED,
      heuresEP: heuresHCForm.heuresEP,
      heuresSoutenance: heuresHCForm.heuresSoutenance,
      heuresRecherche: heuresHCForm.heuresRecherche,
      obligation: heuresHCForm.obligation,
    };
    const res = await fetch("/api/heures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Erreur");
      return;
    }
    const parcoursIdToKeep = heuresHCForm.parcoursId;
    setSelectedEnsForHeures(null);
    setEnsSearchQuery("");
    setEnsSearchResults([]);
    setHeuresHCForm({
      gradeId: "",
      statut: "Vacataire",
      parcoursId: parcoursIdToKeep,
      heuresET: 0,
      heuresED: 0,
      heuresEP: 0,
      heuresSoutenance: 0,
      heuresRecherche: 0,
      obligation: 0,
    });
    await loadEnseignants();
  };

  // ── Gestion Heures existantes (modal détail) ────────────────────────────────
  const handleOpenHeures = async (e: EnseignantRow) => {
    setSelectedEns(e);
    setEditingHeureId(null);
    setHeuresForm({
      parcoursId: "",
      gradeId: e.gradeId ? String(e.gradeId) : grades[0]?.id ? String(grades[0].id) : "",
      statut: (e.statut as any) || "Vacataire",
      heuresET: 0,
      heuresED: 0,
      heuresEP: 0,
      heuresSoutenance: 0,
      heuresRecherche: 0,
      obligation: e.obligation ?? (e.statut === "Permanent" ? 125 : 0),
    });
    if (selectedAnnee) {
      const res = await fetch(`/api/heures?enseignantId=${e.id}&anneeId=${selectedAnnee.id}`);
      const data: HeureDetail[] = await res.json();
      setHeuresList(data);
    }
    setShowHeuresModal(true);
  };

  const handleEditHeure = (h: HeureDetail) => {
    setEditingHeureId(h.id);
    setHeuresForm({
      parcoursId: h.parcoursId ? String(h.parcoursId) : "",
      gradeId: h.gradeId ? String(h.gradeId) : "",
      statut: h.statut as any,
      heuresET: h.heuresET,
      heuresED: h.heuresED,
      heuresEP: h.heuresEP,
      heuresSoutenance: h.heuresSoutenance,
      heuresRecherche: h.heuresRecherche,
      obligation: h.obligation,
    });
  };

  const handleSaveHeureEdit = async () => {
    if (!editingHeureId) {
      // Ajout nouvelle ligne
      if (!selectedEns || !selectedAnnee) return;
      const missingMessage = buildHeuresMissingMessage(heuresForm);
      if (missingMessage) {
        alert(missingMessage);
        return;
      }
      await fetch("/api/heures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enseignantId: selectedEns.id,
          anneeId: selectedAnnee.id,
          parcoursId: heuresForm.parcoursId ? Number(heuresForm.parcoursId) : null,
          gradeId: Number(heuresForm.gradeId),
          statut: heuresForm.statut,
          heuresET: heuresForm.heuresET,
          heuresED: heuresForm.heuresED,
          heuresEP: heuresForm.heuresEP,
          heuresSoutenance: heuresForm.heuresSoutenance,
          heuresRecherche: heuresForm.heuresRecherche,
          obligation: heuresForm.obligation,
        }),
      });
    } else {
      const missingMessage = buildHeuresMissingMessage(heuresForm);
      if (missingMessage) {
        alert(missingMessage);
        return;
      }
      await fetch(`/api/heures/${editingHeureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcoursId: heuresForm.parcoursId ? Number(heuresForm.parcoursId) : null,
          gradeId: Number(heuresForm.gradeId),
          statut: heuresForm.statut,
          heuresET: heuresForm.heuresET,
          heuresED: heuresForm.heuresED,
          heuresEP: heuresForm.heuresEP,
          heuresSoutenance: heuresForm.heuresSoutenance,
          heuresRecherche: heuresForm.heuresRecherche,
          obligation: heuresForm.obligation,
        }),
      });
    }
    if (selectedEns) handleOpenHeures(selectedEns);
    await loadEnseignants();
    const parcoursIdToKeep = heuresForm.parcoursId;
    setEditingHeureId(null);
    setHeuresForm({
      parcoursId: parcoursIdToKeep,
      gradeId: "",
      statut: "Vacataire",
      heuresET: 0,
      heuresED: 0,
      heuresEP: 0,
      heuresSoutenance: 0,
      heuresRecherche: 0,
      obligation: 0,
    });
  };

  const handleDeleteHeures = async (id: number) => {
    if (!confirm("Supprimer cette ligne d'heures ?")) return;
    await fetch(`/api/heures/${id}`, { method: "DELETE" });
    if (selectedEns) handleOpenHeures(selectedEns);
    await loadEnseignants();
  };

  // ── Fiche ───────────────────────────────────────────────────────────────────
  const handleOpenFichePrompt = (e: EnseignantRow) => {
    setTargetEnsForFiche(e);
    setEtatFicheForm({
      numeroEtat: "0001",
      tranche: selectedAnnee?.tranche || "Première tranche",
    });
    setShowEtatFicheModal(true);
  };

  const handleConfirmFiche = async () => {
    if (!targetEnsForFiche || !selectedAnnee) return;
    const res = await fetch(`/api/export/fiche?enseignantId=${targetEnsForFiche.id}&anneeId=${selectedAnnee.id}&numeroEtat=${encodeURIComponent(etatFicheForm.numeroEtat)}`);
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erreur génération fiche");
      return;
    }
    setFicheData(data);
    setSelectedEns(targetEnsForFiche);
    setShowEtatFicheModal(false);
    setShowFicheModal(true);
  };

  const handleOpenFiche = async (e: EnseignantRow) => {
    handleOpenFichePrompt(e);
  };

  const handleOpenPaiementManager = async () => {
    if (!selectedAnnee) return;
    const res = await fetch(`/api/paiements?anneeId=${selectedAnnee.id}`);
    const data = await res.json();
    setAllPaiements(Array.isArray(data) ? data : []);
    setPaiementManagerTab("choice");
    setShowPaiementManagerModal(true);
  };

  const handleBatchPaymentAndPrint = async () => {
    if (!selectedAnnee || filtered.length === 0) {
      alert("Aucun enseignant à payer pour cette année.");
      return;
    }
    setLoading(true);
    try {
      for (const e of filtered) {
        const calc = calcRow(e);
        const montantTranche = Math.round(calc.montantNet * batchPaiementForm.pourcentageTranche / 100);
        const montantPaye = montantTranche - batchPaiementForm.montantAvance;
        await fetch("/api/paiements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enseignantId: e.id,
            anneeId: selectedAnnee.id,
            montantAvance: batchPaiementForm.montantAvance,
            dateAvance: null,
            pourcentageTranche: batchPaiementForm.pourcentageTranche,
            montantPaye: Math.max(0, montantPaye),
            datePaiement: batchPaiementForm.datePaiement || null,
            reference: batchPaiementForm.reference || null,
            statut: batchPaiementForm.pourcentageTranche >= 100 ? "Payé" : "Partiel",
          }),
        });
      }

      let num = 1;
      const fiches = await Promise.all(
        filtered.map(async (e) => {
          const numeroEtat = String(num++).padStart(4, "0");
          const r = await fetch(`/api/export/fiche?enseignantId=${e.id}&anneeId=${selectedAnnee.id}&numeroEtat=${numeroEtat}`);
          return r.ok ? r.json() : null;
        })
      );

      setBatchFichesData(fiches.filter(Boolean));
      setShowPaiementManagerModal(false);
      setShowBatchPrintModal(true);
      await loadEnseignants();
    } finally {
      setLoading(false);
    }
  };

  // ── Paiement ────────────────────────────────────────────────────────────────
  const handleOpenPaiement = (e: EnseignantRow) => {
    setSelectedEns(e);
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

  // ── Structure académique ────────────────────────────────────────────────────────────────
  const handleSaveFac = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacError("");
    try {
      const res = await fetch("/api/structures", {
        method: editingFacId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFacId ? { ...facForm, id: editingFacId } : facForm),
      });
      if (!res.ok) {
        const err = await res.json();
        setFacError(err.error || "Erreur");
        return;
      }
      setFacForm({ etablissement: "", domaine: "", mention: "", parcours: "", code: "" });
      setEditingFacId(null);
      setFacSuggestions({});
      loadFacultes();
    } catch (err: any) {
      setFacError(err.message);
    }
  };

  const handleEditFac = (f: Faculte) => {
    setEditingFacId(f.id);
    setFacForm({
      etablissement: f.etablissement || "",
      domaine: f.domaine || "",
      mention: f.mention || "",
      parcours: f.parcours || "",
      code: f.code || "",
    });
    setFacError("");
  };

  const handleDeleteFac = async (id: number) => {
    if (!confirm("Supprimer cette structure académique ?")) return;
    await fetch(`/api/structures?id=${id}`, { method: "DELETE" });
    loadFacultes();
  };

  // ── Années ──────────────────────────────────────────────────────────────────
  const handleSaveAnnee = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/annees", {
      method: editingAnneeId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingAnneeId ? { ...anneeForm, id: editingAnneeId } : anneeForm),
    });
    setAnneeForm({ libelle: "", tranche: "Première tranche", active: false, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: "", formuleHC: DEFAULT_HC_FORMULA });
    setEditingAnneeId(null);
    loadAnnees();
  };

  const handleEditAnnee = (annee: Annee) => {
    setEditingAnneeId(annee.id);
    setAnneeForm({
      libelle: annee.libelle || "",
      tranche: annee.tranche || "Première tranche",
      active: !!annee.active,
      appliquerIRSA: annee.appliquerIRSA ?? true,
      tauxIRSA: annee.tauxIRSA ?? 20,
      plafondPaiement: annee.plafondPaiement || "",
      formuleHC: annee.formuleHC || DEFAULT_HC_FORMULA,
    });
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

  const paiementPreview = useMemo(() => {
    if (!selectedEns || !selectedAnnee) return null;
    const calc = calcRow(selectedEns);
    const montantTranche = Math.round(calc.montantNet * paiementForm.pourcentageTranche / 100);
    const montantPaye = Math.max(0, montantTranche - paiementForm.montantAvance);
    // Reste actuel (avant ce paiement) vs reste après enregistrement
    const resteActuel = calc.resteAPayer;
    const resteApres = Math.max(0, resteActuel - montantPaye - (paiementForm.montantAvance || 0));
    return { ...calc, montantTranche, montantPaye, resteActuel, resteApres, resteAPayer: resteApres };
  }, [selectedEns, selectedAnnee, paiementForm, calcRow]);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">HC-Manager</h1>
                <p className="text-[10px] sm:text-xs text-indigo-200">Gestion des Heures Complémentaires - Madagascar</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur">
                <Calendar size={16} className="text-indigo-200" />
                <select
                  value={selectedAnnee?.id || ""}
                  onChange={(e) => {
                    const a = annees.find((x) => x.id === Number(e.target.value));
                    if (a) setSelectedAnnee(a);
                  }}
                  className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
                >
                  {annees.map((a) => (
                    <option key={a.id} value={a.id} className="text-gray-900">
                      {a.libelle} {a.active ? "✓" : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedAnnee && (
                <div className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium hidden sm:block">{selectedAnnee.tranche}</div>
              )}
              {selectedAnnee && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    selectedAnnee.appliquerIRSA ? "bg-red-500/20 text-red-200 border border-red-400/30" : "bg-green-500/20 text-green-200 border border-green-400/30"
                  }`}
                >
                  {selectedAnnee.appliquerIRSA ? (
                    <>
                      <AlertCircle size={12} /> IRSA {selectedAnnee.tauxIRSA}%
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} /> Sans IRSA
                    </>
                  )}
                </div>
              )}
              <button onClick={() => setShowAnneeModal(true)} className="p-2 rounded-lg hover:bg-white/10 transition" title="Paramètres années">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[250px]">
              <div className="relative flex-1 max-w-[280px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher enseignant, cin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition"
                />
              </div>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Tous">Tous statuts</option>
                <option value="Permanent">Permanent</option>
                <option value="Vacataire">Vacataire</option>
              </select>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Tous">Tous grades</option>
                {grades.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.code} - {g.libelle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={handleOpenAddHeures}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
              >
                <BarChart3 size={16} /> Saisir Heures
              </button>
              <button
                onClick={handleOpenPaiementManager}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-sm"
              >
                <CreditCard size={16} /> Paiements
              </button>
              <button
                onClick={() => setShowAllEnsModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
              >
                <Users size={16} /> Enseignants
              </button>
              <button
                onClick={() => setShowFacModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
              >
                <Building2 size={16} /> Structures
              </button>
              <button
                onClick={() => setShowGradeModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-sm"
              >
                <GraduationCap size={16} /> Grades
              </button>
              <button
                onClick={handleAddEns}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                <Plus size={16} /> Nouveau
              </button>
              {selectedAnnee && (
                <button
                  onClick={() => {
                    window.open(`/api/export/excel?anneeId=${selectedAnnee.id}`, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                  title="Exporter en Excel (.xlsx)"
                >
                  <Download size={16} /> Excel
                </button>
              )}
              <a
                href="/impression/ticket"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-sm"
                title="Tickets imprimables"
              >
                <Ticket size={16} /> Tickets
              </a>
              <a
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition shadow-sm"
                title="Administration"
              >
                <Shield size={16} /> Admin
              </a>
            </div>
          </div>
        </div>

        {/* TABLE PRINCIPALE conforme prompt.md */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] sm:text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    {[
                      "N°",
                      "Nom et Prénoms",
                      "Grade (HC)",
                      "Statut (HC)",
                      "Établissement",
                      "ET",
                      "ED",
                      "EP",
                      "Sout.",
                      "Rech.",
                      "HC Brut",
                      "Oblig.",
                      "HC Net",
                      "Brut (Ar)",
                      "IRSA",
                      "Net (Ar)",
                      "Tranche",
                      "Avance",
                      "Payé",
                      "Reste à payer",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-2 sm:px-3 py-2.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-center whitespace-nowrap ${
                          ["Tranche", "Avance", "Payé", "Reste à payer"].includes(h)
                            ? "text-amber-800 bg-amber-50/80"
                            : "text-slate-600"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={21} className="text-center py-16 text-slate-400">
                        <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun enseignant avec heures pour {selectedAnnee?.libelle}</p>
                        <p className="text-xs mt-1">Le tableau liste les HC stockés dans la table heures (grade & statut historiques)</p>
                        <button onClick={handleOpenAddHeures} className="mt-3 text-emerald-600 hover:underline text-sm font-medium">
                          + Saisir des heures complémentaires
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e, idx) => {
                      const {
                        hcBrut,
                        obligation,
                        hcArr,
                        montantBrut,
                        irsa,
                        montantNet,
                        totalAvance,
                        totalPaye,
                        resteAPayer,
                        pourcentageTranche,
                        trancheLabel,
                      } = calcRow(e);
                      return (
                        <tr key={e.id} className={`hover:bg-indigo-50/50 transition ${e.statut === "Permanent" ? "bg-purple-50/10" : "bg-emerald-50/10"}`}>
                          <td className="px-2 py-2.5 text-center text-slate-500 font-mono text-xs">{idx + 1}</td>
                          <td className="px-2 py-2.5 font-semibold text-slate-800 whitespace-nowrap max-w-[180px]">
                            <div className="truncate">{e.nomPrenom}</div>
                            {e.specialite && <div className="text-[10px] text-slate-400 font-normal truncate">{e.specialite}</div>}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <GradeBadge grade={e.gradeCode || "-"} />
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <StatutBadge statut={e.statut} />
                          </td>
                          <td className="px-2 py-2.5 text-center text-[11px] text-slate-600 max-w-[120px] truncate" title={e.structureEtablissement || e.etablissementPrincipal || ""}>
                            {e.structureEtablissement || e.etablissementPrincipal || "—"}
                          </td>
                          {[e.total_et, e.total_ed, e.total_ep, e.total_soutenance, e.total_recherche].map((v, i) => (
                            <td key={i} className="px-1 py-2.5 text-center text-xs font-mono">
                              {v ? v.toFixed(v % 1 === 0 ? 0 : 1) : <span className="text-slate-300">-</span>}
                            </td>
                          ))}
                          <td className="px-1 py-2.5 text-center text-xs font-semibold text-indigo-700">{hcBrut.toFixed(0)}</td>
                          <td className="px-1 py-2.5 text-center text-xs text-orange-600">{obligation === 0 ? "0" : obligation}</td>
                          <td className="px-1 py-2.5 text-center text-xs font-bold text-green-700">{hcArr}</td>
                          <td className="px-2 py-2.5 text-center text-xs font-mono">{montantBrut.toLocaleString("fr-MG")}</td>
                          <td className="px-1 py-2.5 text-center text-[11px] font-mono text-red-600">{irsa > 0 ? `-${irsa.toLocaleString("fr-MG")}` : "—"}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="text-xs font-bold text-slate-800">{montantNet.toLocaleString("fr-MG")}</span>
                          </td>
                          {/* Tranche de paiement */}
                          <td className="px-2 py-2.5 text-center bg-amber-50/40">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] font-medium text-amber-800 leading-tight max-w-[90px] truncate" title={trancheLabel}>
                                {trancheLabel}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  pourcentageTranche >= 100
                                    ? "bg-emerald-100 text-emerald-700"
                                    : pourcentageTranche > 0
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {pourcentageTranche > 0 ? `${pourcentageTranche}%` : "0%"}
                              </span>
                            </div>
                          </td>
                          {/* Avances */}
                          <td className="px-2 py-2.5 text-center bg-amber-50/40">
                            <span className={`text-xs font-mono font-semibold ${totalAvance > 0 ? "text-orange-700" : "text-slate-300"}`}>
                              {totalAvance > 0 ? totalAvance.toLocaleString("fr-MG") : "—"}
                            </span>
                          </td>
                          {/* Montant déjà payé (tranches) */}
                          <td className="px-2 py-2.5 text-center bg-amber-50/40">
                            <span className={`text-xs font-mono font-semibold ${totalPaye > 0 ? "text-blue-700" : "text-slate-300"}`}>
                              {totalPaye > 0 ? totalPaye.toLocaleString("fr-MG") : "—"}
                            </span>
                          </td>
                          {/* Reste à payer */}
                          <td className="px-2 py-2.5 text-center bg-amber-50/40">
                            <span
                              className={`text-xs font-bold ${
                                resteAPayer <= 0 ? "text-emerald-600" : resteAPayer < montantNet ? "text-amber-700" : "text-red-600"
                              }`}
                            >
                              {resteAPayer.toLocaleString("fr-MG")}
                            </span>
                            {resteAPayer <= 0 && montantNet > 0 && (
                              <div className="text-[9px] text-emerald-600 font-medium">Soldé</div>
                            )}
                          </td>
                          <td className="px-1 py-2.5">
                            <div className="flex items-center justify-center gap-0.5">
                              <button onClick={() => handleEditEns(e)} title="Modifier infos base (sans grade/statut)" className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleOpenHeures(e)} title="Gérer les heures (grade/statut historiques)" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition">
                                <BarChart3 size={14} />
                              </button>
                              <button onClick={() => handleOpenPaiement(e)} title="Préparer paiement" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition">
                                <Wallet size={14} />
                              </button>
                              <button onClick={() => handleOpenFiche(e)} title="Fiche individuelle" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition">
                                <FileText size={14} />
                              </button>
                              <button onClick={() => handleDeleteEns(e.id)} title="Supprimer" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
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
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {filtered.length} enseignant(s) – Année {selectedAnnee?.libelle}
                {selectedAnnee?.tranche ? ` – ${selectedAnnee.tranche}` : ""}
              </span>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-semibold">
                <span className="text-orange-700">Avances : {formatAriary(stats.totalAvances)}</span>
                <span className="text-blue-700">Payé : {formatAriary(stats.totalPaye)}</span>
                <span className="text-red-700">Reste à payer : {formatAriary(stats.totalReste)}</span>
                <span className="text-indigo-700">Total Net : {formatAriary(stats.montant)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Grades cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {grades.map((g) => (
            <div key={g.code} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <GradeBadge grade={g.code} />
                <span className="text-[10px] text-slate-400 uppercase">Taux horaire</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{g.libelle}</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-800 mt-1">{g.tauxHoraire.toLocaleString("fr-MG")} Ar/h</p>
            </div>
          ))}
        </div>
      </main>

      {/* ═══════════════════════════════ MODALS ═══════════════════════════════ */}

      {/* Modal Saisir Heures - 2 étapes conforme prompt.md */}
      <Modal isOpen={showAddHeuresModal} onClose={() => setShowAddHeuresModal(false)} title="📋 Saisir des Heures Complémentaires" size="full">
        <div className="space-y-5">
          {/* Étape 1: Recherche/Création enseignant */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-5 border border-indigo-100">
            <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-3">Étape 1: Rechercher / Créer l&apos;enseignant</label>
            <p className="text-xs text-slate-600 mb-3">Saisie assistée (autocomplete) sur la base de tous les enseignants. Le bouton Créer est visible directement.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tapez le nom (ex: RAKOTO)..."
                  value={ensSearchQuery}
                  onChange={(e) => setEnsSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm sm:text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white shadow-sm"
                />
              </div>
              {ensSearchQuery.length >= 2 && !selectedEnsForHeures && (
                <button
                  onClick={handleOpenCreateEnseignant}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md whitespace-nowrap text-sm"
                >
                  <Plus size={18} /> Créer &quot;{ensSearchQuery.toUpperCase()}&quot;
                </button>
              )}
            </div>

            {ensSearchQuery.length >= 2 && !selectedEnsForHeures && (
              <div className="mt-4">
                {ensSearchResults.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                      <p className="text-xs font-medium text-slate-500">{ensSearchResults.length} enseignant(s) trouvé(s)</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {ensSearchResults.map((ens) => (
                        <button
                          key={ens.id}
                          onClick={() => handleSelectEnsForHeures(ens)}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {ens.nom.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 text-sm">{ens.nomPrenom}</span>
                              <p className="text-xs text-slate-500">{ens.etablissementPrincipal || "Non spécifié"}</p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">{ens.cin || ""}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 text-sm">Aucun enseignant trouvé pour &quot;{ensSearchQuery}&quot;</p>
                      <p className="text-xs text-amber-700 mt-1">Cliquez sur le bouton vert pour créer un nouvel enseignant avec le formulaire complet.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {ensSearchQuery.length < 2 && !selectedEnsForHeures && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">?</span>
                Tapez au moins 2 caractères pour rechercher (nom en MAJUSCULES)
              </p>
            )}
          </div>

          {/* Enseignant sélectionné */}
          {selectedEnsForHeures && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-indigo-600" />
                <div>
                  <p className="font-semibold text-indigo-900 text-sm">{selectedEnsForHeures.nomPrenom}</p>
                  <p className="text-xs text-indigo-600">Base: {selectedEnsForHeures.etablissementPrincipal || "—"} • CIN: {selectedEnsForHeures.cin || "—"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEnsForHeures(null)} className="p-1.5 hover:bg-indigo-100 rounded-lg">
                <X size={16} className="text-indigo-600" />
              </button>
            </div>
          )}

          {/* Étape 2: Saisir infos HC avec grade et statut stockés dans heures */}
          {selectedEnsForHeures && (
            <div className="bg-white rounded-xl border-2 border-emerald-100 p-4 sm:p-5 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                Saisir les informations HC (Grade & Statut historiques)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade * (au moment de la saisie)</label>
                  <select
                    value={heuresHCForm.gradeId}
                    onChange={(e) => setHeuresHCForm({ ...heuresHCForm, gradeId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Sélectionner --</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.code} - {g.libelle} ({g.tauxHoraire.toLocaleString()} Ar/h)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut * (au moment)</label>
                  <select
                    value={heuresHCForm.statut}
                    onChange={(e) => handleStatutChange(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Vacataire">Vacataire</option>
                    <option value="Permanent">Permanent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Obligation (défaut 125h, 0 vacataire)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={heuresHCForm.obligation}
                    onChange={(e) => setHeuresHCForm({ ...heuresHCForm, obligation: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Permanent: 125h par défaut. Vacataire: 0h</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Structure académique / parcours *</label>
                <select
                  value={heuresHCForm.parcoursId}
                  onChange={(e) => setHeuresHCForm({ ...heuresHCForm, parcoursId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {facultes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.etablissement} - {f.domaine} - {f.mention} {f.parcours ? `- ${f.parcours}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hiérarchie: Établissement → Domaine → Mention → Parcours</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Heures complémentaires</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <NumInput label="ET" value={heuresHCForm.heuresET} onChange={(v) => setHeuresHCForm({ ...heuresHCForm, heuresET: v })} />
                  <NumInput label="ED" value={heuresHCForm.heuresED} onChange={(v) => setHeuresHCForm({ ...heuresHCForm, heuresED: v })} />
                  <NumInput label="EP" value={heuresHCForm.heuresEP} onChange={(v) => setHeuresHCForm({ ...heuresHCForm, heuresEP: v })} />
                  <NumInput label="Soutenance" value={heuresHCForm.heuresSoutenance} onChange={(v) => setHeuresHCForm({ ...heuresHCForm, heuresSoutenance: v })} />
                  <NumInput label="Recherche" value={heuresHCForm.heuresRecherche} onChange={(v) => setHeuresHCForm({ ...heuresHCForm, heuresRecherche: v })} />
                </div>
              </div>

              {/* Aperçu calcul selon prompt.md */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Aperçu calcul (prompt.md)</p>
                {(() => {
                  const hcBrut = calcHC(heuresHCForm.heuresET, heuresHCForm.heuresED, heuresHCForm.heuresEP, heuresHCForm.heuresSoutenance, heuresHCForm.heuresRecherche, selectedAnnee?.formuleHC || DEFAULT_HC_FORMULA);
                  const { hcNette } = calcHCNette(hcBrut, heuresHCForm.obligation, heuresHCForm.statut);
                  const hcArr = calcHCArrondie(hcNette);
                  const taux = grades.find((g) => String(g.id) === heuresHCForm.gradeId)?.tauxHoraire || 0;
                  const brut = hcArr * taux;
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        HC Brut: <strong>{hcBrut}h</strong>
                      </div>
                      <div>
                        Oblig: <strong>{heuresHCForm.obligation}h</strong>
                      </div>
                      <div>
                        HC Nette: <strong>{hcNette}h</strong> → Arrondie: <strong>{hcArr}h</strong>
                      </div>
                      <div>
                        Brut: <strong>{brut.toLocaleString()} Ar</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAddHeuresForSelected}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-md"
                >
                  <Plus size={16} /> Enregistrer ces heures
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Enseignant Base (sans grade/statut) */}
      <Modal
        isOpen={showEnsModal}
        onClose={() => {
          setShowEnsModal(false);
          setReturnToHeuresAfterCreate(false);
        }}
        title={editEns?.id ? `✏️ Modifier ${editEns.nomPrenom}` : "➕ Nouvel Enseignant (infos permanentes)"}
        size="full"
      >
        <EnseignantForm
          initialData={
            editEns
              ? {
                  nom: editEns.nom,
                  prenom: editEns.prenom || "",
                  cin: editEns.cin || "",
                  telephone: editEns.telephone || "",
                  email: editEns.email || "",
                  rib: editEns.rib || "",
                  etablissementPrincipal: editEns.etablissementPrincipal || "",
                  specialite: editEns.specialite || "",
                  adresse: (editEns as any).adresse || "",
                  nationalite: (editEns as any).nationalite || "Malagasy",
                  dateNaissance: (editEns as any).dateNaissance || "",
                  lieuNaissance: (editEns as any).lieuNaissance || "",
                  dateRecrutement: (editEns as any).dateRecrutement || "",
                  dateCIN: (editEns as any).dateCIN || "",
                }
              : undefined
          }
          etablissements={Array.from(new Set(facultes.map((f) => f.etablissement).filter(Boolean))).sort()}
          onSave={handleSaveEns}
          onCancel={() => {
            setShowEnsModal(false);
            setReturnToHeuresAfterCreate(false);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* Modal Tous Enseignants */}
      <Modal isOpen={showAllEnsModal} onClose={() => setShowAllEnsModal(false)} title="👥 Base Enseignants - Tous les enseignants" size="full">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <p className="text-xs text-slate-600">
              Liste complète de TOUS les enseignants de la base (indépendante de l&apos;année). Utile pour mettre à jour les infos (contact, RIB, etc.)
            </p>
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={allEnsSearch}
                onChange={(e) => setAllEnsSearch(e.target.value)}
                placeholder="Rechercher par nom/prénom..."
                className="pl-9 pr-3 py-2 w-full text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Nom", "Prénom", "CIN", "Tél", "Email", "Établissement", "RIB", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllEns.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold">{e.nom}</td>
                    <td className="px-3 py-2">{e.prenom || "—"}</td>
                    <td className="px-3 py-2 text-xs">{e.cin || "—"}</td>
                    <td className={`px-3 py-2 text-xs ${e.telephone && e.telephone.replace(/\D/g, "").length !== 10 ? "text-orange-600 font-semibold" : ""}`} title={e.telephone && e.telephone.replace(/\D/g, "").length !== 10 ? "Téléphone incohérent" : ""}>{e.telephone || "—"}</td>
                    <td className="px-3 py-2 text-xs max-w-[150px] truncate">{e.email || "—"}</td>
                    <td className="px-3 py-2 text-xs max-w-[120px] truncate">{e.etablissementPrincipal || "—"}</td>
                    <td className={`px-3 py-2 text-xs max-w-[150px] truncate ${e.rib && e.rib.replace(/\D/g, "").length !== 23 ? "text-orange-600 font-semibold" : ""}`} title={e.rib && e.rib.replace(/\D/g, "").length !== 23 ? "RIB incohérent" : e.rib || ""}>{e.rib || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEditEns(e)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteEns(e.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAllEns.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">Aucun enseignant</p>}
          </div>
          <div className="text-xs text-slate-500">{filteredAllEns.length} enseignant(s) au total</div>
        </div>
      </Modal>

      {/* Modal Heures existantes - gère grade/statut/obligation historiques */}
      <Modal
        isOpen={showHeuresModal}
        onClose={() => {
          setShowHeuresModal(false);
          loadEnseignants();
          setEditingHeureId(null);
        }}
        title={`📋 Heures ${selectedAnnee?.libelle || ""} – ${selectedEns?.nomPrenom || ""}`}
        size="2xl"
      >
        <div className="space-y-4">
          {/* Formulaire ajout / édition */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="font-semibold text-slate-700 text-sm">
              {editingHeureId ? "✏️ Modifier cette ligne d'heures (grade/statut historiques)" : "➕ Ajouter des heures (avec grade & statut)"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Grade *</label>
                <select
                  value={heuresForm.gradeId}
                  onChange={(e) => setHeuresForm({ ...heuresForm, gradeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code} - {g.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
                <select
                  value={heuresForm.statut}
                  onChange={(e) =>
                    setHeuresForm({
                      ...heuresForm,
                      statut: e.target.value as any,
                      obligation: e.target.value === "Vacataire" ? 0 : heuresForm.obligation === 0 ? 125 : heuresForm.obligation,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Vacataire">Vacataire</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Obligation (h)</label>
                <input
                  type="number"
                  value={heuresForm.obligation}
                  onChange={(e) => setHeuresForm({ ...heuresForm, obligation: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Parcours (Établissement → Domaine → Mention → Parcours) *</label>
                <select
                  value={heuresForm.parcoursId}
                  onChange={(e) => setHeuresForm({ ...heuresForm, parcoursId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {facultes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.etablissement} | {f.domaine} | {f.mention} {f.parcours ? `| ${f.parcours}` : ""}
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
            <div className="flex gap-2">
              <button
                onClick={handleSaveHeureEdit}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Plus size={16} /> {editingHeureId ? "Mettre à jour" : "Ajouter ces heures"}
              </button>
              {editingHeureId && (
                <button
                  onClick={() => {
                    setEditingHeureId(null);
                    setHeuresForm({
                      parcoursId: "",
                      gradeId: grades[0]?.id ? String(grades[0].id) : "",
                      statut: "Vacataire",
                      heuresET: 0,
                      heuresED: 0,
                      heuresEP: 0,
                      heuresSoutenance: 0,
                      heuresRecherche: 0,
                      obligation: 0,
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                >
                  Annuler édition
                </button>
              )}
            </div>
          </div>

          {/* Liste des heures */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Grade", "Statut", "Structure", "ET", "ED", "EP", "Sout", "Rech", "Total", "Oblig", ""].map((h) => (
                    <th key={h} className="px-2 py-2 text-center text-[11px] font-semibold text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heuresList.map((h) => {
                  const total = (h.heuresET || 0) + (h.heuresED || 0) + (h.heuresEP || 0) + (h.heuresSoutenance || 0) + (h.heuresRecherche || 0);
                  return (
                    <tr key={h.id} className={`hover:bg-indigo-50/50 ${editingHeureId === h.id ? "bg-yellow-50" : ""}`}>
                      <td className="px-2 py-2 text-center">
                        <GradeBadge grade={h.grade?.code || "-"} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <StatutBadge statut={h.statut} />
                      </td>
                      <td className="px-2 py-2 text-[11px] max-w-[150px] truncate">
                        {h.structure ? `${h.structure.etablissement} - ${h.structure.mention}` : "—"}
                      </td>
                      <td className="px-1 py-2 text-center font-mono">{h.heuresET || "-"}</td>
                      <td className="px-1 py-2 text-center font-mono">{h.heuresED || "-"}</td>
                      <td className="px-1 py-2 text-center font-mono">{h.heuresEP || "-"}</td>
                      <td className="px-1 py-2 text-center font-mono">{h.heuresSoutenance || "-"}</td>
                      <td className="px-1 py-2 text-center font-mono">{h.heuresRecherche || "-"}</td>
                      <td className="px-1 py-2 text-center font-bold text-indigo-700">{total}</td>
                      <td className="px-1 py-2 text-center text-orange-600">{h.obligation}</td>
                      <td className="px-1 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleEditHeure(h)} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => handleDeleteHeures(h.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {heuresList.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-6 text-slate-400 text-xs">
                      Aucune heure saisie pour cette année
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {heuresList.length > 0 && (
            <div className="bg-indigo-50 rounded-lg p-3 text-xs">
              <p>
                <strong>Totaux:</strong> ET {heuresList.reduce((s, h) => s + (h.heuresET || 0), 0)}h • ED{" "}
                {heuresList.reduce((s, h) => s + (h.heuresED || 0), 0)}h • EP {heuresList.reduce((s, h) => s + (h.heuresEP || 0), 0)}h • Sout{" "}
                {heuresList.reduce((s, h) => s + (h.heuresSoutenance || 0), 0)}h • Rech {heuresList.reduce((s, h) => s + (h.heuresRecherche || 0), 0)}h • Total Brut{" "}
                {heuresList.reduce((s, h) => s + (h.heuresET || 0) + (h.heuresED || 0) + (h.heuresEP || 0) + (h.heuresSoutenance || 0) + (h.heuresRecherche || 0), 0)}h
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Paiement */}
      <Modal isOpen={showPaiementModal} onClose={() => setShowPaiementModal(false)} title="💰 Préparation du Paiement" size="lg">
        {selectedEns && paiementPreview && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-semibold text-sm">{selectedEns.nomPrenom}</p>
              <p className="text-xs text-slate-500">
                {selectedEns.gradeCode} • {selectedEns.statut} • {selectedEns.etablissementPrincipal || selectedEns.structureEtablissement}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                HC: {paiementPreview.hcBrut}h brut → Oblig {paiementPreview.obligation}h → Nette {paiementPreview.hcNette}h → Arrondie{" "}
                <strong>{paiementPreview.hcArr}h</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${selectedAnnee?.appliquerIRSA ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                <p className="text-xs font-medium text-slate-600">IRSA</p>
                <p className={`font-bold text-sm ${selectedAnnee?.appliquerIRSA ? "text-red-700" : "text-green-700"}`}>
                  {selectedAnnee?.appliquerIRSA ? `Appliqué (${selectedAnnee.tauxIRSA}%) = -${paiementPreview.irsa.toLocaleString()} Ar` : "Non appliqué"}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200">
                <p className="text-xs font-medium text-slate-600">Tranche / Année</p>
                <p className="font-bold text-indigo-700 text-sm">
                  {selectedAnnee?.tranche} – {selectedAnnee?.libelle}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2">Montant Brut (HC arrondie × Taux)</td>
                    <td className="px-3 py-2 text-right font-bold">{paiementPreview.montantBrut.toLocaleString()} Ar</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Montant Net (Brut - IRSA)</td>
                    <td className="px-3 py-2 text-right">{paiementPreview.montantNet.toLocaleString()} Ar</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Tranche en cours</td>
                    <td className="px-3 py-2 text-right font-medium text-amber-800">
                      {selectedAnnee?.tranche || "—"} ({paiementPreview.pourcentageTranche || 0}% déjà versé)
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Avances déjà déduites</td>
                    <td className="px-3 py-2 text-right text-orange-700">-{(selectedEns.total_avance || 0).toLocaleString()} Ar</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2">Déjà payé (tranches)</td>
                    <td className="px-3 py-2 text-right text-blue-700">-{(selectedEns.total_paye || 0).toLocaleString()} Ar</td>
                  </tr>
                  <tr className="bg-red-50 font-bold">
                    <td className="px-3 py-2">Reste à payer actuel</td>
                    <td className="px-3 py-2 text-right text-red-700">{paiementPreview.resteActuel.toLocaleString()} Ar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">% Tranche</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={paiementForm.pourcentageTranche}
                  onChange={(e) => setPaiementForm({ ...paiementForm, pourcentageTranche: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Avance à déduire</label>
                <input
                  type="number"
                  min={0}
                  value={paiementForm.montantAvance}
                  onChange={(e) => setPaiementForm({ ...paiementForm, montantAvance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date paiement</label>
                <input
                  type="date"
                  value={paiementForm.datePaiement}
                  onChange={(e) => setPaiementForm({ ...paiementForm, datePaiement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Référence</label>
                <input
                  type="text"
                  value={paiementForm.reference}
                  onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: PAY-2024-001"
                />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <p className="text-xs text-emerald-700 mb-1">Montant de cette tranche ({paiementForm.pourcentageTranche}%)</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{paiementPreview.montantPaye.toLocaleString("fr-MG")} Ar</p>
              {paiementPreview.resteApres > 0 ? (
                <p className="text-xs text-slate-500 mt-1">Reste après ce paiement : {paiementPreview.resteApres.toLocaleString()} Ar</p>
              ) : (
                <p className="text-xs text-emerald-600 font-medium mt-1">Soldé après ce paiement</p>
              )}
            </div>

            <div className="flex justify-end gap-2 sm:gap-3">
              <button onClick={() => setShowPaiementModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleSavePaiement} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                <CreditCard size={16} /> Enregistrer paiement
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Fiche */}
      <Modal isOpen={showFicheModal} onClose={() => setShowFicheModal(false)} title="📄 Fiche Individuelle de Paiement" size="full">
        {ficheData && <FicheIndividuelle data={ficheData as any} />}
      </Modal>

      {/* Modal Structure académique - quatre bases liées */}
      <Modal isOpen={showFacModal} onClose={() => setShowFacModal(false)} title="🏛️ Gestion de la structure académique" size="2xl">
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs">
            <p className="font-semibold">Données séparées et liées:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-700">
              <li>
                Champs obligatoires: <strong>Établissement, Domaine, Mention</strong>
              </li>
              <li>Parcours et Code sont optionnels</li>
              <li>Les quatre bases sont séparées : établissements, domaines, mentions et parcours</li>
              <li>Vérification des doublons avant insertion</li>
              <li>Saisie assistée (autocomplete) pour tous les champs</li>
              <li>Hiérarchie: Établissement → Domaine → Mention → Parcours</li>
            </ul>
          </div>

          <form onSubmit={handleSaveFac} className="bg-slate-50 rounded-lg p-4 space-y-3 border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Établissement *</label>
                <input
                  value={facForm.etablissement}
                  onChange={(e) => handleFacFieldChange("etablissement", e.target.value)}
                  list="etablissement-list"
                  required
                  placeholder="Ex: Université de Toliara"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
                <datalist id="etablissement-list">
                  {facSuggestions.etablissement?.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Domaine *</label>
                <input
                  value={facForm.domaine}
                  onChange={(e) => handleFacFieldChange("domaine", e.target.value)}
                  list="domaine-list"
                  required
                  placeholder="Ex: Sciences et Technologies"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
                <datalist id="domaine-list">
                  {facSuggestions.domaine?.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mention *</label>
                <input
                  value={facForm.mention}
                  onChange={(e) => handleFacFieldChange("mention", e.target.value)}
                  list="mention-list"
                  required
                  placeholder="Ex: Informatique"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
                <datalist id="mention-list">
                  {facSuggestions.mention?.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Parcours (optionnel)</label>
                <input
                  value={facForm.parcours}
                  onChange={(e) => handleFacFieldChange("parcours", e.target.value)}
                  list="parcours-list"
                  placeholder="Ex: Génie Logiciel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
                <datalist id="parcours-list">
                  {facSuggestions.parcours?.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Code (optionnel)</label>
                <input
                  value={facForm.code}
                  onChange={(e) => setFacForm({ ...facForm, code: e.target.value })}
                  placeholder="Ex: UT-ST-INFO-GL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>
            </div>
            {facError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{facError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                <Plus size={16} /> {editingFacId ? "Mettre à jour" : "Ajouter la structure"}
              </button>
              {editingFacId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFacId(null);
                    setFacForm({ etablissement: "", domaine: "", mention: "", parcours: "", code: "" });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-white"
                >
                  Annuler édition
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto max-h-[300px] border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {["Établissement", "Domaine", "Mention", "Parcours", "Code", ""].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultes.map((f) => (
                  <tr key={f.id} onClick={() => handleEditFac(f)} className={`hover:bg-purple-50 cursor-pointer ${editingFacId === f.id ? "bg-yellow-50" : ""}`}>
                    <td className="px-2 py-2 font-medium truncate max-w-[150px]">{f.etablissement}</td>
                    <td className="px-2 py-2 truncate max-w-[120px]">{f.domaine}</td>
                    <td className="px-2 py-2 truncate max-w-[120px]">{f.mention}</td>
                    <td className="px-2 py-2">{f.parcours || "—"}</td>
                    <td className="px-2 py-2 text-[10px] font-mono">{f.code || "—"}</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={(ev) => { ev.stopPropagation(); handleDeleteFac(f.id); }} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Supprimer">
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

      {/* Modal Années */}
      <Modal isOpen={showAnneeModal} onClose={() => setShowAnneeModal(false)} title="📅 Gestion Années Universitaires (IRSA par année)" size="2xl">
        <div className="space-y-5">
          <form onSubmit={handleSaveAnnee} className="bg-slate-50 rounded-lg p-4 space-y-3 border">
            <h4 className="font-semibold text-slate-700 text-sm">Nouvelle année universitaire</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Libellé * (ex: 2024-2025)</label>
                <input
                  value={anneeForm.libelle}
                  onChange={(e) => setAnneeForm({ ...anneeForm, libelle: e.target.value })}
                  required
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tranche</label>
                <select
                  value={anneeForm.tranche}
                  onChange={(e) => setAnneeForm({ ...anneeForm, tranche: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option>Première tranche</option>
                  <option>Deuxième tranche</option>
                  <option>Troisième tranche</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={anneeForm.appliquerIRSA}
                    onChange={(e) => setAnneeForm({ ...anneeForm, appliquerIRSA: e.target.checked })}
                    className="rounded"
                  />
                  Appliquer IRSA
                </label>
                {anneeForm.appliquerIRSA && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Taux IRSA:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={anneeForm.tauxIRSA}
                      onChange={(e) => setAnneeForm({ ...anneeForm, tauxIRSA: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                    <span className="text-xs text-slate-600">%</span>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={anneeForm.active} onChange={(e) => setAnneeForm({ ...anneeForm, active: e.target.checked })} className="rounded" />
                  Active
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Plafond paiement (Ar) optionnel</label>
                <input
                  value={anneeForm.plafondPaiement}
                  onChange={(e) => setAnneeForm({ ...anneeForm, plafondPaiement: e.target.value })}
                  placeholder="Ex: 5000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Formule HC Brut modifiable</label>
                <input
                  value={anneeForm.formuleHC}
                  onChange={(e) => setAnneeForm({ ...anneeForm, formuleHC: e.target.value })}
                  placeholder={DEFAULT_HC_FORMULA}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Variables autorisées : ET, ED, EP, soutenance, recherche. Défaut : {DEFAULT_HC_FORMULA}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                <Plus size={16} /> {editingAnneeId ? "Mettre à jour" : "Ajouter année"}
              </button>
              {editingAnneeId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnneeId(null);
                    setAnneeForm({ libelle: "", tranche: "Première tranche", active: false, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: "", formuleHC: DEFAULT_HC_FORMULA });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-white"
                >
                  Annuler édition
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Année", "Tranche", "Formule HC", "IRSA", "Taux", "Plafond", "Active"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {annees.map((a) => (
                  <tr key={a.id} onClick={() => handleEditAnnee(a)} className={`hover:bg-indigo-50 cursor-pointer ${a.active ? "bg-green-50" : ""} ${editingAnneeId === a.id ? "outline outline-2 outline-indigo-300" : ""}`}>
                    <td className="px-3 py-2 font-medium">{a.libelle}</td>
                    <td className="px-3 py-2 text-xs">{a.tranche}</td>
                    <td className="px-3 py-2 text-[10px] font-mono max-w-[180px] truncate" title={a.formuleHC || DEFAULT_HC_FORMULA}>{a.formuleHC || DEFAULT_HC_FORMULA}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); handleUpdateAnnee(a, "appliquerIRSA", !a.appliquerIRSA); }}
                        className={`px-2 py-1 rounded text-xs font-medium ${a.appliquerIRSA ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                      >
                        {a.appliquerIRSA ? "Oui" : "Non"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{a.appliquerIRSA ? `${a.tauxIRSA}%` : "—"}</td>
                    <td className="px-3 py-2 text-right text-xs font-mono">{a.plafondPaiement ? Number(a.plafondPaiement).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); handleUpdateAnnee(a, "active", !a.active); }}
                        className={`px-2 py-1 rounded text-xs font-medium ${a.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {a.active ? "✓ Active" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            Selon prompt.md: IRSA est configurable par année (activable/désactivable), la dernière année est sélectionnée par défaut au lancement, et un plafond étatique optionnel
            peut être défini.
          </p>
        </div>
      </Modal>

      {/* Modal Grades */}
      <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)} title="🎓 Grades et Taux Horaires" size="lg">
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
            <p className="font-semibold">Taux par défaut (prompt.md):</p>
            <ul className="list-disc list-inside mt-1">
              <li>A Assistant: 6 000 Ar/h</li>
              <li>MC Maître de Conférences: 8 000 Ar/h</li>
              <li>PR Professeur: 10 000 Ar/h</li>
              <li>PRT Professeur Titulaire: 12 000 Ar/h</li>
            </ul>
          </div>
          {grades.map((g) => (
            <div key={g.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border">
              <GradeBadge grade={g.code} />
              <div className="flex-1">
                <p className="text-sm font-medium">{g.libelle}</p>
                <p className="text-xs text-slate-500">{g.code}</p>
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
                        body: JSON.stringify({ id: g.id, tauxHoraire: newVal }),
                      }).then(() => loadGrades().then(() => loadEnseignants()));
                    }
                  }}
                  className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm text-right bg-white"
                />
                <span className="text-xs text-slate-500">Ar/h</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Etat Fiche Individuelle */}
      <Modal isOpen={showEtatFicheModal} onClose={() => setShowEtatFicheModal(false)} title="📄 Générer la Fiche Individuelle" size="md">
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs">
            <p className="font-semibold text-indigo-900">{targetEnsForFiche?.nomPrenom}</p>
            <p className="text-indigo-700 mt-0.5">Veuillez renseigner l&apos;état à faire pour cette fiche individuelle :</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">N° de l&apos;état *</label>
            <input
              type="text"
              value={etatFicheForm.numeroEtat}
              onChange={(e) => setEtatFicheForm({ ...etatFicheForm, numeroEtat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: 0001"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tranche / Période</label>
            <input
              type="text"
              value={etatFicheForm.tranche}
              onChange={(e) => setEtatFicheForm({ ...etatFicheForm, tranche: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Première tranche"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowEtatFicheModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={handleConfirmFiche} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
              <FileText size={16} /> Générer l&apos;état
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Paiement Manager (Choix : afficher paiements faits ou nouveau paiement masse) */}
      <Modal isOpen={showPaiementManagerModal} onClose={() => setShowPaiementManagerModal(false)} title="💳 Gestion des Paiements" size="xl">
        <div className="space-y-4">
          {paiementManagerTab === "choice" && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-700 font-medium text-center">Que souhaitez-vous faire pour les paiements de l&apos;année {selectedAnnee?.libelle} ?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/paiements?anneeId=${selectedAnnee?.id}`);
                    const data = await res.json();
                    setAllPaiements(Array.isArray(data) ? data : []);
                    setPaiementManagerTab("list");
                  }}
                  className="p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition text-left flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="font-bold text-indigo-900 text-base mb-1">Afficher les paiements déjà faits</h3>
                    <p className="text-xs text-indigo-700">Consulter l&apos;historique de tous les paiements enregistrés dans la base de données.</p>
                  </div>
                  <span className="mt-4 text-xs font-semibold text-indigo-600 flex items-center gap-1">Voir la liste →</span>
                </button>

                <button
                  onClick={() => setPaiementManagerTab("batch")}
                  className="p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition text-left flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <Printer size={20} />
                    </div>
                    <h3 className="font-bold text-emerald-900 text-base mb-1">Faire un nouveau paiement (Imprimer tous les états)</h3>
                    <p className="text-xs text-emerald-700">Enregistrer les paiements pour tous les enseignants filtrés et imprimer tous les états en une seule fois.</p>
                  </div>
                  <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">Commencer →</span>
                </button>
              </div>
            </div>
          )}

          {paiementManagerTab === "list" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button onClick={() => setPaiementManagerTab("choice")} className="text-xs text-indigo-600 hover:underline font-medium">
                  ← Retour au choix
                </button>
                <p className="text-xs font-semibold text-slate-700">Paiements enregistrés ({allPaiements.length})</p>
              </div>
              <div className="overflow-x-auto max-h-[350px] border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {["Enseignant", "Montant Payé", "Avance", "% Tranche", "Date", "Référence", "Statut", "Action"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPaiements.map((p) => {
                      const ens = allEnseignants.find((e) => e.id === p.enseignantId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium">{ens?.nomPrenom || `ID #${p.enseignantId}`}</td>
                          <td className="px-3 py-2 font-bold text-emerald-700">{p.montantPaye?.toLocaleString()} Ar</td>
                          <td className="px-3 py-2">{p.montantAvance?.toLocaleString()} Ar</td>
                          <td className="px-3 py-2">{p.pourcentageTranche}%</td>
                          <td className="px-3 py-2">{p.datePaiement || "—"}</td>
                          <td className="px-3 py-2 font-mono text-[11px]">{p.reference || "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.statut === "Payé" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {p.statut}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={async () => {
                                if (!confirm("Supprimer ce paiement ?")) return;
                                await fetch(`/api/paiements?id=${p.id}`, { method: "DELETE" });
                                const res = await fetch(`/api/paiements?anneeId=${selectedAnnee?.id}`);
                                const data = await res.json();
                                setAllPaiements(Array.isArray(data) ? data : []);
                                await loadEnseignants();
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {allPaiements.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          Aucun paiement enregistré dans la base de données pour cette année.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {paiementManagerTab === "batch" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setPaiementManagerTab("choice")} className="text-xs text-indigo-600 hover:underline font-medium">
                  ← Retour au choix
                </button>
                <p className="text-xs font-semibold text-slate-700">Nouveau paiement en masse ({filtered.length} enseignant(s) sélectionné(s))</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                <p className="font-semibold">Paiement et impression groupée :</p>
                <p className="mt-0.5">Tous les paiements seront enregistrés dans la base de données, et tous les états (fiches individuelles) seront générés et imprimés en une seule fois.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">% de la tranche</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={batchPaiementForm.pourcentageTranche}
                    onChange={(e) => setBatchPaiementForm({ ...batchPaiementForm, pourcentageTranche: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Avance à déduire (global)</label>
                  <input
                    type="number"
                    min={0}
                    value={batchPaiementForm.montantAvance}
                    onChange={(e) => setBatchPaiementForm({ ...batchPaiementForm, montantAvance: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date de paiement</label>
                  <input
                    type="date"
                    value={batchPaiementForm.datePaiement}
                    onChange={(e) => setBatchPaiementForm({ ...batchPaiementForm, datePaiement: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Référence / Bordereau</label>
                  <input
                    type="text"
                    value={batchPaiementForm.reference}
                    onChange={(e) => setBatchPaiementForm({ ...batchPaiementForm, reference: e.target.value })}
                    placeholder="Ex: BORD-2024-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowPaiementManagerModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                  Annuler
                </button>
                <button
                  onClick={handleBatchPaymentAndPrint}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-md disabled:opacity-50"
                >
                  <Printer size={16} /> Enregistrer & Imprimer tous les états ({filtered.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Batch Print - Imprimer tous les états en une seule fois */}
      <Modal isOpen={showBatchPrintModal} onClose={() => setShowBatchPrintModal(false)} title="🖨️ Impression Groupée – Tous les États de Paiement" size="full">
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg no-print shadow-sm">
            <p className="text-sm font-semibold text-indigo-900">
              {batchFichesData.length} état(s) de paiement enregistré(s) dans la base de données et prêts pour l&apos;impression groupée.
            </p>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-700 text-white rounded-lg text-sm font-bold hover:bg-indigo-800 shadow">
              <Printer size={16} /> Imprimer tous les états en une seule fois
            </button>
          </div>

          <div className="space-y-12">
            {batchFichesData.map((fiche, idx) => (
              <div key={idx} className="page-break-after pb-8 border-b-2 border-dashed border-slate-300">
                <FicheIndividuelle data={fiche} />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Petits composants ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    rose: "from-rose-500 to-rose-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{label}</span>
          <span className={`p-2 rounded-lg bg-gradient-to-br ${colors[color]} text-white`}>{icon}</span>
        </div>
        <div className="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5 truncate">{value}</div>
        <div className="text-[10px] sm:text-xs text-slate-400 truncate">{sub}</div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${colors[color]}`} />
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
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
      />
    </div>
  );
}

function FicheIndividuelle({ data }: { data: any }) {
  const d = data as {
    numeroEtat: string;
    annee: string;
    tranche: string;
    enseignant: { nom: string; prenom: string | null; nomPrenom: string; cin: string | null; statut: string; telephone: string | null; email: string | null; rib: string | null; etablissementPrincipal: string | null; specialite: string | null };
    grade: { code: string; libelle: string; taux: number } | null;
    statut: string;
    detailsParFaculte: Record<string, { etablissement: string; domaine: string; mention: string; parcours: string; et: number; ed: number; ep: number; sout: number; rech: number }[]>;
    totaux: {
      et: number;
      ed: number;
      ep: number;
      soutenance: number;
      recherche: number;
      hcBrut: number;
      obligation: number;
      obligationSaisie: number;
      exempte: boolean;
      hcNette: number;
      hcArrondi: number;
    };
    calculs: {
      taux: number;
      montantBrut: number;
      plafondApplique: number | null;
      appliquerIRSA: boolean;
      tauxIRSA: number;
      montantIRSA: number;
      montantNet: number;
      totalAvance: number;
      netAPayer: number;
      netEnLettres: string;
    };
  };

  return (
    <div className="print:text-black">
      <div className="flex justify-end gap-3 mb-4 no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800">
          🖨️ Imprimer / PDF
        </button>
        <button
          onClick={async () => {
            const res = await fetch(`/api/export/excel?anneeId=&`);
            // no-op
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 space-y-4 text-sm max-w-4xl mx-auto">
        <div className="text-center border-b border-slate-300 pb-4">
          <h2 className="text-lg font-bold uppercase">Fiche Individuelle de Paiement</h2>
          <h3 className="text-base font-semibold text-slate-700">Heures Complémentaires</h3>
          <p className="text-sm text-slate-600">
            Année Universitaire: <strong>{d.annee}</strong> — {d.tranche}
          </p>
          <p className="text-xs text-slate-500">État N° {d.numeroEtat} – Grade & Statut historiques (table heures)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Nom et Prénoms:</span> <strong>{d.enseignant.nomPrenom}</strong>
            <span className="ml-2 text-xs text-slate-400">
              (Nom: {d.enseignant.nom} – Prénom: {d.enseignant.prenom || "—"})
            </span>
          </div>
          <div>
            <span className="text-slate-500">CIN:</span> {d.enseignant.cin || "—"}
          </div>
          <div>
            <span className="text-slate-500">Grade (historique HC):</span> <strong>{d.grade?.code}</strong> ({d.grade?.libelle}) – {d.calculs.taux.toLocaleString()} Ar/h
          </div>
          <div>
            <span className="text-slate-500">Statut (historique HC):</span> {d.statut}
          </div>
          <div>
            <span className="text-slate-500">Établissement:</span> {d.enseignant.etablissementPrincipal || "—"}
          </div>
          <div>
            <span className="text-slate-500">RIB:</span> {d.enseignant.rib || "—"}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold border-b pb-1">Détail des heures par établissement (avec Domaine/Mention)</h4>
          {Object.entries(d.detailsParFaculte).map(([etab, rows]) => (
            <div key={etab} className="mb-3">
              <p className="font-medium text-slate-700 text-sm">{etab}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 mt-1">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-1 border text-left">Domaine / Mention / Parcours</th>
                      <th className="px-2 py-1 border text-center">ET</th>
                      <th className="px-2 py-1 border text-center">ED</th>
                      <th className="px-2 py-1 border text-center">EP</th>
                      <th className="px-2 py-1 border text-center">Sout.</th>
                      <th className="px-2 py-1 border text-center">Rech.</th>
                      <th className="px-2 py-1 border text-center font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any, i: number) => {
                      const tot = r.et + r.ed + r.ep + r.sout + r.rech;
                      return (
                        <tr key={i}>
                          <td className="px-2 py-1 border text-[11px]">
                            {r.domaine && <span className="text-slate-500">{r.domaine} / </span>}
                            {r.mention} {r.parcours ? `- ${r.parcours}` : ""}
                          </td>
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
            </div>
          ))}
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2">Total HC Brut (ET+ED+EP+Sout+Rech)</td>
                <td className="px-3 py-2 text-right font-bold">{d.totaux.hcBrut.toFixed(2)} h</td>
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2">Obligation saisie (défaut 125h, 0 vacataire)</td>
                <td className="px-3 py-2 text-right">{d.totaux.exempte || d.totaux.obligation === 0 ? "0h (Vacataire/Exempté)" : `${d.totaux.obligation} h`}</td>
              </tr>
              <tr className="border-b bg-blue-50">
                <td className="px-3 py-2 font-bold">HC Nette (max(0, Brut - Oblig) si Permanent)</td>
                <td className="px-3 py-2 text-right font-bold text-blue-700">
                  {d.totaux.hcNette.toFixed(2)} h → Arrondie {d.totaux.hcArrondi} h
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2">Taux horaire ({d.grade?.code})</td>
                <td className="px-3 py-2 text-right">{d.calculs.taux.toLocaleString("fr-MG")} Ar</td>
              </tr>
              <tr className="border-b bg-amber-50">
                <td className="px-3 py-2 font-bold">Montant Brut (HC arrondie × Taux, plafond si défini)</td>
                <td className="px-3 py-2 text-right font-bold text-amber-700">{d.calculs.montantBrut.toLocaleString("fr-MG")} Ar</td>
              </tr>
              {d.calculs.plafondApplique && (
                <tr className="border-b">
                  <td className="px-3 py-2 text-orange-600">Plafond étatique appliqué</td>
                  <td className="px-3 py-2 text-right text-orange-600">{d.calculs.plafondApplique.toLocaleString("fr-MG")} Ar</td>
                </tr>
              )}
              {d.calculs.appliquerIRSA ? (
                <tr className="border-b">
                  <td className="px-3 py-2 text-red-600">IRSA ({d.calculs.tauxIRSA}%) = Brut × tauxIRSA/100</td>
                  <td className="px-3 py-2 text-right text-red-600">-{d.calculs.montantIRSA.toLocaleString("fr-MG")} Ar</td>
                </tr>
              ) : (
                <tr className="border-b">
                  <td className="px-3 py-2 text-green-600">IRSA (désactivé pour cette année)</td>
                  <td className="px-3 py-2 text-right text-green-600">0 Ar</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="px-3 py-2">Montant Net (Brut - IRSA)</td>
                <td className="px-3 py-2 text-right">{d.calculs.montantNet.toLocaleString("fr-MG")} Ar</td>
              </tr>
              {d.calculs.totalAvance > 0 && (
                <tr className="border-b">
                  <td className="px-3 py-2">Avance déduite</td>
                  <td className="px-3 py-2 text-right">-{d.calculs.totalAvance.toLocaleString("fr-MG")} Ar</td>
                </tr>
              )}
              <tr className="bg-emerald-50">
                <td className="px-3 py-2 font-bold text-base">NET À PAYER (Net - Avances)</td>
                <td className="px-3 py-2 text-right font-bold text-base text-emerald-700">{d.calculs.netAPayer.toLocaleString("fr-MG")} Ar</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500">Montant net en toutes lettres:</p>
          <p className="font-bold italic text-sm">{d.calculs.netEnLettres}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8 pt-4">
          <div className="text-center">
            <p className="font-semibold mb-16 text-xs">L&apos;intéressé(e) - Signature, N° CIN + date/lieu délivrance</p>
            <div className="border-t border-slate-400 pt-1 text-xs">Signature</div>
          </div>
          <div className="text-center">
            <p className="font-semibold mb-16 text-xs">Le Responsable - Cachet</p>
            <div className="border-t border-slate-400 pt-1 text-xs">Signature et cachet</div>
          </div>
        </div>
      </div>
    </div>
  );
}
