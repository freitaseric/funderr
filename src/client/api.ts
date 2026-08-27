// FUNDERR Frontend Typed API Client

import { firebaseAuth } from "./lib/firebase";

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  _legacyUserRole?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (firebaseAuth.currentUser) {
    const idToken = await firebaseAuth.currentUser.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Ocorreu um erro no processamento");
  }
  return data as T;
}
