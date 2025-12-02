import apiClient from "./apiClient";
import { Snapshot } from "../models/snapshot";
import { HistoryPoint } from "../models/historyPoint";
import { API_BASE_PATH } from "../config/clientConfig";

export async function fetchClientSnapshots(): Promise<Snapshot[]> {
  // The backend resolves the actual client by the X-Client-Token header.
  // The path parameter here is ignored when a valid token is present.
  const url = `${API_BASE_PATH}/clients/0/snapshots`;
  const response = await apiClient.get<Snapshot[]>(url);
  return response.data;
}

export async function fetchClientHistory(): Promise<HistoryPoint[]> {
  // When X-Client-Token is present, the backend returns history only for
  // the associated client and ignores the client_id query parameter.
  const url = `${API_BASE_PATH}/history`;
  const response = await apiClient.get<HistoryPoint[]>(url);
  return response.data;
}
