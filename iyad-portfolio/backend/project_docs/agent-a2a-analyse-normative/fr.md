# Agent IA d'analyse normative (Agent-to-Agent)

**Contexte :** stage de fin d'études chez Dassault Systèmes, Innovation Lab Transport & Mobilité (environ un mois et demi, en fin de stage)
**Rôle :** développement d'un orchestrateur, sous la direction de deux encadrants et avec l'appui de l'équipe Innovation Lab Japon

## Objectif

Démontrer à un partenaire industriel qu'un agent IA peut vérifier la conformité de rapports techniques (stockés dans un logiciel Dassault Systèmes) par rapport aux normes du client (stockées dans ses propres bases), et repérer les éléments manquants. L'enjeu stratégique était aussi de montrer que Dassault Systèmes maîtrise les architectures **Agent-to-Agent (A2A)** et sait faire collaborer ses agents avec ceux d'un client.

## Évolution du projet

- **Départ :** un agent unique appelant nos outils via des serveurs **MCP** (Model Context Protocol).
- **Pivot en cours de route :** passage à une architecture **A2A**, avec un orchestrateur fictivement placé côté client. Il appelle ses propres outils (simulés par de faux serveurs MCP « client ») et nos agents, qui gardent leurs outils natifs.

## Ce que j'ai fait

- Repris un template de projet partagé par l'équipe japonaise, puis je l'ai adapté au cas d'usage.
- Structuré l'agent selon l'architecture déclarative interne : un *app manager* expose l'API, des *factories* instancient agents et outils à partir d'un registre, et des *schemas* valident les entrées et sorties.
- Créé un orchestrateur, un serveur MCP et un outil d'OCR pour les PDF.
- Préparé des supports de présentation pour les points de suivi.

## Résultat (honnête)

Les résultats sont **mitigés** : la durée était courte, la stratégie a changé en cours de projet, les accès aux agents et aux LLM internes sont arrivés tard et les bibliothèques internes étaient peu documentées.

- **Livré :** un template d'orchestrateur connecté aux LLM internes.
- **Non réalisé pendant le stage :** la connexion A2A aux agents d'un client (aucun contrat signé à ce moment-là) et le déploiement en environnement Sandbox.

## Technologies

Python, LangChain, LangGraph, FastAPI, MCP, Agent-to-Agent, Mistral Medium, Git

> Projet interne et confidentiel : le code n'est pas publié.
