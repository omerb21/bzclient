export const API_BASE_PATH = "/api/v1/crm";

// Token used by the client-facing app to identify a single client on the backend.
// For each deployed client app build, this value should be replaced with the
// dedicated token assigned to that client.
export const CLIENT_APP_TOKEN = "trop5090";

export function hasClientTokenConfigured(): boolean {
  return !!CLIENT_APP_TOKEN;
}