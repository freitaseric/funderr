import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import App from "./App";

const EmptyRoute = () => null;

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: () => (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Página não encontrada</h1>
        <a className="mt-3 inline-block text-[#386a20] underline" href="/">
          Voltar ao painel
        </a>
      </div>
    </main>
  ),
});

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/processos", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/processos/$proposalId", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/beneficiarios", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/propriedades", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/linhas-credito", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/documentos", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/auditoria", component: EmptyRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: "/configuracoes", component: EmptyRoute }),
];

const routeTree = rootRoute.addChildren(routes);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
