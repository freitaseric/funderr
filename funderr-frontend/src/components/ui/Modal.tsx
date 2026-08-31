import React from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "2xl",
}) => {
  const materialMaxWidth = maxWidth === "4xl" ? "lg" : maxWidth === "2xl" ? "md" : maxWidth;

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth={materialMaxWidth}>
      <DialogTitle className="md3-dialog-title">
        <span>{title}</span>
        <IconButton onClick={onClose} aria-label="Fechar diálogo" size="small">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>}
        {children}
      </DialogContent>
    </Dialog>
  );
};
