import { test, expect } from '@playwright/test';
import { waitForLoad, CLASSE_TEST, NIVEAU_TEST, API } from './helpers';

test.describe('Élèves — lecture', () => {
  test('affiche la liste des élèves', async ({ page }) => {
    await page.goto('/eleves');
    await waitForLoad(page);
    await expect(page.locator('.eleve-name').first()).toBeVisible();
  });

  test('la recherche filtre les résultats', async ({ page }) => {
    await page.goto('/eleves');
    await waitForLoad(page);

    // Récupérer le nom du premier élève affiché
    const firstName = await page.locator('.eleve-name').first().textContent();
    const prenom = firstName?.split(' ')[0] ?? '';

    await page.getByPlaceholder('Rechercher par nom ou prénom…').fill(prenom);
    await page.waitForTimeout(400); // debounce
    await expect(page.locator('.eleve-name').first()).toContainText(prenom);
  });

  test('cliquer sur un élève ouvre sa fiche', async ({ page }) => {
    await page.goto('/eleves');
    await waitForLoad(page);

    const firstName = await page.locator('.eleve-name').first().textContent();
    await page.locator('.eleve-name-link').first().click();
    await expect(page).toHaveURL(/\/eleves\/.+/);
    await waitForLoad(page);
    await expect(page.getByRole('heading').first()).toContainText(firstName!.trim());
  });
});

test.describe('Élèves — création et statuts', () => {
  let eleveId = '';

  test('crée un nouvel élève', async ({ page }) => {
    await page.goto('/eleves/nouveau');
    await waitForLoad(page);

    // 1. Remplir prénom et nom
    await page.getByPlaceholder('Ex : Jean').fill('TestE2E');
    await page.getByPlaceholder('Ex : Dupont').fill('Playwright');
    // 2. Date de naissance
    await page.locator('input[type="date"]').fill('2010-01-15');

    // 3. Sélectionner le niveau — attendre que les options soient chargées
    const niveauSelect = page.locator('.form-group').filter({ hasText: 'Niveau' }).locator('select');
    // Attendre qu'une option contenant "6ème" apparaisse
    await expect(niveauSelect).toContainText(NIVEAU_TEST, { timeout: 8_000 });
    await niveauSelect.selectOption(NIVEAU_TEST);
    // Vérifier que la sélection a bien eu lieu
    await expect(niveauSelect).toHaveValue(NIVEAU_TEST, { timeout: 3_000 });
    await page.waitForTimeout(500); // laisser React traiter l'event + ouvrir la popup

    // 4. Choisir la classe — attendre que la popup soit visible
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });
    // Attendre que la liste des classes soit chargée
    await expect(page.locator('.classe-popup-item-name').first()).toBeVisible({ timeout: 5_000 });
    // Sélectionner une classe non pleine (éviter classe-popup-item-warning = Complète)
    await page.locator('.classe-popup-item:not(.classe-popup-item-warning) .classe-popup-item-name')
      .filter({ hasText: CLASSE_TEST }).first().click();
    // Vérifier que la popup s'est fermée
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3_000 });
    await page.waitForTimeout(200);

    // 5. Remettre les valeurs si elles ont été effacées par le re-render
    await page.getByPlaceholder('Ex : Jean').fill('TestE2E');
    await page.getByPlaceholder('Ex : Dupont').fill('Playwright');

    // 6. Soumettre — après succès, redirection vers la fiche de l'élève
    await expect(page.getByRole('button', { name: "Inscrire l'élève" })).not.toBeDisabled({ timeout: 3_000 });
    await page.getByRole('button', { name: "Inscrire l'élève" }).click();
    // Redirection vers la fiche élève
    await expect(page).toHaveURL(/\/eleves\/.+/, { timeout: 8_000 });
    await waitForLoad(page);
    await expect(page.getByRole('heading').first()).toContainText('Playwright', { timeout: 5_000 });
  });

  test('exclure puis réintégrer l\'élève créé', async ({ page }) => {
    // Trouver l'ID de l'élève via l'API (la réponse a la clé "eleves", pas "items")
    const res = await page.request.get(`${API}/read/eleves?search=Playwright&limit=20`);
    const json = await res.json();
    const list: any[] = json.eleves ?? json.items ?? (Array.isArray(json) ? json : []);
    // Prendre le premier élève actif nommé "Playwright"
    const eleve = list.find((e: any) => e.nom === 'Playwright' && e.statut === 'actif');
    if (!eleve) test.skip();
    eleveId = eleve.id;

    await page.goto(`/eleves/${eleveId}`);
    await waitForLoad(page);

    // Exclure — cliquer sur le bouton d'action
    await page.locator('.statut-action-btn-danger').click();
    await page.locator('.form-group').filter({ hasText: "Raison de l'exclusion" }).locator('input').fill('Test E2E exclusion');
    await page.getByRole('button', { name: "Confirmer l'exclusion" }).click();
    // ConfirmDialog — bouton avec classe confirm-btn-confirm
    await page.locator('.confirm-btn-confirm').click();
    await expect(page.locator('.badge').filter({ hasText: 'Exclu' })).toBeVisible({ timeout: 5_000 });

    // Réintégrer — bouton dans la card statut
    await page.locator('.statut-annuler-btn').click();
    // ConfirmDialog
    await page.locator('.confirm-btn-confirm').click();
    await expect(page.locator('.badge').filter({ hasText: 'Actif' })).toBeVisible({ timeout: 5_000 });
  });

  test('marquer comme parti puis réintégrer l\'élève créé', async ({ page }) => {
    if (!eleveId) {
      const res = await page.request.get(`${API}/read/eleves?search=Playwright&limit=20`);
      const json = await res.json();
      const list: any[] = json.eleves ?? json.items ?? (Array.isArray(json) ? json : []);
      const eleve = list.find((e: any) => e.nom === 'Playwright' && e.statut === 'actif');
      if (!eleve) test.skip();
      eleveId = eleve.id;
    }

    await page.goto(`/eleves/${eleveId}`);
    await waitForLoad(page);

    // Vérifier que l'élève est bien actif avant de tenter l'action de départ
    // (le read model peut être en retard après la réintégration du test précédent)
    const btnWarning = page.locator('.statut-action-btn-warning');
    const isVisible = await btnWarning.isVisible();
    if (!isVisible) {
      await page.waitForTimeout(2000);
      await page.reload();
      await waitForLoad(page);
    }

    // Marquer comme parti
    await page.locator('.statut-action-btn-warning').click();
    await page.locator('.form-group').filter({ hasText: /^Raison \*/ }).locator('input').fill('Test E2E départ');
    await page.getByRole('button', { name: 'Confirmer le départ' }).click();
    // ConfirmDialog — bouton avec classe confirm-btn-confirm
    await page.locator('.confirm-btn-confirm').click();
    await expect(page.locator('.badge').filter({ hasText: "A quitté" })).toBeVisible({ timeout: 5_000 });

    // Réintégrer
    await page.locator('.statut-annuler-btn').click();
    await page.locator('.confirm-btn-confirm').click();
    await expect(page.locator('.badge').filter({ hasText: 'Actif' })).toBeVisible({ timeout: 5_000 });
  });

  test.afterAll(async ({ request }) => {
    // Nettoyage : supprimer l'élève créé
    if (eleveId) {
      await request.delete(`${API}/eleves/${eleveId}`);
    }
  });
});
