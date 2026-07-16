"use client";

interface BadgeProps {
  label: string;
  color?: "blue" | "green" | "orange" | "red" | "purple" | "gray";
}

const COLORS = {
  blue:   "bg-blue-100 text-blue-800 border border-blue-200",
  green:  "bg-emerald-100 text-emerald-800 border border-emerald-200",
  orange: "bg-orange-100 text-orange-800 border border-orange-200",
  red:    "bg-red-100 text-red-800 border border-red-200",
  purple: "bg-purple-100 text-purple-800 border border-purple-200",
  gray:   "bg-gray-100 text-gray-700 border border-gray-200",
};

const GRADE_COLORS: Record<string, BadgeProps["color"]> = {
  A:   "blue",
  MC:  "green",
  PR:  "purple",
  PRT: "orange",
};

export function GradeBadge({ grade }: { grade: string }) {
  return (
    <Badge label={grade} color={GRADE_COLORS[grade] ?? "gray"} />
  );
}

export function StatutBadge({ statut }: { statut: string }) {
  return (
    <Badge
      label={statut}
      color={statut === "Permanent" ? "blue" : "orange"}
    />
  );
}

export default function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${COLORS[color]}`}>
      {label}
    </span>
  );
}
