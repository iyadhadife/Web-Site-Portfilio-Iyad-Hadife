# Détection d'anomalies réseau dans des fichiers PCAP

**Contexte :** stage Data Scientist / Data Engineer chez SFR, service « Tests PFS & Plateforme de Validation », Lab de Vélizy (15 avril – 29 août 2025)
**Rôle :** conception et développement du projet de bout en bout, encadré par mon manager et appuyé par un expert réseau qui générait les données

## Le problème

Au Lab de Vélizy (un réseau SFR miniature), les valideurs analysent à la main les logs et les fichiers **PCAP** produits par les équipements lors d'un appel, avant toute mise en production. Cette analyse est longue, et tous les fichiers ne peuvent pas être vérifiés. L'objectif était d'introduire l'IA pour répondre à trois questions : **y a-t-il une anomalie, laquelle, et sur quel équipement ?** Le projet est parti d'une feuille blanche, sans réflexion technique préalable.

## Outil 1 : classification du type d'anomalie

**Préparation des données :** PCAP → extraction avec **Tshark** → JSON → trois représentations :

- **Graphe** (nœuds = équipements, arêtes dirigées = messages) traité par un **GNN** (couches GAT et NNConv, message passing, global pooling, puis couches linéaires) ;
- **Séquence** de paquets traitée par un **RNN** (LSTM/GRU) ;
- **Vecteur global** obtenu avec un tokenizer (BERT, puis GPT-2) et traité par un **DNN**.

J'ai aussi testé des approches non supervisées (autoencodeurs, VAE, VAE sur graphe), mais elles plafonnaient vers 55 %.

**Montée en charge progressive :** 2, puis 6, 22 et enfin 40 classes d'anomalies, avec environ 100 PCAP par classe et un seul type de callflow.

**Résultats :**
- GNN : 100 % sur 2 et 6 classes, et environ **81 %** sur 40 classes, malgré un dataset incomplet et certaines classes presque vides.
- RNN : pas plus de 55 %, en dessous d'un DNN classique, car on ne disposait pas d'un label par paquet.
- L'outil de classification est **fonctionnel**.

## Outil 2 : localisation des anomalies (prototype)

Le dataset ne contenait presque que des erreurs en fin d'appel, ce qui rendait impossible un modèle supervisé de localisation. Le projet s'est donc tourné vers les LLM, en m'inspirant de l'article *LLMcap* (arXiv, 2024) :

1. découpage du PCAP en *chunks* ;
2. un **modèle de langage masqué (MLM)**, entraîné sur des appels **sans erreur**, reconstruit les parties masquées ;
3. un score d'erreur de reconstruction est calculé pour chaque chunk, puis un seuil sépare les chunks suspects.

Un petit MLM (moins d'un million de paramètres) a été entraîné pour tourner sur un serveur CPU. Les résultats s'affichent dans une **interface web Flask** qui surligne les zones suspectes et permet au valideur de laisser un retour pour constituer des données labellisées. Ce volet est resté **au stade de prototype**.

## Industrialisation et suite

- Code versionné sur **GitLab**, entraînements lancés via des pipelines **Jenkins** sur un serveur dédié.
- README rédigés pour mes successeurs.
- Deux présentations à la direction (mi-parcours et fin de stage). Le projet a été jugé pertinent pour de futurs investissements.

## Technologies

Python, PyTorch, PyTorch Geometric, PyTorch Geometric Temporal, Hugging Face (BERT, GPT-2), Tshark, Flask, scikit-learn, GitLab, Jenkins

> Le code source est confidentiel (SFR) et n'est pas publié.
