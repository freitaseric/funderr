import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type NextFunction = () => void;

export interface Request {
  headers: Record<string, string | undefined>;
  method: string;
  body: any;
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  currentUser?: unknown;
}

class LegacyResponse {
  sent = false;

  constructor(private readonly reply: FastifyReply) {}

  status(code: number) {
    this.reply.code(code);
    return this;
  }

  json(value: unknown) {
    this.sent = true;
    return this.reply.send(value);
  }

  end() {
    this.sent = true;
    return this.reply.send();
  }
}

type Handler = (request: Request, response: LegacyResponse, next: NextFunction) => unknown;
type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RouteDefinition {
  method: Method;
  path: string;
  handler: Handler;
  middleware: Handler[];
}

function normalizeHeaders(headers: FastifyRequest["headers"]): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value])
  );
}

export class FastifyRouter {
  private readonly middleware: Handler[] = [];
  private readonly routes: RouteDefinition[] = [];

  private add(method: Method, path: string, handler: Handler) {
    this.routes.push({ method, path, handler, middleware: [...this.middleware] });
  }

  get(path: string, handler: Handler) { this.add("GET", path, handler); }
  post(path: string, handler: Handler) { this.add("POST", path, handler); }
  patch(path: string, handler: Handler) { this.add("PATCH", path, handler); }
  delete(path: string, handler: Handler) { this.add("DELETE", path, handler); }
  use(handler: Handler) { this.middleware.push(handler); }

  register(app: FastifyInstance) {
    for (const route of this.routes) {
      app.route({
        method: route.method,
        url: route.path,
        handler: async (rawRequest, reply) => {
          const request: Request = {
            headers: normalizeHeaders(rawRequest.headers),
            method: rawRequest.method,
            body: rawRequest.body ?? {},
            params: (rawRequest.params ?? {}) as Record<string, string>,
            query: (rawRequest.query ?? {}) as Record<string, string | undefined>,
          };
          const response = new LegacyResponse(reply);

          for (const middleware of route.middleware) {
            let proceed = false;
            await middleware(request, response, () => { proceed = true; });
            if (response.sent || !proceed) return;
          }

          await route.handler(request, response, () => undefined);
          if (!response.sent && !reply.sent) reply.code(204).send();
        },
      });
    }
  }
}

export function Router() {
  return new FastifyRouter();
}
