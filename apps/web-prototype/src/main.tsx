import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppStoreProvider } from "./context/app-store";
import "./styles/index.css";
import "mapbox-gl/dist/mapbox-gl.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </StrictMode>,
);
