import { test, expect } from '@playwright/test';
import { waitForLoad, ANNEE_TEST } from './helpers';

test.describe('Dashboard', () => {
  test('affiche les 4 StatCards avec des valeurs non nulles', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoad(page);

    // 4 stat cards doivent être présentes
    const cards = page.locator('.stat-card');
    await expect(cards).toHaveCount(4);

    // Chaque stat-value doit afficher un nombre > 0
    for (const card of await cards.all()) {
      const value = await card.locator('.stat-value').textContent();
      expect(Number(value?.replace(/\D/g, ''))).toBeGreaterThan(0);
    }
  });

  test('affiche le titre "Classes" dans les StatCards', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoad(page);
    await expect(page.locator('.stat-title').filter({ hasText: 'Classes' })).toBeVisible();
    await expect(page.locator('.stat-title').filter({ hasText: 'Élèves' })).toBeVisible();
    await expect(page.locator('.stat-title').filter({ hasText: 'Matières' })).toBeVisible();
  });

  test('affiche le tableau des classes avec au moins une entrée', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoad(page);
    // Le tableau de classes doit avoir au moins une ligne
    const rows = page.locator('.dashboard-grid table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('les Quick Actions pointent vers les bonnes routes', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoad(page);

    await expect(page.locator('a.quick-action[href="/classes/nouvelle"]')).toBeVisible();
    await expect(page.locator('a.quick-action[href="/eleves/nouveau"]')).toBeVisible();
    await expect(page.locator('a.quick-action[href="/notes"]')).toBeVisible();
  });

  test("affiche l'année scolaire active dans l'en-tête", async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoad(page);
    await expect(page.locator('main').getByText(ANNEE_TEST).first()).toBeVisible();
  });
});
