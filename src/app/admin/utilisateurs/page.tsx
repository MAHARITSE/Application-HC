"use client";
import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Search,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";

interface Utilisateur {
  id: number;
  login: string;
  nom: string;
  prenom: string | null;
  role: "Administrateur" | "Gestionnaire" | "Secrétaire";
  actif: boolean;
  email: string | null;
  telephone: string | null;
  derniereConnexion: string | null;
  createdAt: string;
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form, setForm] = useState<{
    login: string;
    nom: string;
    prenom: string;
    motDePasse: string;
    role: "Administrateur" | "Gestionnaire" | "Secrétaire";
    actif: boolean;
    email: string;
    telephone: string;
  }>({
    login: "",
    nom: "",
    prenom: "",
    motDePasse: "",
    role: "Secrétaire",
    actif: true,
    email: "",
    telephone: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("hc_user");
    if (stored) setCurrentUser(JSON.parse(stored));
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/utilisateurs");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setForm({ login: "", nom: "", prenom: "", motDePasse: "", role: "Secrétaire", actif: true, email: "", telephone: "" });
    setError("");
    setShowForm(true);
  };

  const handleEdit = (u: Utilisateur) => {
    setEditingUser(u);
    setForm({
      login: u.login,
      nom: u.nom,
      prenom: u.prenom || "",
      motDePasse: "",
      role: u.role,
      actif: u.actif,
      email: u.email || "",
      telephone: u.telephone || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editingUser && !form.motDePasse) {
      setError("Le mot de passe est requis");
      return;
    }

    try {
      const payload: any = { ...form };
      if (editingUser) payload.id = editingUser.id;
      if (editingUser && !form.motDePasse) delete payload.motDePasse;

      const res = await fetch("/api/utilisateurs", {
        method: editingUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Erreur");
        return;
      }

      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await fetch(`/api/utilisateurs?id=${id}`, { method: "DELETE" });
    loadUsers();
  };

  const handleToggleActif = async (u: Utilisateur) => {
    await fetch("/api/utilisateurs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, actif: !u.actif }),
    });
    loadUsers();
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      Administrateur: "bg-purple-100 text-purple-700 border-purple-200",
      Gestionnaire: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Secrétaire: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return styles[role] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.nom.toLowerCase().includes(q) ||
      (u.prenom || "").toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const isAdmin = currentUser?.role === "Administrateur";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield size={28} className="text-indigo-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={18} /> Nouvel utilisateur
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Utilisateur", "Login", "Rôle", "Contact", "Statut", "Dernière connexion", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                          {u.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {u.nom} {u.prenom || ""}
                          </p>
                          <p className="text-xs text-slate-400">{u.login}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{u.login}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.email && <div className="text-slate-600">{u.email}</div>}
                      {u.telephone && <div className="text-slate-400">{u.telephone}</div>}
                      {!u.email && !u.telephone && <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <button
                          onClick={() => handleToggleActif(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            u.actif
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {u.actif ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {u.actif ? "Actif" : "Inactif"}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            u.actif ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {u.actif ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {u.actif ? "Actif" : "Inactif"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {u.derniereConnexion
                        ? new Date(u.derniereConnexion).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Jamais"}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition"
                            title="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <Users size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white">
              <h2 className="text-lg font-bold">{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-white/20 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login *</label>
                  <input
                    type="text"
                    value={form.login}
                    onChange={(e) => setForm({ ...form, login: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe {editingUser ? "(laisser vide pour ne pas changer)" : "*"}</label>
                  <input
                    type="password"
                    value={form.motDePasse}
                    onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Administrateur">Administrateur</option>
                    <option value="Gestionnaire">Gestionnaire</option>
                    <option value="Secrétaire">Secrétaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actif</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.actif}
                      onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Compte actif</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                >
                  <UserCheck size={16} />
                  {editingUser ? "Mettre à jour" : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
