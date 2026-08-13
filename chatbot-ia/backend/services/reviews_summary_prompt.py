# -*- coding: utf-8 -*-
"""
Construction du prompt de résumé d'avis clients pour l'API Groq
(FonctionnalitéMoyenne #1674)

Ce module est utilisé par la route POST /ai/summarize-reviews (voir app.py).
Il fournit :
    - build_summary_prompt(reviews) : prompt système complet en français
      demandant à l'IA d'analyser une liste d'avis clients et d'extraire
      les points positifs (pros) et négatifs (cons) sous forme d'un JSON
      structuré.

Le format de réponse attendu est strict :
    {"pros": ["point 1", "point 2", ...], "cons": ["point 1", ...]}

Aucun texte avant/après le JSON n'est toléré (le parsing côté app.py
nettoiera tout de même les éventuelles balises ```json ... ```).

----------------------------------------------------------------------------
EXEMPLE INPUT/OUTPUT (attendu après appel à Groq) :

    Input (reviews) :
        [
            "Super produit, livraison rapide !",
            "Qualité excellente mais un peu cher",
            "Je recommande, très satisfait",
            "Le son est top mais les oreillettes serrent un peu"
        ]

    Output (JSON parsé) :
        {
            "pros": ["Qualité excellente", "Livraison rapide", "Bon son"],
            "cons": ["Prix élevé", "Oreillettes inconfortables"]
        }
----------------------------------------------------------------------------
"""


def build_summary_prompt(reviews):
    """
    Construire le prompt de résumé d'avis clients.

    Le prompt impose :
      - Le rôle : analyste d'avis clients e-commerce, objectif et synthétique
      - L'analyse : extraire les points positifs récurrents (pros) et négatifs
        (cons) à partir de la liste d'avis fournie
      - Le format de réponse : STRICTEMENT un objet JSON valide, sans aucun
        texte avant ou après, au format {"pros": [...], "cons": [...]}
      - Les contraintes : max 5 points par catégorie, reformulation concise
        (pas de citations mot pour mot), pas d'invention de points non
        présents dans les avis, tableau vide si aucune occurrence trouvée
      - La langue : réponse uniquement en français

    @param reviews: liste d'avis clients (liste de strings, non vide)
    @returns: le prompt complet à envoyer à l'API Groq
    """
    # Numéroter les avis pour que l'IA puisse s'y référer facilement
    numbered_reviews = "\n".join(
        f"{i+1}. {review}" for i, review in enumerate(reviews)
    )

    return "\n".join([
        "Tu es un analyste d'avis clients e-commerce, objectif et synthétique.",
        "",
        "## Mission",
        "Analyse la liste d'avis clients ci-dessous et extrait les points "
        "positifs récurrents (pros) et les points négatifs récurrents (cons).",
        "",
        "## Avis clients à analyser",
        numbered_reviews,
        "",
        "## Format de réponse (STRICT)",
        "Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant "
        "ni après, au format exact suivant :",
        '{"pros": ["point positif 1", "point positif 2", ...], '
        '"cons": ["point négatif 1", "point négatif 2", ...]}',
        "",
        "## Consignes détaillées",
        "- Maximum 5 points par catégorie (pros et cons).",
        "- Reformule les avis en points courts et synthétiques : ne cite pas "
        "mot pour mot les avis, résume-les.",
        "- Ne invente PAS de points qui ne sont pas présents dans les avis "
        "fournis. Si aucun point positif n'est trouvé, retourne un tableau "
        "vide pour pros. Idem pour cons.",
        "- Les points doivent refléter des tendances récurrentes, pas des "
        "cas isolés à moins qu'il n'y ait qu'un seul avis.",
        "- Sois précis et concret : évite les généralités vagues.",
        "",
        "## Exemple (hors sujet, pour illustrer le format)",
        '{"pros": ["Qualité excellente", "Livraison rapide"], '
        '"cons": ["Prix élevé", "Manque de tailles"]}',
        "",
        "## Langue",
        "Réponds en français."
    ])
