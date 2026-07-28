// widget.js
(function () {
  // Adapte cette URL à ton environnement (backend Flask)
  const API_URL = "http://localhost:5000/chat/message";

  let messages = []; // historique { role, content }
  let isTyping = false;

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
    const historyForRequest = [...messages]; // avant le nouveau message
    messages.push({ role: "user", content: text });
    messages.push({ role: "assistant", content: "" });
    inputEl.value = "";
    renderMessages();
    setTyping(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_history: historyForRequest,
        }),
      });

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
          const payload = JSON.parse(line.slice(6));

          if (payload.delta) {
            messages[messages.length - 1].content += payload.delta;
            renderMessages();
          }
          if (payload.error) showError(payload.error);
          if (payload.done) setTyping(false);
        }
      }
    } catch (err) {
      showError("Connexion au chatbot impossible.");
    } finally {
      setTyping(false);
    }
  }

  function resetConversation() {
    messages = [];
    clearError();
    renderMessages();
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

  renderMessages();
})();
