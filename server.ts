import express from "express";
import path from "path";
import fs from "fs";
import { apiRouter } from "./src/server/routes";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount API routes
app.use("/api", apiRouter);

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    // In dev mode, mount Vite as middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built assets from dist/client or dist
    const distPath = fs.existsSync(path.resolve(process.cwd(), "dist/client"))
      ? path.resolve(process.cwd(), "dist/client")
      : path.resolve(process.cwd(), "dist");

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FUNDERR] Servidor full-stack iniciado na porta ${PORT} (${isProd ? "PROD" : "DEV"})`);
  });
}

startServer().catch((err) => {
  console.error("Erro ao iniciar servidor:", err);
});
