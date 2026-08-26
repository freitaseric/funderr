// FUNDERR Frontend Typed API Client

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  userRole?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (userRole) {
    headers.set("x-user-role", userRole);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Ocorreu um erro no processamento");
  }
  return data as T;
}
