"use client";

export function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-slate-100 text-slate-700 border-slate-300",
    MC: "bg-blue-50 text-blue-700 border-blue-200",
    PR: "bg-amber-50 text-amber-700 border-amber-200",
    PRT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${colors[grade] || "bg-gray-100 text-gray-700 border-gray-300"}`}
    >
      {grade || "—"}
    </span>
  );
}

export function StatutBadge({ statut }: { statut: string }) {
  const isPerm = statut === "Permanent";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
        isPerm ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-orange-50 text-orange-700 border border-orange-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isPerm ? "bg-purple-500" : "bg-orange-500"}`} />
      {statut || "—"}
    </span>
  );
}
