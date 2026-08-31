import cors from "@fastify/cors";
import Fastify from "fastify";
import { db } from "./server/db/database";
import { apiRouter } from "./server/routes";

function allowedOrigins(): string[] {
  return (process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function createApp() {
  await db.initialize();

  // Uploads chegam como base64 (aprox. 33% maiores que o arquivo original).
  // O limite HTTP preserva o teto legado de 25 MB para o conteúdo decodificado.
  const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 });
  const origins = allowedOrigins();

  // Fastify captura o handler vigente quando plugins/rotas são registrados.
  // Registre-o primeiro para também normalizar erros gerados pelo CORS e parser.
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    const reportedStatus =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    const statusCode = message === "Origem não autorizada pelo CORS"
      ? 403
      : reportedStatus >= 400 && reportedStatus < 500 ? reportedStatus : 500;
    reply.code(statusCode).send({
      error: statusCode < 500 ? message : "Erro interno do servidor",
    });
  });

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origem não autorizada pelo CORS"), false);
    },
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86_400,
  });

  app.addHook("onSend", async (_request, _reply, payload) => {
    await db.flush();
    return payload;
  });

  await app.register(async (api) => {
    apiRouter.register(api);
  }, { prefix: "/api" });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: "Rota não encontrada" });
  });

  return app;
}
