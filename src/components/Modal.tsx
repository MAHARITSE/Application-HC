"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-3xl",
  full: "max-w-6xl",
};

export default function Modal({ isOpen, onClose, title, children, size = "lg" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={`relative w-full ${SIZES[size]} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-fadeIn`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-t-2xl shrink-0">
          <h2 className="text-base sm:text-lg font-bold tracking-wide truncate">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors shrink-0 ml-3">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
