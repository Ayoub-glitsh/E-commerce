// widget.js
(function () {
  // Adapte cette URL à ton environnement (backend Flask)
  const API_URL = "http://localhost:5000/chat/message";

  // Intervalle (ms) entre deux ajouts de caractères dans l'animation.
  // On ne met pas à jour le DOM à chaque frame (60fps serait trop rapide),
  // on throttle via un timestamp : ~25ms par "tick".
  const ANIMATION_INTERVAL = 25;

  // Timeout (ms) au-delà duquel on abandonne une requête sans réponse (#1677).
  const REQUEST_TIMEOUT_MS = 30000;

  // Clé localStorage utilisée pour persister l'historique de conversation (#1677).
  const STORAGE_KEY = "chatbot_conversation_history";

  let messages = []; // historique { role, content }
  let isTyping = false;

  // --- État de l'animation letter-by-letter (#1676) ---
  let targetText = ""; // texte cible complet reçu du stream
  let displayedText = ""; // texte actuellement affiché à l'écran
  let animationId = null; // ID de la boucle requestAnimationFrame
  let lastFrameTime = 0; // timestamp de la dernière frame traitée
  let streamEnded = false; // true quand le stream est terminé (done/finally)
  let lastAssistantIndex = -1; // index du message assistant en cours d'animation
  let currentAbort = null; // AbortController du fetch en cours

  const root = document.getElementById("chatbot-widget-root");
  const toggleBtn = document.getElementById("cw-toggle-btn");
  const panel = document.getElementById("cw-panel");
  const messagesEl = document.getElementById("cw-messages");
  const inputEl = document.getElementById("cw-input");
  const sendBtn = document.getElementById("cw-send-btn");
  const resetBtn = document.getElementById("cw-reset-btn");
  const minimizeBtn = document.getElementById("cw-minimize-btn");
  const typingEl = document.getElementById("cw-typing");
  const errorEl = document.getElementById("cw-error");

  // --- Persistance de l'historique en localStorage (#1677) ---
  function saveHistoryToStorage(messages) {
    try {
      // On ignore les messages vides (ex: bulle assistant encore vide).
      const history = messages.filter((m) => m && m.content !== "");
      if (history.length === 0) {
        // Rien à persister : on retire l'éventuelle clé restante.
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      // Quota dépassé ou localStorage désactivé : on logge sans bloquer l'app.
      console.warn("[chatbot] Impossible de sauvegarder l'historique :", err);
    }
  }

  function loadHistoryFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (m) =>
          m &&
          typeof m.role === "string" &&
          typeof m.content === "string" &&
          m.content !== ""
      );
    } catch (err) {
      // Clé absente, JSON invalide ou localStorage désactivé : historique vide.
      console.warn("[chatbot] Impossible de charger l'historique :", err);
      return [];
    }
  }

  function renderMessages() {
    messagesEl.innerHTML = "";

    if (messages.length === 0) {
      const hint = document.createElement("div");
      hint.className = "cw-empty-hint";
      hint.textContent = "Pose-moi une question sur nos produits !";
      messagesEl.appendChild(hint);
      return;
    }

    messages.forEach((m) => {
      const row = document.createElement("div");
      row.className = `cw-bubble-row cw-${m.role}`;
      const bubble = document.createElement("div");
      bubble.className = `cw-bubble cw-${m.role}`;
      bubble.textContent = m.content;
      row.appendChild(bubble);
      messagesEl.appendChild(row);
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Persistance : le tableau messages vient d'être mis à jour (#1677).
    saveHistoryToStorage(messages);
  }

  // Met à jour uniquement la dernière bulle assistant (évite de re-rendre
  // toute la liste à chaque frame de l'animation).
  function updateLastAssistantBubble(text) {
    const rows = messagesEl.querySelectorAll(".cw-bubble-row.cw-assistant");
    if (rows.length === 0) return;
    const bubble = rows[rows.length - 1].querySelector(".cw-bubble");
    if (bubble) {
      bubble.textContent = text;
      // Auto-scroll pendant l'animation letter-by-letter, pas seulement au
      // premier rendu du message (#1677).
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  // Boucle d'animation letter-by-letter (throttlée ~25ms via timestamp).
  // - Ajoute 1-2 caractères par tick à displayedText
  // - Met à jour le DOM de la dernière bulle assistant
  // - Se rappelle via requestAnimationFrame tant qu'il reste du texte à rattraper
  // - Ne masque l'indicateur de frappe que quand streamEnded ET rattrapage fini
  function animateText(timestamp) {
    if (lastFrameTime === 0) lastFrameTime = timestamp;

    if (timestamp - lastFrameTime >= ANIMATION_INTERVAL) {
      lastFrameTime = timestamp;

      const remaining = targetText.length - displayedText.length;
      // Ajoute 1 caractère (2 si la cible est très en avance, pour bien
      // "rattraper" les gros chunks reçus d'un coup sans à-coup).
      const step = remaining > 20 ? 2 : 1;
      displayedText = targetText.slice(0, displayedText.length + step);
      updateLastAssistantBubble(displayedText);
    }

    if (displayedText.length < targetText.length) {
      animationId = requestAnimationFrame(animateText);
    } else {
      // Tout est affiché : l'animation est terminée.
      animationId = null;
      if (streamEnded) setTyping(false);
    }
  }

  // Démarre l'animation si elle n'est pas déjà en cours.
  function startAnimation() {
    if (animationId !== null) return; // déjà en cours
    lastFrameTime = 0;
    animationId = requestAnimationFrame(animateText);
  }

  // Annule proprement la boucle d'animation en cours.
  function stopAnimation() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    lastFrameTime = 0;
  }

  function setTyping(on) {
    isTyping = on;
    typingEl.classList.toggle("cw-visible", on);
    sendBtn.disabled = on || !inputEl.value.trim();
    inputEl.disabled = on;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("cw-visible");
  }

  function clearError() {
    errorEl.classList.remove("cw-visible");
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isTyping) return;

    clearError();

    // Annuler une éventuelle animation/stream précédente (défensif)
    stopAnimation();
    if (currentAbort) currentAbort.abort();

    const historyForRequest = [...messages]; // avant le nouveau message
    messages.push({ role: "user", content: text });
    messages.push({ role: "assistant", content: "" });
    lastAssistantIndex = messages.length - 1;
    inputEl.value = "";
    renderMessages();
    setTyping(true);

    // Initialise l'état de l'animation pour cette nouvelle réponse.
    targetText = "";
    displayedText = "";
    streamEnded = false;

    // AbortController : permet d'annuler proprement le fetch si l'utilisateur
    // clique "Nouvelle conversation" pendant la réception du stream.
    const abortController = new AbortController();
    currentAbort = abortController;
    let didTimeout = false;

    // Timeout de 30s : on abandonne la requête si le serveur ne répond pas.
    // clearTimeout est appelé dès que la réponse arrive (voir try/finally).
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_history: historyForRequest,
        }),
        signal: abortController.signal,
      });

      // La réponse est arrivée : le timeout n'a plus lieu d'être.
      clearTimeout(timeoutId);

      if (!res.ok || !res.body) throw new Error("Réponse serveur invalide");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // fragment incomplet conservé pour le prochain tour

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          let payload;
          try {
            payload = JSON.parse(line.slice(6));
          } catch (e) {
            continue; // ligne SSE malformée : on l'ignore
          }

          if (payload.delta) {
            // Accumulation dans targetText ; l'animation affiche progressivement.
            // Pas d'affichage instantané ici.
            targetText += payload.delta;
            messages[lastAssistantIndex].content = targetText; // texte complet pour l'historique
            startAnimation();
          }
          if (payload.error) showError(payload.error);
          // payload.done : ne pas couper l'animation immédiatement.
          // C'est dans finally que streamEnded passe à true, et animateText()
          // masquera l'indicateur quand displayedText aura rattrapé targetText.
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        if (didTimeout) {
          // Timeout 30s : message dédié + retrait de la bulle assistant vide.
          if (
            messages[lastAssistantIndex] &&
            messages[lastAssistantIndex].content === ""
          ) {
            messages.splice(lastAssistantIndex, 1);
            renderMessages(); // re-rend + sauvegarde localStorage
          }
          showError("La requête a pris trop de temps, réessaie.");
        }
        // Sinon : reset volontaire (Nouvelle conversation) → silence.
        return;
      }
      showError("Connexion au chatbot impossible.");
    } finally {
      clearTimeout(timeoutId); // par sécurité
      streamEnded = true;
      // Persistance après la fin du stream (bulle assistant complète).
      saveHistoryToStorage(messages);
      // Masquer le typing seulement si aucune animation n'est en cours.
      // Sinon, animateText() le fera quand displayedText === targetText.
      if (animationId === null) setTyping(false);
      if (currentAbort === abortController) currentAbort = null;
    }
  }

  function resetConversation() {
    // Annuler le fetch en cours (s'il existe)
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
    // Le timeout 30s associé est nettoyé dans le finally de sendMessage().

    // Purger l'historique persisté (#1677)
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("[chatbot] Impossible de supprimer l'historique :", err);
    }

    // Annuler proprement l'animation en cours (éviter les animations fantômes)
    stopAnimation();

    // Réinitialiser l'état d'animation
    targetText = "";
    displayedText = "";
    streamEnded = false;
    lastAssistantIndex = -1;

    messages = [];
    clearError();
    renderMessages();
    setTyping(false);
  }

  toggleBtn.addEventListener("click", () => {
    panel.classList.add("cw-open");
    toggleBtn.style.display = "none";
  });

  minimizeBtn.addEventListener("click", () => {
    panel.classList.remove("cw-open");
    toggleBtn.style.display = "block";
  });

  resetBtn.addEventListener("click", resetConversation);

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("input", () => {
    sendBtn.disabled = isTyping || !inputEl.value.trim();
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Charger l'historique persisté avant le premier rendu (#1677)
  messages = loadHistoryFromStorage();
  renderMessages();
})();

