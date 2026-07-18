"use client";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  Building2,
  CreditCard,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Settings,
  UserCheck,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalEnseignants: 0,
    totalHeures: 0,
    totalPaiements: 0,
    totalMontant: 0,
    permanents: 0,
    vacataires: 0,
    structuresCount: 0,
    usersCount: 0,
    anneesActives: 0,
  });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("hc_user");
    if (stored) setUser(JSON.parse(stored));
    const cfg = sessionStorage.getItem("hc_config");
    if (cfg) {
      try { setConfig(JSON.parse(cfg)); } catch {}
    }

    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [ensRes, heuresRes, paiementsRes, structRes, usersRes, anneesRes] =
        await Promise.all([
          fetch("/api/enseignants"),
          fetch("/api/heures"),
          fetch("/api/paiements"),
          fetch("/api/structures"),
          fetch("/api/utilisateurs"),
          fetch("/api/annees"),
        ]);

      const enseignants = (await ensRes.json()) || [];
      const heures = (await heuresRes.json()) || [];
      const paiements = (await paiementsRes.json()) || [];
      const structures = (await structRes.json()) || [];
      const utilisateurs = (await usersRes.json()) || [];
      const annees = (await anneesRes.json()) || [];

      // Calculs
      const permanents = heures.filter((h: any) => h.statut === "Permanent").length;
      const vacataires = heures.filter((h: any) => h.statut === "Vacataire").length;
      const totalHeures = heures.reduce(
        (sum: number, h: any) =>
          sum +
          (h.heuresET || 0) +
          (h.heuresED || 0) +
          (h.heuresEP || 0) +
          (h.heuresSoutenance || 0) +
          (h.heuresRecherche || 0),
        0
      );
      const totalMontant = paiements.reduce(
        (sum: number, p: any) => sum + (p.montantPaye || 0),
        0
      );
      const anneesActives = annees.filter((a: any) => a.active).length;

      setStats({
        totalEnseignants: enseignants.length,
        totalHeures,
        totalPaiements: paiements.length,
        totalMontant,
        permanents,
        vacataires,
        structuresCount: structures.length,
        usersCount: utilisateurs.length,
        anneesActives,
      });
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    }
    setLoading(false);
  };

  const cards = [
    {
      label: "Enseignants",
      value: stats.totalEnseignants,
      sub: `${stats.permanents} perm. • ${stats.vacataires} vac.`,
      icon: <Users size={20} />,
      color: "from-indigo-500 to-blue-600",
      bg: "bg-indigo-50",
      textColor: "text-indigo-700",
    },
    {
      label: "Heures totales",
      value: stats.totalHeures.toFixed(0) + "h",
      sub: "Toutes catégories",
      icon: <Clock size={20} />,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: "Paiements",
      value: stats.totalPaiements,
      sub: `${stats.totalMontant.toLocaleString("fr-MG")} Ar`,
      icon: <CreditCard size={20} />,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      label: "Structures",
      value: stats.structuresCount,
      sub: `${stats.anneesActives} année(s) active(s)`,
      icon: <Building2 size={20} />,
      color: "from-purple-500 to-pink-600",
      bg: "bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <GraduationCap size={28} className="text-indigo-600" />
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenue, {user?.prenom} {user?.nom} — {config?.nomEtablissement || "HC-Manager"}
          </p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <span className={card.textColor}>{card.icon}</span>
                  </div>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
                <div className="text-xs text-slate-500">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Section infos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raccourcis rapides */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                Actions rapides
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Voir l'application", href: "/", icon: <GraduationCap size={16} />, color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                  { label: "Gérer utilisateurs", href: "/admin/utilisateurs", icon: <UserCheck size={16} />, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                  { label: "Paramètres", href: "/admin/parametres", icon: <Settings size={16} />, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                  { label: "Tickets", href: "/impression/ticket", icon: <CreditCard size={16} />, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}
                  >
                    {action.icon}
                    {action.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Info système */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-indigo-500" />
                Informations système
              </h3>
              {config && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Établissement</span>
                    <span className="font-medium text-slate-800">{config.nomEtablissement}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Service</span>
                    <span className="font-medium text-slate-800">{config.service}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Responsable</span>
                    <span className="font-medium text-slate-800">{config.responsableNom}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Utilisateurs</span>
                    <span className="font-medium text-slate-800">{stats.usersCount} compte(s)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Mode impression</span>
                    <span className={`flex items-center gap-1.5 font-medium ${config.utiliserImprimanteThermique ? "text-emerald-600" : "text-slate-600"}`}>
                      {config.utiliserImprimanteThermique ? (
                        <><CheckCircle2 size={14} /> Thermique</>
                      ) : (
                        <><AlertCircle size={14} /> Standard</>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
