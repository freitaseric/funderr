import { createTheme } from "@mui/material/styles";

/** Material Design 3 theme for FUNDERR. */
export const funderrTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#386a20",
      light: "#b7f397",
      dark: "#205107",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#55624c",
      light: "#d9e7cb",
      dark: "#3e4a36",
      contrastText: "#ffffff",
    },
    info: { main: "#386668", light: "#bcebed", dark: "#1f4e50" },
    success: { main: "#386a20", light: "#b7f397", dark: "#205107" },
    warning: { main: "#825500", light: "#ffddb0", dark: "#633f00" },
    error: { main: "#ba1a1a", light: "#ffdad6", dark: "#93000a" },
    background: { default: "#f9faf2", paper: "#f9faf2" },
    text: { primary: "#1a1c18", secondary: "#44483f" },
    divider: "#c4c8bc",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: "2.25rem", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.75rem", lineHeight: 1.2, fontWeight: 500 },
    h3: { fontSize: "1.375rem", lineHeight: 1.25, fontWeight: 500 },
    h4: { fontSize: "1.125rem", lineHeight: 1.3, fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: "0.01em", textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320 },
        "::selection": { background: "#b7f397", color: "#0c2000" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 40, borderRadius: 999, paddingInline: 20 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12, background: "#ffffff" } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 20, backgroundImage: "none" } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 28 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.75rem" } },
    },
  },
});
