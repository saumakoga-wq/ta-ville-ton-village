# Ta Ville, Ton Village — version illustrée enrichie

Jeu de construction 2D en français, destiné à une utilisation individuelle sur ordinateur et tablette.

## Lancer le jeu sous Windows
1. Décompresser l'archive.
2. Dans VS Code, ouvrir le dossier `ta-ville-ton-village`.
3. Ouvrir le terminal intégré : `Terminal` > `Nouveau terminal`.
4. Exécuter `npm.cmd install` (nécessaire une seule fois).
5. Exécuter `npm.cmd run dev`.
6. Ouvrir `http://localhost:5173` dans le navigateur.

Si le serveur Vite tourne déjà, l'arrêter avec `Ctrl+C`, puis relancer `npm.cmd run dev`.

## Fonctions incluses
- Terrain isométrique 24 × 24 cases.
- Catalogue illustré : bâtiments disponibles en images et éléments avec représentation emoji de secours.
- Construction avec occupation de plusieurs cases, contrôle des collisions et rotation à 90°.
- Outil gomme pour retirer un bâtiment et récupérer son coût.
- Outils d'aménagement : routes et espaces verts case par case.
- Budget de départ de 100 000 €.
- Tableau d'objectifs et score indicatif sur 100 points.
- Sauvegarde automatique locale dans le navigateur.
- Export et import d'une ville au format JSON.
- Interface responsive et partie libre sans chronomètre.

## Limites actuelles
- Le score est une grille d'objectifs simple, non une évaluation pédagogique exhaustive.
- La sauvegarde est locale à l'appareil et au navigateur.
- Le mode équipe en temps réel, les codes de partie et l'espace animateur nécessitent un backend (par exemple Supabase) et ne sont pas activés dans cette version.
- Les bâtiments illustrés disponibles sont ceux fournis dans le dossier `src/assets`.

## Construire la version distribuable
`npm.cmd run build` crée le dossier `dist/`.


## Améliorations visuelles de cette version
- Fond panoramique avec ciel dégradé, soleil, nuages et collines.
- Végétation décorative autour du plateau pour renforcer l'ambiance de jeu de gestion.
- Chantiers représentés par une petite plateforme, des barrières, une grue, des matériaux et une barre de progression.
- Les grandes illustrations des bâtiments ne s'affichent plus en transparence pendant les travaux : elles apparaissent à la fin du chantier.

### Mise à jour
Remplace ton ancien dossier de projet par le contenu de cette archive (garde une copie de sécurité). Le dossier `node_modules` n'est pas fourni : dans le terminal du nouveau dossier, exécute `npm.cmd install`, puis `npm.cmd run dev`.

## Ajustement du terrain (version vérifiée)
- Le plateau conserve son ambiance de jeu vidéo (ciel, soleil, nuages et collines).
- Les arbres décoratifs extérieurs ont été retirés : les seuls arbres visibles sont ceux réellement construits depuis le catalogue.
- Le quadrillage des cases est masqué en mode Route, Espace vert et Gomme. Il apparaît en mode Construire.
- Au survol, un aperçu coloré montre toutes les cases que le bâtiment sélectionné va occuper : jaune si l'emplacement est disponible, rouge s'il est bloqué ou si le budget est insuffisant.
- Un bâtiment ne peut plus être posé sur une case déjà utilisée par une route ou un espace vert.
