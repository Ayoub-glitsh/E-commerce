# -*- coding: utf-8 -*-
"""
Point d'entrée Flask du backend Python du chatbot IA (TâcheHaute #1673)

Structure prévue pour accueillir les routes définies dans
chatbot-ia/docs/openapi.yaml :
    - POST /chat/message            (chatbot conversationnel en streaming SSE) ✅
    - POST /ai/generate-description (génération de description produit)
    - POST /ai/summarize-reviews    (résumé d'avis clients)

La route /chat/message est implémentée (FonctionnalitéHaute #1671) :
    - validation du body (message obligatoire, conversation_history optionnel)
    - récupération du catalogue produits via le backend Node.js (route interne)
    - appel à l'API Groq (Llama 3.3 70B) avec streaming SSE
    - réponse au format Server-Sent Events (text/event-stream)

Les routes /ai/* restent des stubs retournant un 501 "Not Implemented".
Elles seront implémentées dans les prochaines sous-tâches.

----------------------------------------------------------------------------
INSTALLATION (environnement virtuel) :
    python -m venv venv
    venv\\Scripts\\activate          (Windows)
    pip install -r requirements.txt

LANCEMENT :
    python app.py
----------------------------------------------------------------------------
"""

import json

from flask import Flask, Response, jsonify, request
from flask_cors import CORS

import config
from services.catalog_client import get_catalogue_text
from services.chatbot_prompt import build_messages_for_groq

# ---------------------------------------------------------------------------
# Validation de l'environnement au démarrage
# ---------------------------------------------------------------------------
# Si GROQ_API_KEY est absente, on refuse de démarrer avec un message clair.
config.validate_environment()

# ---------------------------------------------------------------------------
# Création de l'application Flask
# ---------------------------------------------------------------------------
app = Flask(__name__)

# CORS : autorise le widget frontend (hébergé ailleurs) à appeler cette API.
# `resources={r"/*": {"origins": "*"}}` ouvre toutes les origines (développement).
CORS(app, resources={r"/*": {"origins": "*"}})


# ---------------------------------------------------------------------------
# Route de santé
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """
    Endpoint de vérification du bon fonctionnement du serveur.

    @returns: JSON { "status": "ok", "service": "chatbot-ia-backend" }
    """
    return jsonify({"status": "ok", "service": "chatbot-ia-backend"}), 200


# ---------------------------------------------------------------------------
# Helpers de validation
# ---------------------------------------------------------------------------
def validate_history_message(msg):
    """
    Valider un message de l'historique de conversation.

    @param msg: message à valider (doit être un objet avec role user/assistant
                et content string)
    @returns: True si le message est valide, False sinon
    """
    return (
        isinstance(msg, dict)
        and msg.get("role") in ("user", "assistant")
        and isinstance(msg.get("content"), str)
    )


def validate_chat_request(body):
    """
    Valider le body d'une requête POST /chat/message.

    Règles :
      - message : string obligatoire, non vide
      - conversation_history : array optionnel (défaut []) dont chaque élément
        respecte le format { role: "user"|"assistant", content: "string" }
      - context : objet optionnel (non utilisé pour l'instant, juste accepté)

    @param body: body JSON brut de la requête
    @returns: (message, conversation_history) si valide
    @raises ValueError: avec un message d'erreur clair si la validation échoue
    """
    if not isinstance(body, dict):
        raise ValueError("Le corps de la requête doit être un objet JSON.")

    # --- message : obligatoire, non vide ---
    message = body.get("message")
    if not isinstance(message, str) or message.strip() == "":
        raise ValueError("Le champ 'message' est requis (string).")

    # --- conversation_history : optionnel, tableau de { role, content } ---
    conversation_history = body.get("conversation_history", [])
    if not isinstance(conversation_history, list):
        raise ValueError(
            "Le champ 'conversation_history' doit être un tableau de messages."
        )
    for msg in conversation_history:
        if not validate_history_message(msg):
            raise ValueError(
                "Le champ 'conversation_history' contient un message invalide : "
                "chaque message doit être { \"role\": \"user\"|\"assistant\", "
                "\"content\": \"string\" }."
            )

    # --- context : optionnel, accepté sans validation pour l'instant ---

    return message, conversation_history


