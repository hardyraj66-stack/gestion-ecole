import { test, expect } from '@playwright/test';
import { waitForLoad, MATIERE_TEST, API } from './helpers';

/**
 * Chaîne principale : création de notes via API → vérification dans l'UI (notes page + bulletin).
 *
 * Élève cible : Paul Bertrand (6ème A 2024-2025) — aucune note MATH dans les données seedées.
 * Notes créées : T1=15, T2=13, T3=11
 */

const NOTE_T1 = '15';
const NOTE_T2 = '13';
const NOTE_T3 = '11';

let ELEVE_ID = '';  // résolu dynamiquement dans beforeAll

let mathMatiereId = '';
let createdNoteIds: string[] = [];

test.describe('Notes et Bulletin — saisie 3 trimestres', () => {
  test.beforeAll(async ({ request }) => {
    // Récupérer l'ID de la matière Mathématiques
    const notesPageRes = await request.get(`${API}/read/notes`);
    const notesPageJson = await notesPageRes.json();
    const matieres: any[] = notesPageJson.matieres ?? [];
    const math = matieres.find((m: any) => m.nom === MATIERE_TEST);
    if (!math) throw new Error('Matière Mathématiques introuvable');
    mathMatiereId = math.id ?? math._id;

    // Trouver Paul Bertrand dynamiquement (l'ID peut changer après re-seed)
    const elevesRes = await request.get(`${API}/read/eleves?search=Bertrand&limit=20`);
    const elevesJson = await elevesRes.json();
    const elevesList: any[] = elevesJson.eleves ?? elevesJson.items ?? [];
    const paulBertrand = elevesList.find((e: any) => e.prenom === 'Paul' && e.nom === 'Bertrand' && e.statut === 'actif');
    if (!paulBertrand) throw new Error('Élève Paul Bertrand introuvable');
    ELEVE_ID = paulBertrand.id ?? paulBertrand._id;

    // Annuler les éventuelles notes MATH de Paul Bertrand (si test re-run)
    const allNotes: any[] = notesPageJson.notes ?? [];
    const existing = allNotes.filter((n: any) => n.eleve_id === ELEVE_ID && n.matiere_id === mathMatiereId);
    for (const n of existing) {
      await request.patch(`${API}/notes/${n.id}/annuler`);
    }
    if (existing.length > 0) {
      // Attendre le rebuild après les annulations
      await new Promise(r => setTimeout(r, 3000));
    }

    // Créer les 3 notes via API
    const today = new Date().toISOString().split('T')[0];
    createdNoteIds = [];
    for (const [trimestre, valeur] of [[1, parseInt(NOTE_T1)], [2, parseInt(NOTE_T2)], [3, parseInt(NOTE_T3)]]) {
      const res = await request.post(`${API}/notes`, {
        data: { eleve_id: ELEVE_ID, matiere_id: mathMatiereId, valeur, trimestre, date: today },
      });
      const json = await res.json();
      const id = json.id ?? json._id;
      if (id) createdNoteIds.push(id);
    }

    // Attendre que le view builder rebuild les notes (3 POSTs = 3 rebuilds séquentiels)
    await new Promise(r => setTimeout(r, 5000));
  });

  test.afterAll(async ({ request }) => {
    for (const id of createdNoteIds) {
      await request.patch(`${API}/notes/${id}/annuler`);
    }
  });

  test('la page de saisie des notes se charge', async ({ page }) => {
    await page.goto('/notes');
    await waitForLoad(page);
    await expect(page.locator('h1')).toContainText('notes', { ignoreCase: true });
    await expect(page.locator('.niveau-filter-btn')).toBeVisible();
  });

  test('le bulletin affiche les notes saisies sur les 3 trimestres', async ({ page }) => {
    await page.goto(`/eleves/${ELEVE_ID}/bulletin`);
    await waitForLoad(page);

    // Trimestre 1
    await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 1' }).click();
    await waitForLoad(page);
    const rowMath1 = page.locator('tr').filter({ hasText: 'Mathématiques' });
    await expect(rowMath1.locator('.note-chip').filter({ hasText: NOTE_T1 })).toBeVisible({ timeout: 8_000 });
    await expect(rowMath1.locator('.note-moyenne')).toBeVisible();

    // Trimestre 2
    await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 2' }).click();
    await waitForLoad(page);
    await expect(page.locator('tr').filter({ hasText: 'Mathématiques' }).locator('.note-chip').filter({ hasText: NOTE_T2 })).toBeVisible({ timeout: 8_000 });

    // Trimestre 3
    await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 3' }).click();
    await waitForLoad(page);
    await expect(page.locator('tr').filter({ hasText: 'Mathématiques' }).locator('.note-chip').filter({ hasText: NOTE_T3 })).toBeVisible({ timeout: 8_000 });
  });

  test('la moyenne générale est affichée dans le bulletin', async ({ page }) => {
    await page.goto(`/eleves/${ELEVE_ID}/bulletin`);
    await waitForLoad(page);
    await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 1' }).click();
    await waitForLoad(page);

    await expect(page.getByText('Moyenne générale (pondérée)')).toBeVisible({ timeout: 5_000 });
    const moyenneEl = page.locator('tfoot .note-moyenne');
    await expect(moyenneEl).toBeVisible();
    const moyenneText = await moyenneEl.textContent();
    expect(moyenneText).toMatch(/\d+(\.\d+)?\/20/);
  });

  test('un badge de mention est affiché', async ({ page }) => {
    await page.goto(`/eleves/${ELEVE_ID}/bulletin`);
    await waitForLoad(page);
    await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 1' }).click();
    await waitForLoad(page);

    await expect(page.locator('tfoot .badge').first()).toBeVisible({ timeout: 5_000 });
  });
});
