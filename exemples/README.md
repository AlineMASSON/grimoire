# Exemples

Deux fichiers pour découvrir le grimoire, ou pour voir à quoi ressemblent ses données. Les livres, les auteur·ices et les citations sont **inventés**.

| Fichier | Ce que c'est |
|---|---|
| [`grimoire-exemple.zip`](grimoire-exemple.zip) | une sauvegarde du grimoire : 8 livres avec leurs couvertures, lectures, sessions de lecture, citations, notes du carnet, achats et une revente |
| [`propositions-exemple.json`](propositions-exemple.json) | un fichier de propositions pour ces livres : genres, tropes, traducteur, rôle, date de parution, éditeur, résumé et couverture, et un livre audio à ajouter avec sa lecture, ses séances d'écoute et son achat |

## Essayer

Le plus simple : sur un grimoire vide, l'écran de bienvenue propose **Essayer avec l'exemple**. Le grimoire se remplit avec `grimoire-exemple.zip` en un toucher, et un bandeau rappelle que les livres sont inventés. **Commencer mon vrai grimoire** efface l'exemple et ramène à l'écran de bienvenue.

À la main :

1. Dans l'appli : ⚙️ Réglages → **📥 Importer un fichier** → `grimoire-exemple.zip` → **Restaurer**.
   **⚠️ Restaurer remplace tout le grimoire.** Fais-le sur un grimoire vide, ou dans un autre navigateur. Si tu as déjà tes livres, exporte d'abord une sauvegarde (⚙️ → 💾 Exporter).
2. Puis **📥 Importer un fichier** → `propositions-exemple.json`. L'appli montre chaque livre avec ses propositions cochées. Décoche ce que tu ne veux pas, puis **Appliquer**.

## La sauvegarde (`.zip`)

Un zip qui contient :

- `donnees.json` : toutes les données ;
- `photos/` : les images (couvertures prises en photo, photos de citations), une par fichier.

```json
{"format": "grimoire", "version": 1, "date": 1791268706494,
 "tables": {"livres": […], "lectures": […], "sessions": […], …},
 "photos": [{"id": "p:couverture-exemple-1", "type": "image/jpeg", "fichier": "photos/couverture-exemple-1.jpg"}]}
```

Chaque table est une liste d'objets avec un `id`. Les dates sont en millisecondes (`Date.now()`).

| Table | Contenu |
|---|---|
| `livres` | titre, `contributeurs` (`[{auteurId, role}]`, rôle `auteur`, `traduction`, `illustration`, `narration`, `preface` ou `autre`), `format` (`papier`, `numerique`, `audio`), `unite` (`pages`, `pourcent`, `secondes`, `episodes`), `total`, `genreIds`, `serieId` et `tome`, `possession` (`possede`, `envie`, `emprunte`, `revendu`), `couverture` (adresse `https://…` ou photo `p:…`), `parution` (`AAAA-MM-JJ`, `AAAA-MM` ou `AAAA`), éditeur, langue, résumé, ISBN, `revente` |
| `auteurs` | une personne (`nom`), quel que soit son rôle sur les livres |
| `lectures` | une lecture d'un livre : `statut` (`en_cours`, `pause`, `terminee`, `abandonnee`, `plusenvie`), `debut`, `fin`, `position`, `etoiles` |
| `sessions` | une séance de lecture : `debut`, `fin`, `dureeSec` (temps lu, pauses déduites), `position` atteinte |
| `citations` | `texte`, `page`, `type` (`citation`, `pensee`, `note`), `favori`, `photoId` |
| `achats` | `prix`, `devise`, `date`, `boutique`, `format`, `etat` (`neuf`, `occasion`), `cadeau` |
| `avis` | le carnet d'un livre (même `id` que le livre) : `notes` par critère (1 à 5), `humeurIds`, `tropeIds`, `mot` |
| `genres`, `tropes`, `humeurs`, `criteres`, `etageres`, `series` | les listes, modifiables dans ⚙️ → Mes listes |
| `objectifs` | les objectifs d'une année (`id` = l'année) : `livres`, `pages`, `heures` |
| `reglages` | `{id, v}` : thème, objectifs du jeu… Le code de liaison au Drive ne sort jamais du téléphone. |

## Les propositions (`.json`)

