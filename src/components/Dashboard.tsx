"use client";
import type { EnseignantRow } from "@/lib/types";

interface DashboardProps {
  enseignants: EnseignantRow[];
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onExportExcel: () => void;
  onExportFiche: (id: number) => void;
}

export function Dashboard({ enseignants, loading }: DashboardProps) {
  if (loading) return <div className="p-4 text-center text-slate-400">Chargement...</div>;
  return (
    <div className="p-4 bg-white rounded-xl border">
      <p className="text-sm text-slate-500">Dashboard legacy – utilisez la page principale. {enseignants.length} enseignants</p>
    </div>
  );
}
