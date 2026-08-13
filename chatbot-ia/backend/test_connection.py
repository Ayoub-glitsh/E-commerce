# -*- coding: utf-8 -*-
"""
Script de test de connexion à l'API Groq (Llama 3.3 70B) — TâcheHaute #1673

Script simple et autonome, exécutable directement :
    python test_connection.py

Il charge la clé API depuis .env (via config.py), envoie une requête minimale
au modèle Llama 3.3 70B (hébergé par Groq) et affiche un message clair de
succès ou d'échec.

Prérequis :
    - pip install -r requirements.txt
    - Un fichier .env contenant GROQ_API_KEY (voir .env.example)
"""

import sys

import config

# Modèle Llama 3.3 70B (versatile) hébergé par Groq, utilisé pour le test
MODEL_NAME = "llama-3.3-70b-versatile"

# Prompt minimal envoyé à Groq pour vérifier la connexion
TEST_MESSAGE = "Réponds juste OK si tu me reçois"


def main():
    """
    Vérifie la connexion à l'API Groq en envoyant un message minimal.

    Affiche la réponse reçue en cas de succès, ou une erreur explicite
    en cas d'échec (mauvaise clé, réseau, etc.), puis sort avec un code
    de retour non nul en cas d'échec.
    """
    print("🔌 Test de connexion à l'API Groq (Llama 3.3 70B)...")

    # 1. Charger et valider la clé API (message clair si absente)
    try:
        api_key = config.get_groq_api_key()
    except RuntimeError as exc:
        print(f"❌ {exc}")
        sys.exit(1)

    # 2. Créer le client Groq
    try:
        # Import tardif : évite d'échouer si le SDK n'est pas installé,
        # tout en affichant un message d'aide explicite.
        from groq import Groq

        client = Groq(api_key=api_key)
    except ImportError:
        print(
            "❌ Le SDK 'groq' n'est pas installé. "
            "Exécutez : pip install -r requirements.txt"
        )
        sys.exit(1)

    # 3. Envoyer la requête minimale à l'API Groq (format compatible OpenAI)
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": TEST_MESSAGE}],
        )

        # 4. Afficher la réponse reçue
        reply = response.choices[0].message.content if response.choices else "(réponse vide)"
        print(f"✅ Connexion réussie à l'API Groq !")
        print(f"   Modèle utilisé : {MODEL_NAME}")
        print(f"   Réponse du modèle : {reply}")

    except Exception as exc:  # noqa: BLE001 - on veut capturer toutes les erreurs réseau/API
        print(f"❌ Échec de la connexion à l'API Groq : {exc}")
        print("   Vérifiez votre clé API (GROQ_API_KEY), votre réseau,")
        print("   et que le modèle demandé est disponible sur votre compte.")
        sys.exit(1)


if __name__ == "__main__":
    main()


