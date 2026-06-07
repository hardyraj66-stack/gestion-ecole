import { test, expect } from '@playwright/test';

const routes = [
  '/dashboard',
  '/classes',
  '/eleves',
  '/matieres',
  '/salles',
  '/niveaux',
  '/professeurs',
  '/planning',
  '/notes',
  '/annee-scolaire',
];

for (const route of routes) {
  test(`${route} — la page se charge sans erreur fatale`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');

    expect(errors, `Erreurs JS sur ${route}: ${errors.join(', ')}`).toHaveLength(0);
    await expect(page.locator('body')).not.toBeEmpty();
  });
}
