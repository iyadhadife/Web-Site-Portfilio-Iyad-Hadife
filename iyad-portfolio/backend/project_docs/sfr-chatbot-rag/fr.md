# Chatbot RAG interne du Lab SFR

**Contexte :** dernière semaine de mon stage chez SFR, Lab de Vélizy (août 2025)
**Rôle :** développement en autonomie, en quelques jours

## Objectif

Mettre à disposition du service un assistant capable de :

1. lire et comprendre un fichier PCAP ;
2. connaître les processus du Lab de Vélizy ;
3. expliquer les définitions simples du métier ;
4. répondre à des questions pratiques (par exemple, comment se rendre à la machine à café).

## Fonctionnement

Le chatbot suit une approche **RAG (Retrieval-Augmented Generation)** :

- recherche des passages pertinents dans une **base de données locale** ;
- enrichissement du contexte par du **scraping web** ;
- découpage des documents volumineux en *chunks* et injection du contexte le plus pertinent dans le prompt ;
- génération de la réponse par un LLM intégré via **LangChain** et **Hugging Face**, entièrement **en local**.

## Résultat

Le chatbot livré répondait aux besoins 2 à 4. La lecture de fichiers PCAP (besoin 1) restait à développer, faute de temps.

## Technologies

Python, LangChain, Hugging Face, RAG, scraping web
