"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import LoginForm from "@/components/LoginForm";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Vérifier session
    const stored = sessionStorage.getItem("hc_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("hc_user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("hc_user");
    sessionStorage.removeItem("hc_token");
    setUser(null);
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Page de login (pas de sidebar)
  if (pathname === "/admin/login") {
    if (user) {
      // Rediriger vers le dashboard si déjà connecté
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
      }
      return null;
    }
    return <LoginForm onLogin={handleLogin} />;
  }

  // Protection : rediriger vers login si non connecté
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <AdminSidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
