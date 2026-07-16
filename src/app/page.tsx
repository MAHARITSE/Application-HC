"use client";

import { useState, useEffect, useCallback } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EnseignantForm } from "@/components/EnseignantForm";
import { StatsCards } from "@/components/StatsCards";
import type { EnseignantRow } from "@/lib/types";

type View = "dashboard" | "form";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [enseignants, setEnseignants] = useState<EnseignantRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEnseignants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/enseignants?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEnseignants(data);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEnseignants();
  }, [fetchEnseignants]);

  const handleAdd = () => {
    setEditingId(null);
    setView("form");
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setView("form");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet enseignant ?"))
      return;
    try {
      await fetch(`/api/enseignants/${id}`, { method: "DELETE" });
      fetchEnseignants();
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const handleFormClose = () => {
    setView("dashboard");
    setEditingId(null);
    fetchEnseignants();
  };

  const handleExportExcel = () => {
    window.open("/api/export/excel", "_blank");
  };

  const handleExportFiche = (id: number) => {
    window.open(`/api/export/fiche/${id}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-navy-900 to-navy-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                HC
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Heures Complémentaires
                </h1>
                <p className="text-blue-200 text-xs -mt-0.5">
                  Gestion des enseignants du supérieur
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <button
                onClick={() => {
                  setView("dashboard");
                  setEditingId(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === "dashboard"
                    ? "bg-white/20 text-white shadow-inner"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                📊 Tableau de bord
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-400 text-white transition-all shadow-md hover:shadow-lg"
              >
                + Ajouter
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === "dashboard" ? (
          <>
            <StatsCards enseignants={enseignants} />
            <Dashboard
              enseignants={enseignants}
              loading={loading}
              search={search}
              onSearchChange={setSearch}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExportExcel={handleExportExcel}
              onExportFiche={handleExportFiche}
            />
          </>
        ) : (
          <EnseignantForm
            editingId={editingId}
            onClose={handleFormClose}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} — Application de Gestion des Heures
          Complémentaires — Enseignants du Supérieur
        </div>
      </footer>
    </div>
  );
}
