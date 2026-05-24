import { test, expect } from '@playwright/test';
import { waitForLoad, ANNEE_TEST } from './helpers';

test.describe('Année scolaire', () => {
  test('charge la page et affiche l\'année active', async ({ page }) => {
    await page.goto('/annee-scolaire');
    await waitForLoad(page);
    // Le heading ou la card de l'année active doit contenir l'année
    await expect(page.locator('main').getByText(ANNEE_TEST).first()).toBeVisible();
  });

  test('affiche le pipeline des statuts', async ({ page }) => {
    await page.goto('/annee-scolaire');
    await waitForLoad(page);
    // Les 3 états du pipeline doivent être affichés dans main
    await expect(page.locator('main').getByText('Préparation').first()).toBeVisible();
    await expect(page.locator('main').getByText('Active').first()).toBeVisible();
    await expect(page.locator('main').getByText('Terminée').first()).toBeVisible();
  });

  test('la card "Année active" affiche des statistiques', async ({ page }) => {
    await page.goto('/annee-scolaire');
    await waitForLoad(page);
    // La card de l'année active doit afficher classes / élèves
    await expect(page.locator('main').getByText(/classe/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/élève/i).first()).toBeVisible();
  });

  test('le bouton de préparation d\'une année est présent', async ({ page }) => {
    await page.goto('/annee-scolaire');
    await waitForLoad(page);
    // Le bouton "+ Préparer une année" doit être visible
    await expect(page.getByRole('button', { name: /préparer/i })).toBeVisible();
  });
});
