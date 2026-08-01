# -*- coding: utf-8 -*-
"""
Point d'entrée Flask du backend Python du chatbot IA (TâcheHaute #1673)

Structure prévue pour accueillir les routes définies dans
chatbot-ia/docs/openapi.yaml :
    - POST /chat/message            (chatbot conversationnel en streaming SSE)
    - POST /ai/generate-description (génération de description produit)
    - POST /ai/summarize-reviews    (résumé d'avis clients)

Ces routes sont pour l'instant des stubs qui retournent un 501
"Not Implemented" avec un message clair. Elles seront implémentées
dans les prochaines sous-tâches.

----------------------------------------------------------------------------
INSTALLATION (environnement virtuel) :
    python -m venv venv
    venv\\Scripts\\activate          (Windows)
    pip install -r requirements.txt

LANCEMENT :
    python app.py
----------------------------------------------------------------------------
"""

import os

from flask import Flask, jsonify
from flask_cors import CORS

import config

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
# Stubs des routes définies dans openapi.yaml (implémentation ultérieure)
# ---------------------------------------------------------------------------
@app.route("/chat/message", methods=["POST"])
def chat_message():
    """
    Stub — Envoyer un message au chatbot (streaming SSE).

    À implémenter dans une prochaine sous-tâche (intégration Groq).
    """
    return (
        jsonify({"error": "Endpoint /chat/message non implémenté pour le moment."}),
        501,
    )


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


