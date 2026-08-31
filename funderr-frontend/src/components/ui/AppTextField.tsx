import React from "react";
import Checkbox, { type CheckboxProps } from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import { retainLayoutClasses } from "./styleUtils";

export type AppTextFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AppTextField = React.forwardRef<HTMLInputElement, AppTextFieldProps>(
  ({ type = "text", className, size: _size, ...props }, ref) => {
    if (type === "checkbox") {
      return (
        <Checkbox
          size="small"
          className={retainLayoutClasses(className)}
          slotProps={{ input: { ref } }}
          {...(props as CheckboxProps)}
        />
      );
    }

    if (type === "file") {
      return <input ref={ref} type="file" className={`md3-file-input ${className || ""}`} {...props} />;
    }

    return (
      <TextField
        inputRef={ref}
        type={type}
        fullWidth
        className={retainLayoutClasses(className)}
        slotProps={{ htmlInput: props }}
      />
    );
  },
);

AppTextField.displayName = "AppTextField";
