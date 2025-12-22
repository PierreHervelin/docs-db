# /check-md

Vérifie tous les fichiers markdown non commités (modifiés mais non commités dans git) pour :

- Duplications de principes ou sections (ex : AGENTS.md, constitution)
- Artefacts ou sections interdites (emojis, ...existing code..., etc.)
- Respect strict de l’ordre et de la structure des principes
- Conformité à AGENTS.md et à la constitution (présence, ordre, unicité, etc.)

Pour chaque anomalie, liste :
- Le fichier
- La ligne
- La règle violée

Si tout est conforme, indique-le explicitement.

Ce contrôle doit être exhaustif, professionnel, et s’appliquer à chaque modification de fichier markdown critique.

---

**Rappel : Ce prompt est destiné à être utilisé comme commande IA (/check-md) pour garantir la qualité et la conformité des fichiers markdown du projet.**
