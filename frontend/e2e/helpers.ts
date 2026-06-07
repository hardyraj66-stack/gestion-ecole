import { Page } from '@playwright/test';

export const API = 'http://localhost:3000';

// Données seedées connues
export const CLASSE_TEST = '6ème A';
export const NIVEAU_TEST = '6ème';
export const MATIERE_TEST = 'Mathématiques';
export const MATIERE_CODE = 'MATH';
export const ANNEE_TEST = '2024-2025';

/** Attend que le loader disparaisse et que la page soit stable */
export async function waitForLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  // Attendre que le spinner de page disparaisse s'il est présent
  const loader = page.locator('.page-loader');
  if (await loader.isVisible()) {
    await loader.waitFor({ state: 'hidden', timeout: 30_000 });
  }
}

/**
 * Sélectionne une classe via le NiveauClassePopover.
 * Cliquer sur le bouton niveau-filter-btn → sélectionner le niveau → sélectionner la classe.
 */
export async function selectNiveauClasse(page: Page, niveau: string, classeNom: string) {
  // Ouvrir le popover de niveau
  await page.locator('.niveau-filter-btn').click();
  // Cliquer sur le bon niveau dans la liste
  await page.locator('.niveau-popover-item').filter({ hasText: niveau }).click();
  // Attendre le popover classes et cliquer sur la première classe correspondante
  await page.locator('.classes-popover-item').filter({ hasText: classeNom }).first().click();
}

/**
 * Cherche une matière par son nom dans le SearchInputSuggestions.
 * Suppose qu'un seul SearchInputSuggestions est visible sur la page.
 */
export async function selectMatiere(page: Page, matiereNom: string) {
  const input = page.locator('input[placeholder="Rechercher une matière…"]');
  await input.fill(matiereNom);
  // Attendre la suggestion et cliquer
  await page.locator('.search-suggestions-list .search-suggestion-item').filter({ hasText: matiereNom }).first().click();
}
