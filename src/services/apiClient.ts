import axios from "axios";
import { CLIENT_APP_TOKEN } from "../config/clientConfig";
import { getStoredPin } from "./pinStorage";

const defaultHeaders: Record<string, string> = {};

if (CLIENT_APP_TOKEN) {
  defaultHeaders["X-Client-Token"] = CLIENT_APP_TOKEN;
}

// In all environments, the client app talks to the backend via an environment variable.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
  headers: defaultHeaders,
});

apiClient.interceptors.request.use((config) => {
  const pin = getStoredPin();
  if (pin) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config.headers as any)["X-Client-Pin"] = pin;
  }
  return config;
});

export default apiClient;
