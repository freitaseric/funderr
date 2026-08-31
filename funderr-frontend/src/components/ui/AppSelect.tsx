import React from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { retainLayoutClasses } from "./styleUtils";

export type AppSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const AppSelect: React.FC<AppSelectProps> = ({ className, children, ...props }) => (
  <FormControl fullWidth size="small" className={retainLayoutClasses(className)}>
    <Select native inputProps={props as Record<string, unknown>} value={props.value ?? ""}>
      {children}
    </Select>
  </FormControl>
);
