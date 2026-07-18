"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, GraduationCap, Shield } from "lucide-react";

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<any>({ nomEtablissement: "HC-Manager", service: "", logoEmoji: "🎓" });

  useEffect(() => {
    // Charger la config pour l'affichage
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setConfig(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, motDePasse: password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Identifiants incorrects");
        setLoading(false);
        return;
      }

      // Stocker dans sessionStorage
      sessionStorage.setItem("hc_user", JSON.stringify(data.utilisateur));
      sessionStorage.setItem("hc_token", data.token);
      sessionStorage.setItem("hc_config", JSON.stringify(data.config));

      onLogin(data.utilisateur);
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  const renderLogo = () => {
    if (config.logoType === "emoji" && config.logoEmoji) {
      return <span className="text-5xl">{config.logoEmoji}</span>;
    }
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
        <GraduationCap size={32} />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 p-4 relative overflow-hidden">
      {/* Cercles décoratifs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-indigo-100/50 blur-3xl" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-purple-100/40 blur-3xl" />

      {/* Carte de login */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Barre colorée */}
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />

        <div className="p-6 sm:p-8">
          {/* Logo + Titre */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">{renderLogo()}</div>
            <h1 className="text-xl font-bold text-slate-900 text-center">{config.nomEtablissement}</h1>
            <p className="text-sm text-slate-500 mt-1">{config.service || "Gestion des Heures Complémentaires"}</p>
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <Shield size={18} className="text-indigo-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Administration</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700 animate-fadeIn">
              <span className="text-red-500">⚠️</span>
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Identifiant</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder="Votre identifiant"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Signature développeur */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400">Développé par MAHARITSE Hiacinthe Bertrand</p>
            <p className="text-[10px] text-slate-400">📞 038 34 092 61</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useAuth() {
  if (typeof window === "undefined") return null;
  try {
    const user = sessionStorage.getItem("hc_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isAdmin(user: any): boolean {
  return user?.role === "Administrateur";
}

export function canManageUsers(user: any): boolean {
  return user?.role === "Administrateur";
}
