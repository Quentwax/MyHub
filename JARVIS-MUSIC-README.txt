J.A.R.V.I.S MUSIC — PREMIÈRE VERSION

INSTALLATION
1. Fais une copie de sauvegarde de ton dossier MyHub actuel.
2. Remplace les fichiers index.html, script.js et style.css par ceux de cette archive.
3. Ajoute music-library.js à la racine du dossier MyHub.
4. Ouvre MyHub depuis ton serveur habituel ou GitHub Pages.
5. Dans la barre latérale, ouvre « JARVIS Music » puis « Ajouter des musiques ».

FONCTIONS DISPONIBLES
- Import de plusieurs fichiers audio à la fois.
- Stockage persistant dans IndexedDB sur le navigateur actuel.
- Lecture, pause, précédent, suivant, volume et progression.
- Recherche dans la bibliothèque.
- Favoris locaux.
- Suppression d'un titre.

LIMITES DE CETTE PREMIÈRE ÉTAPE
- Les fichiers audio ne sont pas envoyés à Firebase ni sur un serveur.
- La bibliothèque est propre au navigateur et à l'appareil utilisés.
- Effacer les données du site dans le navigateur peut effacer la bibliothèque.
- Taille maximale par fichier : 50 Mo.
- La commande vocale JARVIS n'est pas encore reliée au nouveau lecteur. Une API JavaScript window.JarvisMusic est exposée pour la prochaine étape.
- Le widget Spotify existant est conservé pour ne pas casser l'ancien système pendant la transition.

PROCHAINE ÉTAPE
Tester l'import et la lecture, puis relier les commandes vocales de JARVIS. Ensuite, choisir un stockage cloud privé si tu souhaites retrouver les mêmes fichiers sur plusieurs appareils. Firebase Storage peut nécessiter l'activation du forfait Blaze : vérifier les conditions et les coûts avant activation.
