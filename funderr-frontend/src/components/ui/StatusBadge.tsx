import React from "react";
import Chip, { type ChipProps } from "@mui/material/Chip";
import { StepStatus } from "../../domain/types";

interface StatusBadgeProps {
  status: StepStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const norm = String(status).toUpperCase();

  let color: ChipProps["color"] = "default";
  let label = status;

  if (norm === "CONCLUIDO" || norm === "CONCLUÍDO" || norm === "APROVADO" || norm === "CONFIRMED" || norm === "ACTIVE") {
    color = "success";
    label = norm === "CONFIRMED" ? "CONFIRMADO" : norm === "ACTIVE" ? "ATIVO" : "CONCLUÍDO";
  } else if (norm === "EM_REVISAO" || norm === "EM REVISÃO" || norm === "REVIEW_REQUIRED") {
    color = "warning";
    label = norm === "REVIEW_REQUIRED" ? "REVISÃO NECESSÁRIA" : "EM REVISÃO";
  } else if (norm === "RASCUNHO" || norm === "EM ELABORAÇÃO" || norm === "PROCESSING") {
    color = "info";
    label = norm === "PROCESSING" ? "PROCESSANDO IA..." : norm === "EM ELABORAÇÃO" ? "EM ELABORAÇÃO" : "RASCUNHO";
  } else if (norm === "PENDENTE" || norm === "PENDING") {
    color = "default";
    label = "PENDENTE";
  } else if (norm === "RECUSADO" || norm === "FAILED" || norm === "DISABLED") {
    color = "error";
    label = norm === "FAILED" ? "FALHA" : norm === "DISABLED" ? "DESATIVADO" : "RECUSADO";
  }

  return <Chip color={color} size="small" variant="filled" label={String(label)} className={size === "sm" ? "md3-status-small" : undefined} />;
};
