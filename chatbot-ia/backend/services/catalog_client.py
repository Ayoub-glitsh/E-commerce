# -*- coding: utf-8 -*-
"""
Client HTTP vers le backend Node.js pour récupérer le catalogue produits
(FonctionnalitéHaute #1671)

Le backend Flask chatbot ne doit PAS accéder directement à la base de données
PostgreSQL. Il récupère le catalogue produits déjà formaté en appelant une route
interne exposée par le backend Node.js :
    GET {NODE_BACKEND_URL}/api/internal/chatbot-catalog

La variable d'environnement NODE_BACKEND_URL est configurable (défaut :
http://localhost:3000).

En cas d'échec réseau (backend Node injoignable, timeout, etc.), une fonction
retourne un texte de repli clair afin que le chatbot puisse continuer à répondre
sans planter.
"""

import os

import requests
from dotenv import load_dotenv

# Charge les variables du fichier .env (priorité à l'environnement système)
load_dotenv(override=False)

# URL de base du backend Node.js (configurable, défaut : http://localhost:3000)
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3000")

# Chemin de la route interne exposée par le backend Node.js
CATALOG_ENDPOINT = "/api/internal/chatbot-catalog"

# Timeout de l'appel HTTP en secondes
TIMEOUT_SECONDS = 5

# Texte de repli si le catalogue est injoignable
FALLBACK_CATALOG_TEXT = (
    "Le catalogue est temporairement indisponible. "
    "Veuillez rediriger le client vers le support humain pour toute demande "
    "concernant les produits, les prix ou les stocks."
)


def get_catalogue_text() -> str:
    """
    Récupère le texte du catalogue produits depuis le backend Node.js.

    @returns: le texte formaté du catalogue, ou un texte de repli si l'appel échoue
    """
    url = NODE_BACKEND_URL.rstrip("/") + CATALOG_ENDPOINT

    try:
        response = requests.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()

        data = response.json()
        catalogue = data.get("catalogue", "")

        # Retourne le catalogue s'il est non vide, sinon le texte de repli
        return catalogue if catalogue and catalogue.strip() else FALLBACK_CATALOG_TEXT

    except requests.exceptions.Timeout:
        print(f"⚠️ Timeout ({TIMEOUT_SECONDS}s) lors de l'appel à {url}")
    except requests.exceptions.ConnectionError:
        print(f"⚠️ Connexion refusée par le backend Node.js : {url}")
    except requests.exceptions.RequestException as exc:
        print(f"⚠️ Erreur HTTP lors de l'appel au catalogue : {exc}")
    except ValueError:
        print("⚠️ Réponse JSON invalide depuis le backend Node.js")

    return FALLBACK_CATALOG_TEXT

