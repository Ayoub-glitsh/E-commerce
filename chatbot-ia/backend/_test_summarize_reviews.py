# -*- coding: utf-8 -*-
"""
Script temporaire de validation de l'endpoint /ai/summarize-reviews
Sans appeler la vraie API Groq (mock de sys.modules['groq']).

Exécution :
    venv\\Scripts\\python.exe _test_summarize_reviews.py
"""

import json
import sys
import types

# ---------------------------------------------------------------------------
# Fake module Groq inséré AVANT l'import de app (get_groq_client fait
# `from groq import Groq`, il récupérera donc le faux SDK).
# ---------------------------------------------------------------------------
class FakeMessage:
    def __init__(self, content):
        self.content = content

class FakeChoice:
    def __init__(self, content):
        self.message = FakeMessage(content)

class FakeResponse:
    def __init__(self, content):
        self.choices = [FakeChoice(content)]


# Réponses simulées du modèle (test du nettoyage ```json et du parsing)
MODEL_RESPONSES = {
    "mixed": (
        '```json\n{"pros": ["Qualité sonore excellente", "Bonne réduction de bruit"], '
        '"cons": ["Prix élevé", "Autonomie décevante"]}\n```'
    ),
    "all_positive": (
        '{"pros": ["Produit conforme", "Excellente qualité", "Bon service client"], "cons": []}'
    ),
    "invalid_json": "Je pense que ce produit est bien...",
    "wrong_structure": '{"pros": "pas une liste", "cons": []}',
}

captured = {}


class FakeCompletions:
    def __init__(self, client):
        self.client = client

    def create(self, **kwargs):
        # Enregistrer les paramètres de l'appel pour les assertions
        captured["model"] = kwargs.get("model")
        captured["messages"] = kwargs.get("messages", [])
        captured["stream"] = kwargs.get("stream")

        # Choisir la réponse simulée selon le contenu du prompt
        prompt = kwargs.get("messages", [{}])[0].get("content", "")
        if "Parfait, exactement comme décrit" in prompt:
            content = MODEL_RESPONSES["all_positive"]
        elif "casque" in prompt or "son" in prompt.lower():
            content = MODEL_RESPONSES["mixed"]
        elif "invalid" in prompt.lower():
            content = MODEL_RESPONSES["invalid_json"]
        else:
            content = MODEL_RESPONSES["wrong_structure"]

        return FakeResponse(content)


class FakeChat:
    def __init__(self, client):
        self.completions = FakeCompletions(client)


class FakeClient:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.chat = FakeChat(self)


fake_groq = types.ModuleType("groq")
fake_groq.Groq = FakeClient
sys.modules["groq"] = fake_groq

# ---------------------------------------------------------------------------
# Import de l'app (avec le fake SDK déjà en place)
# ---------------------------------------------------------------------------
import app  # noqa: E402

client = app.app.test_client()

# --- Test 1 : requête valide (avis mixtes) -> 200 + parsing des ```json ---
resp = client.post(
    "/ai/summarize-reviews",
    json={"reviews": [
        "Très bon son, la réduction de bruit est impressionnante.",
        "Le son est excellent mais le prix est élevé.",
        "Autonomie un peu décevante, tient à peine 15 heures.",
    ]},
)
body = resp.get_json()
print("TEST 1 STATUS:", resp.status_code)
print("TEST 1 BODY:", json.dumps(body, ensure_ascii=False))
assert resp.status_code == 200, resp.status_code
assert body == {
    "summary": {
        "pros": ["Qualité sonore excellente", "Bonne réduction de bruit"],
        "cons": ["Prix élevé", "Autonomie décevante"],
    }
}, body
assert captured["model"] == "llama-3.3-70b-versatile", captured.get("model")
assert captured["stream"] is False, captured.get("stream")
print("✅ TEST 1 OK : 200 + parsing JSON propre (balises ```json nettoyées)")
print()

# --- Test 2 : avis 100% positifs -> cons tableau vide ---
resp2 = client.post(
    "/ai/summarize-reviews",
    json={"reviews": [
        "Produit parfait, exactement comme décrit.",
        "Excellente qualité, je rachèterai.",
    ]},
)
body2 = resp2.get_json()
print("TEST 2 STATUS:", resp2.status_code)
print("TEST 2 BODY:", json.dumps(body2, ensure_ascii=False))
assert resp2.status_code == 200, resp2.status_code
assert body2["summary"]["cons"] == [], body2
print("✅ TEST 2 OK : cons est bien un tableau vide")
print()

# --- Test 3 : JSON invalide du modèle -> 500 avec le bon message ---
# On force une réponse non JSON en passant un avis contenant "invalid"
resp3 = client.post(
    "/ai/summarize-reviews",
    json={"reviews": ["invalid"]},
)
body3 = resp3.get_json()
print("TEST 3 STATUS:", resp3.status_code)
print("TEST 3 BODY:", json.dumps(body3, ensure_ascii=False))
assert resp3.status_code == 500, resp3.status_code
assert body3 == {"error": "Impossible de résumer les avis."}, body3
print("✅ TEST 3 OK : JSON invalide -> 500")
print()

# --- Test 4 : structure invalide (pros pas une liste) -> 500 ---
resp4 = client.post(
    "/ai/summarize-reviews",
    json={"reviews": ["wrong structure"]},
)
body4 = resp4.get_json()
print("TEST 4 STATUS:", resp4.status_code)
print("TEST 4 BODY:", json.dumps(body4, ensure_ascii=False))
assert resp4.status_code == 500, resp4.status_code
assert body4 == {"error": "Impossible de résumer les avis."}, body4
print("✅ TEST 4 OK : structure pros/cons invalide -> 500")
print()

# --- Test 5 : validation du body -> 400 (message exact du openapi.yaml) ---
invalid_bodies = [
    {},                                    # reviews absent
    {"reviews": "pas un tableau"},         # non tableau
    {"reviews": []},                       # tableau vide
    {"reviews": ["ok", ""]},               # élément vide
    {"reviews": ["ok", 123]},              # élément non string
    {"reviews": ["ok", "   "]},            # élément espaces
]
for i, bad_body in enumerate(invalid_bodies, start=1):
    resp_bad = client.post("/ai/summarize-reviews", json=bad_body)
    body_bad = resp_bad.get_json()
    assert resp_bad.status_code == 400, (i, resp_bad.status_code)
    assert body_bad == {
        "error": "Le champ 'reviews' doit être un tableau non vide."
    }, (i, body_bad)
    print(f"✅ TEST 5.{i} OK : body invalide -> 400")
print()

# --- Test 6 : le prompt envoyé à Groq contient bien les avis et les consignes ---
prompt = captured["messages"][0]["content"]
assert "## Format de réponse (STRICT)" in prompt
assert "pros" in prompt and "cons" in prompt
print("✅ TEST 6 OK : prompt Groq contient les consignes de format strict")
print()

print("🎉 TOUS LES TESTS SUMMARIZE-REVIEWS SONT PASSÉS")

