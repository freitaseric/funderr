// FUNDERR Frontend Typed API Client

import { firebaseAuth } from "./lib/firebase";

const apiBaseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  _legacyUserRole?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (firebaseAuth?.currentUser) {
    const idToken = await firebaseAuth.currentUser.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const res = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = res.status === 204 ? "" : await res.text();
  let data: any = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: responseText };
    }
  }
  if (!res.ok) {
    throw new Error(data?.error || `A API respondeu com HTTP ${res.status}`);
  }
  return data as T;
}
