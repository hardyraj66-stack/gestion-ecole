/**
 * Test UI complet — visible dans le navigateur (un seul test continu).
 *
 * Tout est piloté via l'interface (formulaires, clics, navigation) afin que chaque
 * étape soit OBSERVABLE à l'écran. Les appels API ne servent qu'au setup (/dev/reset)
 * et à quelques vérifications de cohérence.
 *
 * Déroulé :
 *   PHASE 1 — CRUD via l'UI dans l'année ACTIVE (Niveaux, Matières, Salles, Classes,
 *             Professeurs, Élèves + statuts, Planning, Bulletin, Périodes).
 *   PHASE 2 — Terminer l'année via l'UI.
 *   PHASE 3 — Archive : parcourir tous les menus en lecture seule (aucun bouton CUD).
 *   PHASE 4 — Isolation : créer des données via l'UI dans l'année EN PRÉPARATION,
 *             puis revenir dans l'archive et vérifier qu'elles N'Y SONT PAS.
 *   PHASE 5 — Reset final.
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { waitForLoad, API, NIVEAU_TEST, CLASSE_TEST } from './helpers';

const STAMP = Date.now();
const N = {
  niveau: `E2E Niveau ${STAMP}`,
  matiere: `E2E Matiere ${STAMP}`,
  matiereCode: `EM${STAMP % 100000}`,
  salle: `E2E Salle ${STAMP}`,
  classe: `E2E Classe ${STAMP}`,
  prof: `ProfE2E${STAMP % 100000}`,
  elevePrenom: 'TestE2E',
  eleveNom: `Playwright${STAMP % 100000}`,
  // créés dans la PRÉPARATION (phase 4) pour le test d'isolation
  isoMatiere: `ISO Matiere ${STAMP}`,
  isoMatiereCode: `IM${STAMP % 100000}`,
  isoNiveau: `ISO Niveau ${STAMP}`,
  isoSalle: `ISO Salle ${STAMP}`,
};
const PAUSE = 600; // petite pause pour rendre les étapes visibles

let STEP = 0;
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  STEP++;
  const tag = `ÉTAPE ${String(STEP).padStart(2, '0')} — ${label}`;
  // eslint-disable-next-line no-console
  console.log(`\n▶  ${tag}`);
  return test.step(tag, async () => {
    const r = await fn();
    // eslint-disable-next-line no-console
    console.log(`✓  ${tag}`);
    return r;
  });
}

async function getAnnees(request: APIRequestContext) {
  const res = await request.get(`${API}/annees`);
  return res.ok() ? res.json() : [];
}
async function navSidebar(page: Page, route: string) {
  await page.locator(`a.nav-item[href="${route}"]`).first().click();
  await page.waitForURL(`**${route}`, { timeout: 10_000 });
  await waitForLoad(page);
  await page.waitForTimeout(PAUSE);
}
async function entrerArchive(page: Page, label: string) {
  await page.goto('/annee-scolaire');
  await waitForLoad(page);
  const row = page.locator('.annee-historique-item').filter({ hasText: label }).first();
  await row.getByRole('button', { name: /consulter/i }).click();
  await expect(page.locator('.archive-banner')).toBeVisible({ timeout: 15_000 });
  await waitForLoad(page);
  await page.waitForTimeout(PAUSE);
}
async function sortirArchive(page: Page) {
  const banner = page.locator('.archive-banner');
  if (await banner.isVisible().catch(() => false)) {
    await banner.click();
    await expect(banner).toBeHidden({ timeout: 10_000 });
    await page.waitForTimeout(PAUSE);
  }
}

test.beforeAll(async ({ request }) => {
  // eslint-disable-next-line no-console
  console.log('\n=== SETUP : POST /dev/reset ===');
  const res = await request.post(`${API}/dev/reset`, { timeout: 120_000 });
  expect(res.ok(), 'reset initial').toBeTruthy();
});

test('parcours UI complet + archive visible sur tous les modules', async ({ page, request }) => {
  test.setTimeout(600_000);

  const ARCH_LABEL = (await getAnnees(request)).find((a: any) => a.statut === 'active')?.label;
  expect(ARCH_LABEL, 'année active').toBeTruthy();

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — CRUD via l'UI dans l'année ACTIVE
  // ═══════════════════════════════════════════════════════════════════════════

  await step('NIVEAUX (UI) : créer un niveau', async () => {
    await page.goto('/niveaux/nouveau');
    await waitForLoad(page);
    await page.getByPlaceholder(/Ex: 6ème/).fill(N.niveau);
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: /créer le niveau/i }).click();
    await expect(page).toHaveURL('/niveaux', { timeout: 8_000 });
    await waitForLoad(page);
    await expect(page.getByText(N.niveau).first()).toBeVisible({ timeout: 8_000 });
  });

  await step('MATIÈRES (UI) : créer une matière', async () => {
    await page.goto('/matieres/nouvelle');
    await waitForLoad(page);
    await page.locator('.form-group').filter({ hasText: 'Nom de la matière' }).locator('input').fill(N.matiere);
    await page.locator('.form-group').filter({ hasText: /^Code \*/ }).locator('input').fill(N.matiereCode);
    await expect(page.locator('.matiere-coef-row').first()).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: 'Créer la matière' }).click();
    await expect(page).toHaveURL('/matieres', { timeout: 8_000 });
    await waitForLoad(page);
  });

  await step('SALLES (UI) : voir un détail + créer une salle', async () => {
    await page.goto('/salles');
    await waitForLoad(page);
    await page.locator('.salle-card-actions').first().getByRole('button', { name: 'Voir' }).click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
    await page.waitForTimeout(PAUSE);
    await page.locator('.modal-overlay').getByRole('button', { name: /fermer|×|✕/i }).first().click();
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 3_000 });
    await page.goto('/salles/nouvelle');
    await waitForLoad(page);
    await page.getByPlaceholder('Ex : Salle A1').fill(N.salle);
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('25');
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: 'Créer la salle' }).click();
    await expect(page).toHaveURL('/salles', { timeout: 8_000 });
    await waitForLoad(page);
  });

  await step('CLASSES (UI) : créer (salle variable) + modifier la capacité', async () => {
    await page.goto('/classes/nouvelle');
    await waitForLoad(page);
    await page.locator('.form-group').filter({ hasText: 'Nom de la classe' }).locator('input').fill(N.classe);
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('25');
    // Niveau explicite (pour pouvoir filtrer la liste ensuite)
    await page.locator('.form-group').filter({ hasText: 'Niveau' }).locator('select').selectOption(NIVEAU_TEST);
    // Salle variable → pas de salle à choisir, aucun conflit possible
    await page.locator('.form-group').filter({ hasText: 'Mode de salle' }).locator('select').selectOption('variable');
    await expect(page.locator('.form-group').filter({ hasText: 'Salle assignée' })).toHaveCount(0);
    const btn = page.getByRole('button', { name: 'Créer la classe' });
    await expect(btn).toBeEnabled({ timeout: 8_000 });
    await page.waitForTimeout(PAUSE);
    await btn.click();
    await expect(page).toHaveURL('/classes', { timeout: 8_000 });
    await waitForLoad(page);
    // La nouvelle classe peut être sur une autre page → filtrer par niveau pour la faire apparaître
    await page.locator('.niveau-filter-btn').filter({ hasText: NIVEAU_TEST }).first().click();
    await page.waitForTimeout(PAUSE);
    // modifier la capacité via la carte
    const card = page.locator('.classe-card-inner').filter({ hasText: N.classe });
    await expect(card).toBeVisible({ timeout: 8_000 });
    await card.getByRole('button', { name: '✎' }).click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
    const cap = page.locator('.modal-overlay .form-group').filter({ hasText: 'Capacité maximale' }).locator('input');
    await cap.fill(''); await cap.fill('28');
    await page.waitForTimeout(PAUSE);
    await page.locator('.modal-overlay').getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 8_000 });
  });

  await step('PROFESSEURS (UI) : créer via le modal', async () => {
    await page.goto('/professeurs');
    await waitForLoad(page);
    await page.getByRole('button', { name: /nouveau|ajouter|\+/i }).first().click();
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 3_000 });
    await modal.locator('.form-group').filter({ hasText: /^Nom \*/ }).locator('input').fill(N.prof);
    await modal.locator('.form-group').filter({ hasText: /^Prénom \*/ }).locator('input').fill('Test');
    await modal.locator('.form-group').filter({ hasText: /^Email/ }).locator('input').fill(`${N.prof}@ecole.fr`);
    await page.waitForTimeout(PAUSE);
    await modal.getByRole('button', { name: /créer/i }).click();
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 5_000 });
    await expect(page.locator('tr, .eleve-info').filter({ hasText: N.prof }).first()).toBeVisible({ timeout: 8_000 });
  });

  await step('ÉLÈVES (UI) : créer un élève (niveau → choix de classe) et ouvrir sa fiche', async () => {
    await page.goto('/eleves/nouveau');
    await waitForLoad(page);
    await page.getByPlaceholder('Ex : Jean').fill(N.elevePrenom);
    await page.getByPlaceholder('Ex : Dupont').fill(N.eleveNom);
    await page.locator('input[type="date"]').fill('2013-03-10');
    const niveauSelect = page.locator('.form-group').filter({ hasText: 'Niveau' }).locator('select');
    await expect(niveauSelect).toContainText(NIVEAU_TEST, { timeout: 8_000 });
    await niveauSelect.selectOption(NIVEAU_TEST);
    await page.waitForTimeout(700);
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.classe-popup-item:not(.classe-popup-item-warning) .classe-popup-item-name')
      .filter({ hasText: CLASSE_TEST }).first().click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3_000 });
    await page.getByPlaceholder('Ex : Jean').fill(N.elevePrenom);
    await page.getByPlaceholder('Ex : Dupont').fill(N.eleveNom);
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: "Inscrire l'élève" }).click();
    await expect(page).toHaveURL(/\/eleves\/.+/, { timeout: 8_000 });
    await waitForLoad(page);
    await expect(page.getByRole('heading').first()).toContainText(N.eleveNom, { timeout: 5_000 });
    await page.waitForTimeout(PAUSE);
  });

  await step('PLANNING (UI) : créer puis supprimer un créneau', async () => {
    await page.goto('/classes');
    await waitForLoad(page);
    const card = page.locator('.classe-card-inner').filter({ hasText: CLASSE_TEST });
    await card.getByRole('link', { name: 'Planning' }).click();
    await waitForLoad(page);
    await expect(page.locator('.planning-table')).toBeVisible({ timeout: 8_000 });
    const countBefore = await page.locator('.pcb-title').count();
    await page.locator('.planning-cell-empty').first().click();
    await expect(page.locator('.planning-modal')).toBeVisible({ timeout: 3_000 });
    const matSelect = page.locator('.planning-modal select').first();
    const opts = await matSelect.locator('option').all();
    for (const o of opts) { const v = await o.getAttribute('value'); if (v) { await matSelect.selectOption(v); break; } }
    await page.waitForTimeout(PAUSE);
    const createBtn = page.locator('.planning-modal').getByRole('button', { name: 'Créer le créneau' });
    await expect(createBtn).toBeEnabled({ timeout: 3_000 });
    await createBtn.click();
    await expect(page.locator('.planning-modal')).toHaveCount(0, { timeout: 3_000 });
    await expect(page.locator('.pcb-title')).toHaveCount(countBefore + 1, { timeout: 5_000 });
    // suppression via clic droit
    await page.locator('.pcb').last().click({ button: 'right' });
    await expect(page.locator('.planning-ctx-menu')).toBeVisible({ timeout: 2_000 });
    await page.locator('.planning-ctx-item-danger').click();
    await page.getByRole('button', { name: 'Supprimer' }).click();
    await page.waitForTimeout(PAUSE);
  });

  await step('BULLETIN (UI) : consulter les 3 trimestres d\'un élève', async () => {
    // un élève seedé (avec notes) — on prend le 1er de la liste
    await page.goto('/eleves');
    await waitForLoad(page);
    await page.locator('table tbody tr').first().click();
    await page.waitForURL('**/eleves/**', { timeout: 8_000 });
    await waitForLoad(page);
    await page.getByRole('link', { name: /bulletin/i }).first().click();
    await page.waitForURL('**/bulletin', { timeout: 8_000 });
    await waitForLoad(page);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 8_000 });
    // basculer les trimestres si des onglets existent
    const tabs = page.locator('.trimestre-tab, [class*="trimestre"] button, button').filter({ hasText: /T2|Trimestre 2/i });
    if (await tabs.count() > 0) { await tabs.first().click(); await page.waitForTimeout(PAUSE); }
  });

  await step('PÉRIODES (UI) : consulter la page des périodes', async () => {
    await navSidebar(page, '/evaluations');
    await expect(page.locator('main')).toContainText(/trimestre|période|DS|évaluation/i, { timeout: 8_000 });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — TERMINER L'ANNÉE (UI)
  // ═══════════════════════════════════════════════════════════════════════════
  await step('TERMINER l\'année active via l\'UI', async () => {
    await page.goto('/annee-scolaire');
    await waitForLoad(page);
    await page.getByRole('button', { name: /terminer l'année/i }).first().click();
    for (let i = 0; i < 2; i++) {
      const c = page.locator('.confirm-btn-confirm');
      await expect(c).toBeVisible({ timeout: 10_000 });
      await c.click();
      await page.waitForTimeout(900);
    }
    await expect.poll(async () => (await getAnnees(request)).find((a: any) => a.label === ARCH_LABEL)?.statut, { timeout: 40_000 }).toBe('terminee');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — ARCHIVE LECTURE SEULE (UI)
  // ═══════════════════════════════════════════════════════════════════════════
  await step('ARCHIVE (UI) : entrer dans l\'archive', async () => {
    await entrerArchive(page, ARCH_LABEL);
    await expect(page.locator('.archive-banner')).toContainText(ARCH_LABEL);
  });

  const menus: { route: string; cud: RegExp[] }[] = [
    { route: '/classes', cud: [/nouvelle classe/i] },
    { route: '/eleves', cud: [/nouvel élève/i] },
    { route: '/matieres', cud: [/nouvelle matière/i] },
    { route: '/salles', cud: [/nouvelle salle/i] },
    { route: '/niveaux', cud: [/nouveau niveau/i] },
    { route: '/professeurs', cud: [/ajouter/i] },
    { route: '/notes', cud: [] },
    { route: '/evaluations', cud: [] },
    { route: '/planning', cud: [] },
  ];
  for (const m of menus) {
    await step(`ARCHIVE (UI) : ${m.route} — lecture seule`, async () => {
      await navSidebar(page, m.route);
      await expect(page.locator('.archive-banner'), `bandeau archive sur ${m.route}`).toBeVisible();
      for (const btn of m.cud) {
        await expect(page.getByRole('button', { name: btn }), `bouton ${btn} absent`).toHaveCount(0);
        await expect(page.getByRole('link', { name: btn }), `lien ${btn} absent`).toHaveCount(0);
      }
    });
  }

  await step('ARCHIVE (UI) : intégrité des données 2024-2025', async () => {
    await navSidebar(page, '/classes');
    await expect(page.locator('main')).toContainText(/6ème|5ème/i);
    await navSidebar(page, '/eleves');
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    await sortirArchive(page);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — ISOLATION : créer en PRÉPARATION (UI) puis vérifier l'absence en archive
  // ═══════════════════════════════════════════════════════════════════════════
  await step('PRÉPARATION (UI) : créer une matière, un niveau et une salle', async () => {
    await page.goto('/matieres/nouvelle');
    await waitForLoad(page);
    await page.locator('.form-group').filter({ hasText: 'Nom de la matière' }).locator('input').fill(N.isoMatiere);
    await page.locator('.form-group').filter({ hasText: /^Code \*/ }).locator('input').fill(N.isoMatiereCode);
    await expect(page.locator('.matiere-coef-row').first()).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: 'Créer la matière' }).click();
    await expect(page).toHaveURL('/matieres', { timeout: 8_000 });

    await page.goto('/niveaux/nouveau');
    await waitForLoad(page);
    await page.getByPlaceholder(/Ex: 6ème/).fill(N.isoNiveau);
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: /créer le niveau/i }).click();
    await expect(page).toHaveURL('/niveaux', { timeout: 8_000 });

    await page.goto('/salles/nouvelle');
    await waitForLoad(page);
    await page.getByPlaceholder('Ex : Salle A1').fill(N.isoSalle);
    await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('15');
    await page.waitForTimeout(PAUSE);
    await page.getByRole('button', { name: 'Créer la salle' }).click();
    await expect(page).toHaveURL('/salles', { timeout: 8_000 });
    await page.waitForTimeout(1500);
    // Confirmation (sans souci de pagination) : les 3 éléments existent bien en préparation
    const prep = (await getAnnees(request)).find((a: any) => a.statut === 'preparation');
    const prepId = prep.id;
    const sallesPrep = await (await request.get(`${API}/read/salles?limit=500&anneeId=${prepId}`)).json();
    const matPrep = await (await request.get(`${API}/read/matieres?limit=500&anneeId=${prepId}`)).json();
    const nivPrep = await (await request.get(`${API}/read/niveaux?anneeId=${prepId}`)).json();
    expect((sallesPrep.items ?? []).some((s: any) => s.nom === N.isoSalle), 'salle ISO en préparation').toBeTruthy();
    expect((matPrep.items ?? []).some((m: any) => m.nom === N.isoMatiere), 'matière ISO en préparation').toBeTruthy();
    expect((nivPrep ?? []).some((n: any) => n.niveau === N.isoNiveau), 'niveau ISO en préparation').toBeTruthy();
  });

  await step('ISOLATION (UI) : ces données sont ABSENTES de l\'archive', async () => {
    await entrerArchive(page, ARCH_LABEL);
    await navSidebar(page, '/matieres');
    await expect(page.getByText(N.isoMatiere)).toHaveCount(0);
    await navSidebar(page, '/niveaux');
    await expect(page.getByText(N.isoNiveau)).toHaveCount(0);
    await navSidebar(page, '/salles');
    await expect(page.getByText(N.isoSalle)).toHaveCount(0);
    await sortirArchive(page);
  });

  await step('EXPORT (isolation) : l\'export respecte l\'année (archive vs préparation)', async () => {
    const annees = await getAnnees(request);
    const archId = annees.find((a: any) => a.label === ARCH_LABEL)?.id;
    const prepId = annees.find((a: any) => a.statut === 'preparation')?.id;
    const csvRows = async (url: string) => {
      const txt = await (await request.get(`${API}${url}`)).text();
      return txt.split('\n').slice(1).filter((l) => l.trim().length > 0);
    };
    // Matière ISO (créée en préparation) : présente dans l'export préparation, absente de l'archive
    const expMatArch = await csvRows(`/export/matieres/csv?anneeId=${archId}`);
    const expMatPrep = await csvRows(`/export/matieres/csv?anneeId=${prepId}`);
    expect(expMatArch.some((l) => l.includes(N.isoMatiere)), 'export archive sans matière ISO').toBeFalsy();
    expect(expMatPrep.some((l) => l.includes(N.isoMatiere)), 'export préparation avec matière ISO').toBeTruthy();
    // Le total de l'export archive == total read/matieres de l'archive (pas de cumul inter-années)
    const archMatTotal = (await (await request.get(`${API}/read/matieres?limit=500&anneeId=${archId}`)).json()).total;
    expect(expMatArch.length, 'export archive scopé (pas de doublon inter-années)').toBe(archMatTotal);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — RESET
  // ═══════════════════════════════════════════════════════════════════════════
  await step('NETTOYAGE : reset final → 2024-2025 active complète', async () => {
    const res = await request.post(`${API}/dev/reset`, { timeout: 120_000 });
    expect(res.ok(), 'reset final').toBeTruthy();
  });
});
