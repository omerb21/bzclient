import axios from "axios";
import { CLIENT_APP_TOKEN } from "../config/clientConfig";

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

export default apiClient;
