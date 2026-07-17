"use client";
import type { EnseignantRow } from "@/lib/types";

export function StatsCards({ enseignants }: { enseignants: EnseignantRow[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-white rounded-lg border p-3 text-sm">Total: {enseignants.length}</div>
    </div>
  );
}
