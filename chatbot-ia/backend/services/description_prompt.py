# -*- coding: utf-8 -*-
"""
Construction du prompt de génération de description produit pour l'API Groq
(FonctionnalitéMoyenne #1672)

Ce module est utilisé par la route POST /ai/generate-description (voir app.py).
Il fournit :
    - build_description_prompt(name, category, tags) : prompt système complet en
      français demandant une description marketing e-commerce courte et
      percutante (2-3 phrases), sans jamais inventer de caractéristiques
      techniques non fournies.

Le ton demandé est cohérent avec celui déjà défini pour le chat dans
chatbot_prompt.py : courtois, professionnel, orienté conversion sans être
insistant.

----------------------------------------------------------------------------
EXEMPLE INPUT/OUTPUT (attendu après appel à Groq) :

    Input  : name="Casque Gaming Pro RGB", category="audio",
             tags=["gaming", "rgb", "7.1 surround"]
    Output : "Plongez dans l'action avec le Casque Gaming Pro RGB. Son
              immersif 7.1 et éclairage RGB personnalisable pour une
              expérience gaming ultime."
----------------------------------------------------------------------------
"""


def build_description_prompt(name, category, tags):
    """
    Construire le prompt de génération de description produit.

    Le prompt impose :
      - Le rôle : rédacteur marketing e-commerce professionnel et courtois
      - La longueur cible : 2-3 phrases courtes et percutantes
      - Le contenu : intégrer naturellement le nom, la catégorie et les tags
        fournis, uniquement sur la base des informations données
      - La limite : ne JAMAIS inventer de caractéristiques techniques non
        fournies (pas de spécifications, matériaux, dimensions, etc.)
      - La langue : réponse uniquement en français, sans commentaire ajouté

    @param name: nom du produit (string non vide)
    @param category: catégorie du produit (string non vide)
    @param tags: liste de tags/mots-clés du produit (list de strings, [] par défaut)
    @returns: le prompt complet à envoyer à l'API Groq
    """
    # Formatage des tags pour les insérer lisiblement dans le prompt
    tags_text = ", ".join(tags) if tags else "aucun"

    return "\n".join([
        "Tu es un rédacteur marketing e-commerce professionnel et courtois pour notre boutique en ligne.",
        "",
        "## Mission",
        "Rédige une description produit courte, percutante et orientée conversion "
        "pour la fiche produit suivante. Le ton doit être professionnel et "
        "attrayant, sans être insistant ni trop commercial.",
        "",
        "## Informations produit (utilise UNIQUEMENT celles-ci)",
        "- Nom : {name}".format(name=name),
        "- Catégorie : {category}".format(category=category),
        "- Tags / mots-clés : {tags_text}".format(tags_text=tags_text),
        "",
        "## Consignes",
        "- Rédige en français, en 2 à 3 phrases courtes et percutantes.",
        "- Intègre naturellement le nom du produit, sa catégorie et les tags fournis.",
        "- Reste strictement dans les informations données : ne JAMAIS inventer "
        "de caractéristiques techniques, de matériaux, de dimensions, de "
        "performances ou d'avantages non mentionnés dans les informations produit.",
        "- Termine par une accroche orientée vers l'achat, sans pression commerciale.",
        "",
        "## Format de réponse",
        "Réponds uniquement avec la description rédigée, sans titre, sans "
        "commentaire et sans guillemets autour du texte."
    ])

