import { test, expect } from '@playwright/test';
import { waitForLoad, API } from './helpers';

test.describe('Professeurs', () => {
  test('affiche la page des professeurs', async ({ page }) => {
    await page.goto('/professeurs');
    await waitForLoad(page);
    // La page doit charger (h1 ou bouton ajout présent)
    await expect(page.locator('main h1, main h2').first()).toBeVisible();
  });

  test('crée un professeur, le désactive, le réactive, puis le supprime', async ({ page }) => {
    const email = `e2e.test.${Date.now()}@test.com`;
    await page.goto('/professeurs');
    await waitForLoad(page);

    // Ouvrir le formulaire de création (bouton "+" ou "Nouveau professeur")
    await page.getByRole('button', { name: /nouveau|ajouter|\+/i }).first().click();

    const modal = page.locator('.modal-overlay');
    await modal.locator('.form-group').filter({ hasText: /^Nom \*/ }).locator('input').fill('ProfE2E');
    await modal.locator('.form-group').filter({ hasText: /^Prénom \*/ }).locator('input').fill('Test');
    await modal.locator('.form-group').filter({ hasText: /^Email/ }).locator('input').fill(email);
    await modal.locator('.form-group').filter({ hasText: /^Téléphone/ }).locator('input').fill('0600000000');

    // Le bouton de soumission du formulaire dans le modal
    await page.locator('.modal-overlay').getByRole('button', { name: /créer/i }).click();

    // Attendre que le modal ferme et que la liste se mette à jour via socket
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 5_000 });
    await waitForLoad(page);

    // Vérifier qu'il apparaît dans la liste avec badge "Actif"
    const profRow = page.locator('tr, .eleve-info').filter({ hasText: 'ProfE2E' });
    await expect(profRow.first()).toBeVisible({ timeout: 10_000 });
    await expect(profRow.first().locator('.badge').filter({ hasText: 'Actif' })).toBeVisible();

    // Trouver l'ID via API pour le nettoyage
    const res = await page.request.get(`${API}/read/professeurs?limit=100`);
    const json = await res.json();
    const profs: any[] = json.items ?? [];
    const prof = profs.find((p: any) => p.email === email);
    if (!prof) return;

    // Désactiver via API
    const desacRes = await page.request.patch(`${API}/professeurs/${prof.id}/desactiver`);
    expect(desacRes.ok()).toBeTruthy();
    // Vérifier via API que le statut est bien "inactif"
    const checkRes = await page.request.get(`${API}/read/professeurs/${prof.id}`);
    const profData = await checkRes.json();
    // La réponse a la structure { professeur: {...statut...}, assignments: [...] }
    expect(profData.professeur?.statut ?? profData.statut).toBe('inactif');

    // Réactiver via API
    const activRes = await page.request.patch(`${API}/professeurs/${prof.id}/activer`);
    expect(activRes.ok()).toBeTruthy();
    const checkRes2 = await page.request.get(`${API}/read/professeurs/${prof.id}`);
    const profData2 = await checkRes2.json();
    expect(profData2.professeur?.statut ?? profData2.statut).toBe('actif');

    // Nettoyage
    await page.request.delete(`${API}/professeurs/${prof.id}`);
  });
});
