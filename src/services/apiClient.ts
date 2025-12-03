import axios from "axios";
import { CLIENT_APP_TOKEN } from "../config/clientConfig";
import { getStoredPin } from "./pinStorage";

const defaultHeaders: Record<string, string> = {};

if (CLIENT_APP_TOKEN) {
  defaultHeaders["X-Client-Token"] = CLIENT_APP_TOKEN;
}

// In all environments (development and production) the client app talks
// directly to the Render-hosted backend. CORS כבר מאפשר קריאות מ-localhost.
const apiClient = axios.create({
  baseURL: "https://ben-zvi.onrender.com",
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
