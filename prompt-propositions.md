# Mon grimoire de lectures : compléter genres, tropes et traducteurs

Tu m'aides à compléter les fiches des livres de mon appli de lectures « Mon grimoire ».
Plus bas, après cette consigne, tu trouveras **mes listes de genres et de tropes** et **les livres à compléter** (un tableau JSON).

Pour chaque livre, cherche sur internet : Babelio, Goodreads, Booknode, le site de l'éditeur, Decitre, Fnac, Audible.fr, catalogue.bnf.fr, Wikipédia…
**N'invente rien.** Si tu ne trouves pas, laisse vide, mets `confiance` à `faible` et dis-le dans `note`.

## 1. Genres (1 à 4 par livre, du plus important au moins important)

- Reprends **en priorité les libellés de « Mes genres », écrits exactement pareil**.
- N'invente un nouveau genre (court, en français) que si aucun ne convient vraiment.
- Donne la liste complète des genres qui conviennent, y compris ceux que le livre a déjà (`genres`) s'ils sont justes. Un genre déjà présent que tu ne reprends pas me sera proposé au retrait.
- Pas de pays, pas de format (audio, poche…), ni de « Roman » ou « Fiction » (trop général).

## 2. Tropes (0 à 5 par livre, seulement ceux vraiment marquants)

- Reprends **en priorité les libellés de « Mes tropes », écrits exactement pareil**.
- N'invente un nouveau trope (court, en français, dans le même style) que si un trope majeur du livre manque.
- **Je n'ai pas encore lu ces livres : ne divulgâche rien.** Pas de trope qui dévoile la fin ou un rebondissement (« Retournement final », « Narrateur·ice peu fiable »…) sauf s'il est annoncé dans la quatrième de couverture. Même règle pour `note`.

## 3. Traduction

- `traduit` : le livre que j'ai (éditeur, ISBN et format donnés) est-il une traduction en français ?
- Si oui :
  - `langue` : la langue d'origine (« anglais », « danois »…) ;
  - `traducteurs` : le ou les noms des traducteur·ices **de cette édition française** (un livre audio reprend en général la traduction de l'édition papier : vérifie) ;
  - `source` : une adresse qui montre ce nom.
- Ne remets pas un traducteur déjà dans `traducteurs` du livre.
- `roles` : si un nom de `auteurs` n'est pas un·e auteur·ice mais un traducteur, un illustrateur ou un narrateur, indique-le : `[{"nom": "…", "role": "traduction"}]`. Rôles possibles : `traduction`, `illustration`, `narration`, `preface`, `autre`.

## Ta réponse

Réponds par **un seul bloc de code JSON**, exactement dans ce format, avec la date donnée plus bas :

```json
{"format": "grimoire-propositions", "version": 1, "date": 1234567890123, "livres": [
 {"id": "id reçu, inchangé", "titre": "titre reçu", "genres": ["…"], "tropes": ["…"], "traducteurs": [], "roles": [],
  "langue": "", "source": "", "confiance": "haute", "note": ""}
]}
```

- Un objet par livre reçu, dans le même ordre, avec **le même `id`**.
- `langue`, `traducteurs` et `source` seulement pour un livre traduit (sinon vides).
- `confiance` : `haute`, `moyenne` ou `faible`.
- `note` : courte, en français, seulement si elle m'aide à décider (pourquoi moyenne ou faible, deux traductions possibles…).
- Le JSON doit être valide : guillemets droits, pas de commentaire, pas de virgule en trop.
- Si tu peux créer un fichier, donne-le aussi en téléchargement sous le nom `grimoire-propositions.json`.
- S'il y a beaucoup de livres, tu peux répondre en plusieurs fois : chaque bloc doit être complet et valide, avec ses livres.

Termine par une phrase pour moi : « Copie le bloc JSON, puis dans le grimoire : ⚙️ → **Coller la réponse de Claude**. »
