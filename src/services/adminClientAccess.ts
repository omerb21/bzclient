import apiClient from "./apiClient";

export interface ClientCredentialsResetResult {
  clientId: number;
  clientToken: string;
  clientPin: string;
}

export async function resetClientCredentials(
  clientId: number
): Promise<ClientCredentialsResetResult> {
  const response = await apiClient.post<ClientCredentialsResetResult>(
    `/api/v1/admin/clients/${clientId}/credentials/reset`
  );
  return response.data;
}

export interface ClientTokenUpdatePayload {
  clientToken: string;
}

export async function updateClientToken(
  clientId: number,
  clientToken: string
): Promise<void> {
  const payload: ClientTokenUpdatePayload = { clientToken };
  await apiClient.post(`/api/v1/admin/clients/${clientId}/token`, payload);
}

export interface ClientPinUpdatePayload {
  clientPin: string | null;
}

export async function updateClientPin(
  clientId: number,
  clientPin: string | null
): Promise<void> {
  const payload: ClientPinUpdatePayload = { clientPin };
  await apiClient.post(`/api/v1/admin/clients/${clientId}/pin`, payload);
}
