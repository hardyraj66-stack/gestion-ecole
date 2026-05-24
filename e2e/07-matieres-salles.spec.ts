import { test, expect } from '@playwright/test';
import { waitForLoad, MATIERE_TEST, API } from './helpers';

test.describe('Matières', () => {
  test('affiche la liste des matières seedées', async ({ page }) => {
    await page.goto('/matieres');
    await waitForLoad(page);
    await expect(page.getByText(MATIERE_TEST).first()).toBeVisible();
    await expect(page.getByText('Français').first()).toBeVisible();
  });

  test('crée une matière puis la supprime', async ({ page }) => {
    const nom = `TestMat E2E ${Date.now()}`;
    await page.goto('/matieres/nouvelle');
    await waitForLoad(page);

    await page.locator('.form-group').filter({ hasText: 'Nom de la matière' }).locator('input').fill(nom);
    await page.locator('.form-group').filter({ hasText: /^Code \*/ }).locator('input').fill('TESTE2E');

    // Attendre que les coefficients de niveau se chargent (requis pour la création)
    await expect(page.locator('.matiere-coef-row').first()).toBeVisible({ timeout: 8_000 });

    await page.getByRole('button', { name: 'Créer la matière' }).click();
    await expect(page).toHaveURL('/matieres', { timeout: 8_000 });
    await waitForLoad(page);

    // Vérifier et nettoyer via API read
    const res = await page.request.get(`${API}/read/matieres?limit=100`);
    const json = await res.json();
    const matieres: any[] = json.items ?? [];
    const created = matieres.find((m: any) => m.nom === nom);
    expect(created).toBeTruthy();
    // Désactiver la matière créée (pas de DELETE disponible)
    if (created) await page.request.patch(`${API}/matieres/${created.id}/desactiver`);
  });
});

test.describe('Salles', () => {
  test('affiche la liste des salles seedées', async ({ page }) => {
    await page.goto('/salles');
    await waitForLoad(page);
    await expect(page.locator('.salle-card-title').filter({ hasText: 'Salle 101' })).toBeVisible();
    await expect(page.locator('.salle-card-title').filter({ hasText: 'Labo Physique' })).toBeVisible();
  });

  test('ouvrir le détail d\'une salle affiche la grille d\'occupation', async ({ page }) => {
    await page.goto('/salles');
    await waitForLoad(page);

    // Cliquer sur le bouton "Voir" de la première salle
    await page.locator('.salle-card-actions').first().getByRole('button', { name: 'Voir' }).click();
    // Le modal de détail doit s'ouvrir
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
    // Les jours doivent être affichés dans la grille
    await expect(page.locator('main, .modal-overlay').getByText('Lundi').first()).toBeVisible();
  });

  test('crée une salle puis la supprime', async ({ page }) => {
    const nom = `Salle E2E ${Date.now()}`;
    await page.goto('/salles/nouvelle');
    await waitForLoad(page);

    await page.getByPlaceholder('Ex : Salle A1').fill(nom);
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('20');

    await page.getByRole('button', { name: 'Créer la salle' }).click();
    await expect(page).toHaveURL('/salles', { timeout: 5_000 });
    await waitForLoad(page);

    // Nettoyage via API
    const res = await page.request.get(`${API}/read/salles?limit=100`);
    const json = await res.json();
    const created = (json.items ?? []).find((s: any) => s.nom === nom);
    expect(created).toBeTruthy();
    if (created) await page.request.delete(`${API}/salles/${created.id}`);
  });
});
