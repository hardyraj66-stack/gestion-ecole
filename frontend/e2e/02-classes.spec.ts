import { test, expect } from '@playwright/test';
import { waitForLoad, CLASSE_TEST, NIVEAU_TEST, API } from './helpers';

test.describe('Classes — lecture', () => {
  test('affiche la grille des classes', async ({ page }) => {
    await page.goto('/classes');
    await waitForLoad(page);
    await expect(page.locator('.classe-card-title').first()).toBeVisible();
  });

  test('filtre par niveau "6ème" affiche uniquement les classes 6ème', async ({ page }) => {
    await page.goto('/classes');
    await waitForLoad(page);

    await page.locator('.niveau-filter-btn').filter({ hasText: '6ème' }).click();
    await expect(page.locator('.classe-card-title').filter({ hasText: '6ème' }).first()).toBeVisible();
    // Aucune classe d'un autre niveau ne doit apparaître
    await expect(page.locator('.classe-card-title').filter({ hasText: '5ème' })).toHaveCount(0);
  });

  test('bouton Élèves navigue vers la page élèves de la classe', async ({ page }) => {
    await page.goto('/classes');
    await waitForLoad(page);

    const card = page.locator('.classe-card-inner').filter({ hasText: CLASSE_TEST });
    await card.getByRole('link', { name: 'Élèves' }).click();
    await expect(page).toHaveURL(/\/classes\/.+\/eleves/);
  });

  test('bouton Planning navigue vers la page planning de la classe', async ({ page }) => {
    await page.goto('/classes');
    await waitForLoad(page);

    const card = page.locator('.classe-card-inner').filter({ hasText: CLASSE_TEST });
    await card.getByRole('link', { name: 'Planning' }).click();
    await expect(page).toHaveURL(/\/classes\/.+\/planning/);
  });
});

test.describe('Classes — écriture', () => {
  test('crée une classe en mode salle fixe puis la supprime', async ({ page }) => {
    // Nettoyer les classes E2E laissées par des runs précédents
    const cleanRes = await page.request.get(`${API}/read/classes?limit=100`);
    const cleanJson = await cleanRes.json();
    const stale = (cleanJson.items ?? []).filter((c: any) => /^E2E Fixe/.test(c.nom));
    for (const c of stale) { await page.request.patch(`${API}/classes/${c.id}/desactiver`); }

    const nom = `E2E Fixe ${Date.now()}`;
    await page.goto('/classes/nouvelle');
    await waitForLoad(page);

    await page.locator('.form-group').filter({ hasText: 'Nom de la classe' }).locator('input').fill(nom);
    // Réduire la capacité à 20 pour éviter le ConfirmDialog "Capacité supérieure"
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('20');
    // Attendre que les salles soient chargées
    await expect(page.getByRole('button', { name: 'Créer la classe' })).not.toBeDisabled({ timeout: 10_000 });

    // Sélectionner "Labo Physique" — salle jamais utilisée par les tests E2E ni par les classes seedées fixes
    const salleSelect = page.locator('.form-group').filter({ hasText: 'Salle assignée' }).locator('select');
    await expect(salleSelect.locator('option').filter({ hasText: 'Labo Physique' })).toHaveCount(1, { timeout: 5_000 });
    const labOption = salleSelect.locator('option').filter({ hasText: 'Labo Physique' });
    const labValue = await labOption.getAttribute('value');
    if (labValue) await salleSelect.selectOption(labValue);
    await page.getByRole('button', { name: 'Créer la classe' }).click();

    // Redirection vers /classes
    await expect(page).toHaveURL('/classes', { timeout: 8_000 });
    await waitForLoad(page);
    // Vérifier via API read que la classe a bien été créée
    const res = await page.request.get(`${API}/read/classes?limit=100`);
    const json = await res.json();
    const created = (json.items ?? []).find((c: any) => c.nom === nom);
    expect(created).toBeTruthy();
    // Nettoyage
    if (created) await page.request.patch(`${API}/classes/${created.id}/desactiver`);
  });

  test('crée une classe en mode salle variable (sans sélection de salle)', async ({ page }) => {
    const nom = `E2E Variable ${Date.now()}`;
    await page.goto('/classes/nouvelle');
    await waitForLoad(page);

    await page.locator('.form-group').filter({ hasText: 'Nom de la classe' }).locator('input').fill(nom);
    await page.locator('.form-group').filter({ hasText: 'Mode de salle' }).locator('select').selectOption('variable');
    // Le sélecteur de salle ne doit pas être visible
    await expect(page.locator('.form-group').filter({ hasText: 'Salle assignée' })).toHaveCount(0);
    // Bouton enabled en mode variable (pas besoin de salle)
    await expect(page.getByRole('button', { name: 'Créer la classe' })).not.toBeDisabled({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Créer la classe' }).click();
    // Redirige vers la liste des classes
    await expect(page).toHaveURL('/classes', { timeout: 5_000 });
    await waitForLoad(page);
    // Vérifier via API read que la classe a bien été créée
    const res = await page.request.get(`${API}/read/classes?limit=100`);
    const json = await res.json();
    const created = (json.items ?? []).find((c: any) => c.nom === nom);
    expect(created).toBeTruthy();
    // Nettoyage
    if (created) await page.request.patch(`${API}/classes/${created.id}/desactiver`);
  });

  test('modifie la capacité d\'une classe en mode variable via le modal', async ({ page }) => {
    await page.goto('/classes');
    await waitForLoad(page);

    // Trouver une classe en mode variable (pas de conflit de salle)
    const card = page.locator('.classe-card-inner').filter({ hasText: '4ème A' });
    await card.getByRole('button', { name: '✎' }).click();

    // Le modal s'ouvre
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
    // Lire la capacité actuelle
    const capaciteInput = page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input');
    const valeurActuelle = await capaciteInput.inputValue();
    const nouvelleValeur = valeurActuelle === '28' ? '29' : '28';

    await capaciteInput.fill('');
    await capaciteInput.fill(nouvelleValeur);
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Modal fermé
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 10_000 });
    // Valeur mise à jour
    await expect(card.locator('.classe-card-capacity-value')).toContainText(`/ ${nouvelleValeur}`, { timeout: 5_000 });

    // Rétablir
    await card.getByRole('button', { name: '✎' }).click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('');
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill(valeurActuelle);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 10_000 });
  });
});
