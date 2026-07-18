"use client";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  GraduationCap,
  CreditCard,
  Ticket,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Home,
  Printer,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface AdminSidebarProps {
  user: any;
  onLogout: () => void;
}

export default function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "/admin",
      label: "Tableau de bord",
      icon: <LayoutDashboard size={20} />,
    },
    {
      href: "/admin/utilisateurs",
      label: "Utilisateurs",
      icon: <Users size={20} />,
      badge: user?.role === "Administrateur" ? "Admin" : undefined,
    },
    {
      href: "/admin/parametres",
      label: "Paramètres",
      icon: <Settings size={20} />,
    },
    {
      href: "/impression/ticket",
      label: "Tickets imprimables",
      icon: <Printer size={20} />,
    },
  ];

  const roleColors: Record<string, string> = {
    Administrateur: "bg-purple-100 text-purple-700 border-purple-200",
    Gestionnaire: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Secrétaire: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const sidebar = (
    <div
      className={`${
        collapsed ? "w-[72px]" : "w-[260px]"
      } bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white flex flex-col transition-all duration-300 h-full relative`}
    >
      {/* Logo */}
      <div className={`p-4 flex items-center gap-3 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
          <GraduationCap size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold tracking-wide">HC-Manager</h2>
            <p className="text-[10px] text-indigo-300">Administration</p>
          </div>
        )}
      </div>

      {/* User info */}
      <div className={`px-3 py-3 border-b border-white/10 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-full bg-indigo-600/40 flex items-center justify-center text-sm font-bold">
            {user?.nom?.charAt(0) || "A"}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600/40 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.nom?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.nom} {user?.prenom}</p>
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border mt-0.5 ${
                  roleColors[user?.role] || "bg-slate-100/10 text-slate-300 border-slate-400/20"
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {/* Accueil */}
        <a
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
            collapsed ? "justify-center" : ""
          } text-slate-300 hover:text-white hover:bg-white/10`}
          title="Retour à l'application"
        >
          <Home size={20} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate">Accueil App</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </a>

        <div className="h-px bg-white/10 my-2 mx-2" />

        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group hover:bg-white/10 hover:text-white ${
              collapsed ? "justify-center" : ""
            } ${
              typeof window !== "undefined" && window.location.pathname === item.href
                ? "bg-white/15 text-white font-medium"
                : "text-slate-300"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Étendre" : "Réduire"}
        >
          <Menu size={16} />
          {!collapsed && "Réduire le menu"}
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition ${
            collapsed ? "justify-center" : ""
          }`}
          title="Déconnexion"
        >
          <LogOut size={16} />
          {!collapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-indigo-900 text-white shadow-lg hover:bg-indigo-800 transition"
      >
        <Menu size={22} />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed left-0 top-0 h-full z-50 animate-slideIn">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-[-44px] p-2 bg-indigo-900 text-white rounded-r-xl shadow-lg"
          >
            <X size={18} />
          </button>
          {sidebar}
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:block h-full">{sidebar}</div>
    </>
  );
}
