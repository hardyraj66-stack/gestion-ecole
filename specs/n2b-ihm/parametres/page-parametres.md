<a id="PAGE-PAR-001"></a>
# Paramètres

> **Couche** : N2b — QUOI écrans (page : Paramètres)
> **Acteur concerné** : Tout utilisateur
> **UC sous-jacents** : —
> **Type de page** : Formulaire de préférences
> **Route** : `/parametres`
> **Stockage** : IndexedDB via `settingsDB.ts` (persistance locale, pas de backend)
> **Ce fichier contient** : sections de paramètres, options disponibles
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Section — Apparence

| Paramètre | Options | Description |
|-----------|---------|-------------|
| Thème | Clair / Sombre | Bascule le mode dark/light via classe CSS `dark` sur `<html>` |
| Couleur d'accent | 6 couleurs prédéfinies | Modifie la couleur principale de l'interface (blue, green, purple, orange, red, pink) |

---

## Section — Langue

| Paramètre | Options | Description |
|-----------|---------|-------------|
| Langue | Français / English / Malagasy | Bascule la langue de toute l'interface via `react-i18next` |

---

## Persistance

Les préférences sont sauvegardées dans IndexedDB (base `settingsDB`) et rechargées automatiquement à chaque démarrage de l'application. Aucun appel API n'est nécessaire.

---

## Application des paramètres

- **Thème** : classe `dark` ajoutée ou retirée sur `document.documentElement`
- **Couleur d'accent** : variables CSS `--color-primary` mises à jour
- **Langue** : `i18n.changeLanguage(lang)` de react-i18next
