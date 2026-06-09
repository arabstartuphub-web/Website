import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production, the frontend is served from a different origin (static site)
// and must call the API server directly. In dev, the shared proxy handles /api.
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl && apiUrl !== "/api") {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