Des infos à ajouter à des livres **déjà dans le grimoire**, ou des livres à ajouter (`nouveau`). Rien n'est écrit avant d'avoir tout relu et touché **Appliquer**.

```json
{"format": "grimoire-propositions", "version": 1, "date": 1791288000000, "livres": [
 {"id": "exemple-3", "titre": "La Bibliothèque sous la mer",
  "genres": ["Fantasy", "Mystère"], "tropes": ["Créatures marines"],
  "traducteurs": ["Jeanne Ferrand"], "roles": [{"nom": "…", "role": "narration"}],
  "langue": "anglais", "source": "https://…", "confiance": "moyenne", "note": "…",
  "infos": {"parution": "2025-03-12", "editeur": "…", "isbn": "…", "langue": "Français", "resume": "…", "unite": "pages"},
  "couverture": {"image": "data:image/jpeg;base64,…", "source": "…"},
  "achats": [{"id": "…", "boutique": "…", "prix": 9.95, "date": "2025-02-01", "format": "audio", "etat": "neuf", "cadeau": false, "memo": "…"}],
  "revente": {"prix": 4, "date": "2025-06-01", "lieu": "…"}, "possession": "possede",
  "duree": 21600,
  "lectures": [{"id": "exemple-3:1", "statut": "abandonnee", "debut": "2025-01-05", "fin": "2025-01-20", "position": 5400}],
  "seances": [{"jour": "2025-01-05", "dureeSec": 2700, "position": 2700}]},
 {"titre": "Les Voix du marais", "nouveau": {"auteurs": ["Inès Morvan"], "format": "audio", "langue": "Français"},
  "duree": 21600, "lectures": [{"statut": "terminee", "debut": "2025-02-03", "fin": "2025-02-20"}]}
]}
```

- **`id`** : l'id du livre dans le grimoire. À défaut, le titre exact, s'il n'y a qu'un livre de ce titre.
- **`genres`** : la liste complète des genres qui conviennent. Ceux qui manquent sont ajoutés. Ceux que le livre a déjà sans être dans la liste sont proposés au retrait, mais restent tant qu'on ne les décoche pas.
- **`tropes`** : ajoutés au carnet du livre. Des tropes seuls ne font pas d'un livre un livre « noté ».
- **`traducteurs`** : ajoutés avec le rôle `traduction`. **`roles`** : change le rôle d'un nom déjà sur le livre, par exemple une narratrice enregistrée comme autrice.
- **`infos`** : proposées seulement si le livre ne les a pas déjà.
- **`couverture`** : une image `data:` est rangée dans le grimoire comme une photo (elle ne peut plus casser), une adresse `https://` est gardée telle quelle.
- **`achats`** : ajoutés s'ils manquent (un achat retrouvé par son `id` n'est que complété). Un achat met le livre dans la bibliothèque. **`revente`** : le livre passe « revendu » (jamais deux fois). **`possession`** : `possede`, `envie` ou `emprunte`.
- **`duree`** : la durée réelle d'un livre audio, en secondes. Le livre et ses lectures passent « comptés en durée » ; une lecture terminée l'est jusqu'au bout.
- **`lectures`** : avec l'`id` d'une lecture du livre, ce qui change (statut, dates `AAAA-MM-JJ`, position) ; sans `id`, une lecture à ajouter (pas si le livre en a déjà une avec le même statut et le même début).
- **`seances`** : des séances d'écoute, un jour à la fois (`jour`, `dureeSec`, `position`), rattachées à la lecture qui couvre ce jour. Une seule puce pour toutes ; un jour où le livre a déjà une séance n'est pas proposé. On ne connaît que le jour : elles ne comptent pas dans les heures de lecture.
- **`nouveau`** : un livre absent du grimoire, à créer (`auteurs`, `format`, `langue`, `editeur`). S'il existe déjà un livre de ce titre, c'est lui qui est complété.
- Appliquer deux fois le même fichier ne crée rien en double.
- **`date`** : les choix (puces décochées) sont retenus pour un même fichier, même si on le rouvre plus tard.
- Tous les champs sont facultatifs, sauf `id` (ou `titre`, ou `titre` et `nouveau` pour un livre à ajouter).

Pour faire écrire ce fichier par Claude : ⚙️ → **✨ Compléter avec Claude** prépare la demande, avec la consigne [`prompt-propositions.md`](../prompt-propositions.md).
