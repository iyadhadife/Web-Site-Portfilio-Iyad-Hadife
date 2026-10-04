# Détection de pièces 3D par GNN sous CATIA

**Contexte :** stage de fin d'études chez Dassault Systèmes, Customer Strategic Partnership, Innovation Lab Transport & Mobilité (fév. – août 2026)
**Rôle :** amélioration et extension d'un pipeline existant, en collaboration

## Le problème

Dans une maquette numérique de véhicule, les ingénieurs réalisent à la main des mesures de contrôle entre pièces, par exemple l'espace entre les genoux du passager arrière et le dossier du siège avant (*Knee Clearance*). L'objectif était de faire reconnaître automatiquement les pièces concernées par un modèle de Machine Learning, puis de générer la mesure sans intervention manuelle.

<div class="confidential-note">

🔒 **Détails confidentiels.** La suite (méthode, contribution détaillée, résultats) concerne un projet interne de Dassault Systèmes et de son client : elle est volontairement floutée. [Contactez-moi](/contact) pour que je vous en parle plus en détail à l'oral.

</div>

<div class="confidential" aria-hidden="true">

## Qui a fait quoi

Le projet est un travail d'équipe :

- **Pilotage du projet :** un membre de l'équipe CSP T&M Innovation Lab.
- **Création du modèle GNN et des scripts d'extraction initiaux :** un expert de l'équipe CATIA Generative Experience, avec qui j'ai ensuite co-développé.
- **Ma contribution :** à mon arrivée, le pipeline n'avait été appliqué qu'à un seul véhicule. J'ai :
  - étendu l'extraction et l'entraînement à de **nouveaux modèles de véhicules** (labellisation, formatage, extraction, structuration en graphes) ;
  - constitué un **jeu de données d'entraînement** à partir de données internes et de données fournies par le client ;
  - corrigé les scripts d'extraction pour des **cas particuliers** non gérés sur certains véhicules ;
  - **retravaillé l'extraction des courbes** et ajouté le regroupement de surfaces ;
  - relancé et ajusté l'**entraînement du GNN** (hyperparamètres) ;
  - optimisé le **temps d'inférence** de bout en bout.

## Le pipeline

1. **Extraction des features sous CATIA Visual Scripting :** points (coordonnées), courbes (longueur, fermeture, planéité, extrémités, complexité de Douglas-Peucker), surfaces (bounding box, normale du plan moyen, sections projetées), solides (bounding box, nombre de domaines, aires projetées) et indicateurs de type. Le résultat est exporté en CSV.
2. **Conversion en graphe :** chaque entité géométrique devient un nœud. Une arête relie deux entités proches (seuil de distance) et porte le type d'interaction (par ex. point–surface).
3. **Augmentation de données :** rotations et translations aléatoires pendant l'entraînement, pour que le modèle apprenne la topologie plutôt que les coordonnées absolues.
4. **Mesure automatique :** un script CATIA récupère les points prédits et crée la cote 3D.

## Mes améliorations techniques

- **Courbes :** chaque courbe était discrétisée en 5 points, ce qui était redondant et ignorait sa longueur réelle. Je l'ai remplacée par une description globale : longueur, fermeture, planéité, points de départ et de fin, bounding box et complexité de Douglas-Peucker.
- **Regroupement des surfaces par continuité :** une première version en Python fusionnait à tort des surfaces non connectées. J'ai utilisé une fonction native de Visual Scripting basée sur les bordures, avec un traitement spécifique pour les surfaces superposées.
- **Robustesse :** gestionnaires d'erreurs avec valeurs par défaut, filtrage des entités non conformes renvoyées par certains nœuds (ex. *Extremum*).

## Résultats

- Temps d'inférence de bout en bout : **de 5–10 min à 3–7 min** selon la maquette.
- Graphes **2× plus légers**, loss **10× plus faible** ; précision et F1-score restés proches.
- Sur un nouveau véhicule, on est passé d'un modèle qui ne reconnaissait aucune pièce à un modèle qui les reconnaissait **approximativement** : la plupart des labels étaient exacts ou proches (toits intérieur/extérieur bien identifiés, mais la face extérieure des portes prise à la place de l'intérieure).
- Les métriques d'entraînement ont baissé par rapport à la version à un seul véhicule, mais le modèle généralise beaucoup mieux.
- Le projet a ensuite été **mis en stand-by** au profit d'une autre méthode, sans Machine Learning.

## Technologies

PyTorch, PyTorch Geometric, Python, CATIA Visual Scripting, CATIA Part Design, Generative Assembly, 3DEXPERIENCE, Git, Jira

> Le code et les données sont confidentiels (Dassault Systèmes et son client) et ne sont pas publiés.

</div>
