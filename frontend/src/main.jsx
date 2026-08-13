import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { worker } from "./mocks/browser";

/*
 * MSW (Mock Service Worker) est désactivé par défaut.
 * Pour activer les mocks en mode isolé (tests / développement sans backend),
 * créez un fichier .env.local avec VITE_ENABLE_MOCKS=true dans frontend/
 *
 * Exemple :
 *   VITE_ENABLE_MOCKS=true
 *   npm run dev
 *
 * MSW intercepte alors les appels fetch("/api/...") avec les handlers du dossier mocks/
 * et permet de développer le frontend sans dépendre du backend Node.js réel.
 *
 * En production, MSW n'est jamais activé : toutes les requêtes /api sont proxyfiées
 * vers le backend via la config server.proxy dans vite.config.js.
 */
const enableMocks = import.meta.env.VITE_ENABLE_MOCKS === "true";

async function startApp() {
  if (enableMocks) {
    await worker.start();
    console.log("[MSW] Mock Service Worker activé (mode test isolé)");
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}

startApp();