# ---------------------------------------------------------------------------
# Streaming SSE — générateur de la réponse
# ---------------------------------------------------------------------------
def stream_chat_response(message, conversation_history):
    """
    Générateur Python qui produit la réponse SSE au format attendu.

    Format de sortie (conforme à docs/openapi.yaml) :
        - pour chaque chunk reçu du stream Groq :
              data: {"delta": "texte du chunk"}\n\n
        - à la fin du stream :
              data: {"done": true}\n\n
        - en cas d'erreur pendant le stream :
              data: {"error": "message clair"}\n\n

    @yield: blocs de texte au format Server-Sent Events
    """
    try:
        # 1. Récupérer le catalogue produits depuis le backend Node.js
        catalogue_text = get_catalogue_text()

        # 2. Construire les messages au format Groq/OpenAI-compatible
        messages = build_messages_for_groq(conversation_history, catalogue_text)

        # 3. Appeler l'API Groq avec streaming
        from groq import Groq

        client = Groq(api_key=config.get_groq_api_key())

        stream = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stream=True,
        )

        # 4. Relayer chaque chunk sous forme d'événement SSE "delta"
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                delta = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'delta': delta}, ensure_ascii=False)}\n\n"

        # 5. Signal de fin de réponse
        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as exc:  # noqa: BLE001 - on veut capturer toutes les erreurs
        print(f"❌ Erreur lors du streaming /chat/message : {exc}")
        # Message utilisateur clair, cohérent avec l'exemple 500 du openapi.yaml
        error_message = (
            "Le service est temporairement surchargé, réessaie dans quelques secondes."
        )
        yield f"data: {json.dumps({'error': error_message}, ensure_ascii=False)}\n\n"


# ---------------------------------------------------------------------------
# Route principale — POST /chat/message (streaming SSE)
# ---------------------------------------------------------------------------
@app.route("/chat/message", methods=["POST"])
def chat_message():
    """
    Envoyer un message au chatbot et recevoir une réponse en streaming SSE.

    Body attendu :
      - message : string obligatoire
      - conversation_history : array optionnel (défaut [])
      - context : objet optionnel (ignoré pour l'instant)

    @returns: réponse HTTP 200 en text/event-stream (ou 400 si body invalide)
    """
    # --- Validation du body ---
    try:
        message, conversation_history = validate_chat_request(request.get_json(silent=True))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    # --- Réponse SSE ---
    return Response(
        stream_chat_response(message, conversation_history),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # désactive le buffering reverse-proxy
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# Stubs des routes /ai (implémentation ultérieure)
# ---------------------------------------------------------------------------
@app.route("/ai/generate-description", methods=["POST"])
def ai_generate_description():
    """
    Stub — Générer une description produit.

    À implémenter dans une prochaine sous-tâche (intégration Groq).
    """
    return (
        jsonify(
            {"error": "Endpoint /ai/generate-description non implémenté pour le moment."}
        ),
        501,
    )


@app.route("/ai/summarize-reviews", methods=["POST"])
def ai_summarize_reviews():
    """
    Stub — Résumer des avis clients.

    À implémenter dans une prochaine sous-tâche (intégration Groq).
    """
    return (
        jsonify(
            {"error": "Endpoint /ai/summarize-reviews non implémenté pour le moment."}
        ),
        501,
    )


# ---------------------------------------------------------------------------
# Point d'entrée du serveur
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Port défini via la variable d'environnement PORT (défaut : 5000)
    port = config.get_port()
    print(f"🚀 Backend chatbot IA démarré sur http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=(config.get_flask_env() == "development"))

