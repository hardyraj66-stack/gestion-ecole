import { test, expect } from '@playwright/test';
import { waitForLoad, CLASSE_TEST, API } from './helpers';

async function goToPlanningClasse(page: any) {
  await page.goto('/classes');
  await waitForLoad(page);
  const card = page.locator('.classe-card-inner').filter({ hasText: CLASSE_TEST });
  await card.getByRole('link', { name: 'Planning' }).click();
  await waitForLoad(page);
}

test.describe('Planning — lecture', () => {
  test('la grille du planning de 6ème A se charge', async ({ page }) => {
    await goToPlanningClasse(page);
    await expect(page.locator('.planning-table')).toBeVisible();
    // Les jours de la semaine sont affichés dans les headers
    await expect(page.locator('.planning-th-day').filter({ hasText: 'Lundi' })).toBeVisible();
    await expect(page.locator('.planning-th-day').filter({ hasText: 'Vendredi' })).toBeVisible();
  });

  test('des créneaux seedés sont visibles sur la grille', async ({ page }) => {
    await goToPlanningClasse(page);
    // Le seeder crée des créneaux, au moins un doit être visible
    await expect(page.locator('.pcb-title').first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Planning — création et undo/redo', () => {
  test('crée un créneau', async ({ page }) => {
    await goToPlanningClasse(page);

    // Attendre que les créneaux seedés soient visibles avant de compter
    await expect(page.locator('.pcb-title').first()).toBeVisible({ timeout: 8_000 });
    const countBefore = await page.locator('.pcb-title').count();

    // Cliquer sur la première cellule vide disponible
    const emptyCell = page.locator('.planning-cell-empty').first();
    await emptyCell.click();

    // Le modal de création doit s'ouvrir
    await expect(page.locator('.planning-modal')).toBeVisible({ timeout: 3_000 });

    // Sélectionner la première matière disponible (ignorer le placeholder)
    const matiereSelect = page.locator('.planning-modal select').first();
    await expect(matiereSelect).toContainText(/\w+/, { timeout: 5_000 });
    const options = await matiereSelect.locator('option').all();
    for (const opt of options) {
      const val = await opt.getAttribute('value');
      if (val && val !== '') {
        await matiereSelect.selectOption(val);
        break;
      }
    }

    // Créer
    const createBtn = page.locator('.planning-modal').getByRole('button', { name: 'Créer le créneau' });
    await expect(createBtn).toBeEnabled({ timeout: 3_000 });
    await createBtn.click();

    // Modal fermé — le créneau est ajouté
    await expect(page.locator('.planning-modal')).toHaveCount(0, { timeout: 3_000 });
    // Attendre que la grille se mette à jour (le créneau est ajouté localement dans le state React, pas via socket)
    await expect(page.locator('.pcb-title')).toHaveCount(countBefore + 1, { timeout: 5_000 });
  });

  test('supprime un créneau via le menu contextuel', async ({ page }) => {
    await goToPlanningClasse(page);

    const creneau = page.locator('.pcb-title').first();
    await expect(creneau).toBeVisible({ timeout: 8_000 });

    // Clic droit sur le créneau pour le menu contextuel
    const pcb = page.locator('.pcb').first();
    await pcb.click({ button: 'right' });

    await expect(page.locator('.planning-ctx-menu')).toBeVisible({ timeout: 2_000 });
    await page.locator('.planning-ctx-item-danger').click();

    // Confirmation dialog
    await page.getByRole('button', { name: 'Supprimer' }).click();
    await page.waitForTimeout(500);
  });
});
