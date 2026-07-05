import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppStoreProvider } from "./context/app-store";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStoreProvider>
      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-[#F7F9FC] text-base text-primary font-semibold">
            Loading ParkTime…
          </div>
        }
      >
        <App />
      </Suspense>
    </AppStoreProvider>
  </StrictMode>,
);
