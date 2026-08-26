import React from "react";
import { StepStatus } from "../../../domain/types";

interface StatusBadgeProps {
  status: StepStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const norm = String(status).toUpperCase();

  let bg = "bg-gray-100 text-gray-700 border-gray-300";
  let label = status;

  if (norm === "CONCLUIDO" || norm === "CONCLUÍDO" || norm === "APROVADO" || norm === "CONFIRMED" || norm === "ACTIVE") {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-300";
    label = norm === "CONFIRMED" ? "CONFIRMADO" : norm === "ACTIVE" ? "ATIVO" : "CONCLUÍDO";
  } else if (norm === "EM_REVISAO" || norm === "EM REVISÃO" || norm === "REVIEW_REQUIRED") {
    bg = "bg-amber-50 text-amber-800 border-amber-300 animate-pulse";
    label = norm === "REVIEW_REQUIRED" ? "REVISÃO NECESSÁRIA" : "EM REVISÃO";
  } else if (norm === "RASCUNHO" || norm === "EM ELABORAÇÃO" || norm === "PROCESSING") {
    bg = "bg-blue-50 text-blue-700 border-blue-300";
    label = norm === "PROCESSING" ? "PROCESSANDO IA..." : norm === "EM ELABORAÇÃO" ? "EM ELABORAÇÃO" : "RASCUNHO";
  } else if (norm === "PENDENTE" || norm === "PENDING") {
    bg = "bg-slate-100 text-slate-600 border-slate-300";
    label = "PENDENTE";
  } else if (norm === "RECUSADO" || norm === "FAILED" || norm === "DISABLED") {
    bg = "bg-rose-50 text-rose-700 border-rose-300";
    label = norm === "FAILED" ? "FALHA" : norm === "DISABLED" ? "DESATIVADO" : "RECUSADO";
  }

  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${px} ${bg} tracking-wide transition-colors`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {label}
    </span>
  );
};
