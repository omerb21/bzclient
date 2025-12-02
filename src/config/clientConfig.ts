export const API_BASE_PATH = "/api/v1/crm";

const TOKEN_STORAGE_KEY = "bz_clientapp_token";

function resolveClientToken(): string | null {
  const envToken =
    ((import.meta as any).env?.VITE_CLIENT_APP_TOKEN as string | undefined) ||
    null;

  if (typeof window === "undefined") {
    return envToken;
  }

  try {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("token");

    if (tokenFromUrl && tokenFromUrl.trim()) {
      const cleanToken = tokenFromUrl.trim();
      window.localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);

      url.searchParams.delete("token");
      const newSearch = url.searchParams.toString();
      const newPath = newSearch
        ? `${url.pathname}?${newSearch}${url.hash}`
        : `${url.pathname}${url.hash}`;
      window.history.replaceState({}, "", newPath);

      return cleanToken;
    }

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken && storedToken.trim()) {
      return storedToken.trim();
    }
  } catch {
    // ignore URL/localStorage errors and fall back to envToken
  }

  return envToken;
}

// Token used by the client-facing app to identify a single client on the backend.
// For each deployed client app build, this value should be replaced with the
// dedicated token assigned to that client.
export const CLIENT_APP_TOKEN = resolveClientToken();

export function hasClientTokenConfigured(): boolean {
  return !!CLIENT_APP_TOKEN;
}