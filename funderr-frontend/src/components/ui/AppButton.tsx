import React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import { retainLayoutClasses } from "./styleUtils";

type AppButtonProps = Omit<ButtonProps, "size"> & {
  size?: ButtonProps["size"];
};

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className = "", variant, color, ...props }, ref) => {
    const isProminent = /bg-\[#386a20\]|bg-(blue|emerald|amber)-(4|5|6|7|8|9)|text-white/.test(className);
    const resolvedVariant = variant
      ?? (isProminent ? "contained" : /border/.test(className) ? "outlined" : "text");
    const resolvedColor = color
      ?? (/rose|red/.test(className) ? "error" : /amber|yellow/.test(className) ? "warning" : "primary");

    return (
      <Button
        ref={ref}
        variant={resolvedVariant}
        color={resolvedColor}
        className={retainLayoutClasses(className)}
        {...props}
      />
    );
  },
);

AppButton.displayName = "AppButton";
