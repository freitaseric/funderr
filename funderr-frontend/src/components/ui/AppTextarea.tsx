import React from "react";
import TextField from "@mui/material/TextField";
import { retainLayoutClasses } from "./styleUtils";

export type AppTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AppTextarea: React.FC<AppTextareaProps> = ({ rows = 3, className, ...props }) => (
  <TextField
    multiline
    minRows={rows}
    fullWidth
    className={retainLayoutClasses(className)}
    value={props.value}
    placeholder={props.placeholder}
    onChange={props.onChange}
    disabled={props.disabled}
    required={props.required}
  />
);
