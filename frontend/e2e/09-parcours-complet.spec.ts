/**
 * Parcours utilisateur complet — un seul test continu sans coupure.
 *
 * Enchaîne dans l'ordre :
 *   1. Dashboard — vérification des KPIs
 *   2. Classes — créer salle fixe, créer salle variable, modifier capacité
 *   3. Matières — créer une matière
 *   4. Salles — créer une salle, consulter son détail
 *   5. Professeurs — créer, désactiver, réactiver
 *   6. Élèves — créer, exclure, réintégrer, marquer parti, réintégrer
 *   7. Planning — naviguer vers le planning de 6ème A, créer un créneau, le supprimer
 *   8. Notes & Bulletin — créer 3 notes (T1/T2/T3), vérifier le bulletin
 *   9. Nettoyage général via API
 */

import { test, expect } from '@playwright/test';
import { waitForLoad, API, CLASSE_TEST, NIVEAU_TEST, MATIERE_TEST } from './helpers';

test('parcours complet utilisateur', async ({ page, request }) => {
  // Ce test enchaîne tous les parcours — ~3 minutes attendues
  test.setTimeout(300_000);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  await page.goto('/dashboard');
  await waitForLoad(page);
  // 4 StatCards présentes avec des valeurs non nulles
  const statCards = page.locator('.stat-card');
  await expect(statCards).toHaveCount(4);
  for (const card of await statCards.all()) {
    const value = await card.locator('.stat-value').textContent();
    expect(parseInt(value ?? '0')).toBeGreaterThan(0);
  }
  // Tableau des classes présent
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  // Quick Actions présents
  await expect(page.getByRole('link', { name: /nouvelle classe/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /nouvel élève/i })).toBeVisible();

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CLASSES
  // ─────────────────────────────────────────────────────────────────────────────

  // — Nettoyage préventif des classes E2E laissées par des runs précédents
  const cleanClassesRes = await request.get(`${API}/read/classes?limit=100`);
  const cleanClassesJson = await cleanClassesRes.json();
  const staleClasses = (cleanClassesJson.items ?? []).filter((c: any) =>
    /^E2E (Fixe|Variable)/.test(c.nom)
  );
  for (const c of staleClasses) {
    await request.patch(`${API}/classes/${c.id}/desactiver`);
  }

  // — Créer une classe salle fixe
  const nomClasseFixe = `E2E Fixe ${Date.now()}`;
  await page.goto('/classes/nouvelle');
  await waitForLoad(page);
  await page.locator('.form-group').filter({ hasText: 'Nom de la classe' }).locator('input').fill(nomClasseFixe);
  await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('20');
  await expect(page.getByRole('button', { name: 'Créer la classe' })).not.toBeDisabled({ timeout: 10_000 });
  const salleSelect = page.locator('.form-group').filter({ hasText: 'Salle assignée' }).locator('select');
  await expect(salleSelect.locator('option').filter({ hasText: 'Labo Physique' })).toHaveCount(1, { timeout: 5_000 });
  const labValue = await salleSelect.locator('option').filter({ hasText: 'Labo Physique' }).getAttribute('value');
  if (labValue) await salleSelect.selectOption(labValue);
  await page.getByRole('button', { name: 'Créer la classe' }).click();
  await expect(page).toHaveURL('/classes', { timeout: 8_000 });
  await waitForLoad(page);
  // Vérifier création via API
  let classesRes = await request.get(`${API}/read/classes?limit=100`);
  let classesJson = await classesRes.json();
  const classeFixe = (classesJson.items ?? []).find((c: any) => c.nom === nomClasseFixe);
  expect(classeFixe, `Classe fixe "${nomClasseFixe}" introuvable dans l'API`).toBeTruthy();

  // — Créer une classe salle variable
  const nomClasseVariable = `E2E Variable ${Date.now()}`;
  await page.goto('/classes/nouvelle');
  await waitForLoad(page);
  await page.locator('.form-group').filter({ hasText: 'Nom de la classe' }).locator('input').fill(nomClasseVariable);
  await page.locator('.form-group').filter({ hasText: 'Mode de salle' }).locator('select').selectOption('variable');
  await expect(page.locator('.form-group').filter({ hasText: 'Salle assignée' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Créer la classe' })).not.toBeDisabled({ timeout: 5_000 });
  await page.getByRole('button', { name: 'Créer la classe' }).click();
  await expect(page).toHaveURL('/classes', { timeout: 5_000 });
  await waitForLoad(page);
  classesRes = await request.get(`${API}/read/classes?limit=100`);
  classesJson = await classesRes.json();
  const classeVariable = (classesJson.items ?? []).find((c: any) => c.nom === nomClasseVariable);
  expect(classeVariable, `Classe variable "${nomClasseVariable}" introuvable dans l'API`).toBeTruthy();

  // — Modifier la capacité d'une classe variable (4ème A)
  await page.goto('/classes');
  await waitForLoad(page);
  const card4A = page.locator('.classe-card-inner').filter({ hasText: '4ème A' });
  await card4A.getByRole('button', { name: '✎' }).click();
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
  const capaciteInput = page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input');
  const valeurActuelle = await capaciteInput.inputValue();
  const nouvelleValeur = valeurActuelle === '28' ? '29' : '28';
  await capaciteInput.fill('');
  await capaciteInput.fill(nouvelleValeur);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 10_000 });
  await expect(card4A.locator('.classe-card-capacity-value')).toContainText(`/ ${nouvelleValeur}`, { timeout: 5_000 });
  // Rétablir
  await card4A.getByRole('button', { name: '✎' }).click();
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
  await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('');
  await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill(valeurActuelle);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 10_000 });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MATIÈRES
  // ─────────────────────────────────────────────────────────────────────────────

  // Nettoyage préventif
  const cleanMatRes = await request.get(`${API}/read/matieres?limit=100`);
  const cleanMatJson = await cleanMatRes.json();
  const staleMatieres = (cleanMatJson.items ?? []).filter((m: any) => /^TestMat E2E/.test(m.nom));
  for (const m of staleMatieres) { await request.patch(`${API}/matieres/${m.id}/desactiver`); }

  const nomMatiere = `TestMat E2E ${Date.now()}`;
  await page.goto('/matieres/nouvelle');
  await waitForLoad(page);
  await page.locator('.form-group').filter({ hasText: 'Nom de la matière' }).locator('input').fill(nomMatiere);
  await page.locator('.form-group').filter({ hasText: /^Code \*/ }).locator('input').fill('TESTE2E');
  await expect(page.locator('.matiere-coef-row').first()).toBeVisible({ timeout: 8_000 });
  await page.getByRole('button', { name: 'Créer la matière' }).click();
  await expect(page).toHaveURL('/matieres', { timeout: 8_000 });
  await waitForLoad(page);
  const matRes = await request.get(`${API}/read/matieres?limit=100`);
  const matJson = await matRes.json();
  const matiere = (matJson.items ?? []).find((m: any) => m.nom === nomMatiere);
  expect(matiere, `Matière "${nomMatiere}" introuvable`).toBeTruthy();

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SALLES
  // ─────────────────────────────────────────────────────────────────────────────

  // Nettoyage préventif
  const cleanSalleRes = await request.get(`${API}/read/salles?limit=100`);
  const cleanSalleJson = await cleanSalleRes.json();
  const staleSalles = (cleanSalleJson.items ?? []).filter((s: any) => /^Salle E2E/.test(s.nom));
  for (const s of staleSalles) { await request.delete(`${API}/salles/${s.id}`); }

  // Consulter le détail d'une salle existante
  await page.goto('/salles');
  await waitForLoad(page);
  await expect(page.locator('.salle-card-title').filter({ hasText: 'Salle 101' })).toBeVisible();
  await page.locator('.salle-card-actions').first().getByRole('button', { name: 'Voir' }).click();
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('main, .modal-overlay').getByText('Lundi').first()).toBeVisible();
  // Fermer le modal
  await page.locator('.modal-overlay').getByRole('button', { name: /fermer|×|✕/i }).first().click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 3_000 });

  // Créer une salle
  const nomSalle = `Salle E2E ${Date.now()}`;
  await page.goto('/salles/nouvelle');
  await waitForLoad(page);
  await page.getByPlaceholder('Ex : Salle A1').fill(nomSalle);
  await page.locator('.form-group').filter({ hasText: 'Capacité maximale' }).locator('input').fill('20');
  await page.getByRole('button', { name: 'Créer la salle' }).click();
  await expect(page).toHaveURL('/salles', { timeout: 5_000 });
  await waitForLoad(page);
  const salleRes = await request.get(`${API}/read/salles?limit=100`);
  const salleJson = await salleRes.json();
  const salle = (salleJson.items ?? []).find((s: any) => s.nom === nomSalle);
  expect(salle, `Salle "${nomSalle}" introuvable`).toBeTruthy();

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. PROFESSEURS
  // ─────────────────────────────────────────────────────────────────────────────

  // Nettoyage préventif
  const cleanProfRes = await request.get(`${API}/read/professeurs?limit=100`);
  const cleanProfJson = await cleanProfRes.json();
  const staleProfs = (cleanProfJson.items ?? []).filter((p: any) => p.nom === 'ProfE2E');
  for (const p of staleProfs) { await request.delete(`${API}/professeurs/${p.id}`); }

  const emailProf = `e2e.test.${Date.now()}@test.com`;
  await page.goto('/professeurs');
  await waitForLoad(page);
  await page.getByRole('button', { name: /nouveau|ajouter|\+/i }).first().click();
  const modal = page.locator('.modal-overlay');
  await modal.locator('.form-group').filter({ hasText: /^Nom \*/ }).locator('input').fill('ProfE2E');
  await modal.locator('.form-group').filter({ hasText: /^Prénom \*/ }).locator('input').fill('Test');
  await modal.locator('.form-group').filter({ hasText: /^Email/ }).locator('input').fill(emailProf);
  await modal.locator('.form-group').filter({ hasText: /^Téléphone/ }).locator('input').fill('0600000000');
  await page.locator('.modal-overlay').getByRole('button', { name: /créer/i }).click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 5_000 });
  await waitForLoad(page);
  const profRow = page.locator('tr, .eleve-info').filter({ hasText: 'ProfE2E' });
  await expect(profRow.first()).toBeVisible({ timeout: 10_000 });
  // Récupérer l'ID
  const profListRes = await request.get(`${API}/read/professeurs?limit=100`);
  const profListJson = await profListRes.json();
  const prof = (profListJson.items ?? []).find((p: any) => p.email === emailProf);
  expect(prof, 'Professeur introuvable dans API').toBeTruthy();
  // Désactiver
  await request.patch(`${API}/professeurs/${prof.id}/desactiver`);
  const profCheck1 = await request.get(`${API}/read/professeurs/${prof.id}`);
  const profData1 = await profCheck1.json();
  expect(profData1.professeur?.statut ?? profData1.statut).toBe('inactif');
  // Réactiver
  await request.patch(`${API}/professeurs/${prof.id}/activer`);
  const profCheck2 = await request.get(`${API}/read/professeurs/${prof.id}`);
  const profData2 = await profCheck2.json();
  expect(profData2.professeur?.statut ?? profData2.statut).toBe('actif');

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. ÉLÈVES
  // ─────────────────────────────────────────────────────────────────────────────

  // Nettoyage préventif
  const cleanEleveRes = await request.get(`${API}/read/eleves?search=Playwright&limit=20`);
  const cleanEleveJson = await cleanEleveRes.json();
  const staleEleves = (cleanEleveJson.eleves ?? cleanEleveJson.items ?? []).filter(
    (e: any) => e.nom === 'Playwright'
  );
  for (const e of staleEleves) { await request.delete(`${API}/eleves/${e.id}`); }

  // Créer un élève
  await page.goto('/eleves/nouveau');
  await waitForLoad(page);
  await page.getByPlaceholder('Ex : Jean').fill('TestE2E');
  await page.getByPlaceholder('Ex : Dupont').fill('Playwright');
  await page.locator('input[type="date"]').fill('2010-01-15');
  // Sélectionner le niveau
  const niveauSelect = page.locator('.form-group').filter({ hasText: 'Niveau' }).locator('select');
  await expect(niveauSelect).toContainText(NIVEAU_TEST, { timeout: 8_000 });
  await niveauSelect.selectOption(NIVEAU_TEST);
  await expect(niveauSelect).toHaveValue(NIVEAU_TEST, { timeout: 3_000 });
  await page.waitForTimeout(500);
  // Sélectionner une classe non pleine
  await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.classe-popup-item-name').first()).toBeVisible({ timeout: 5_000 });
  await page.locator('.classe-popup-item:not(.classe-popup-item-warning) .classe-popup-item-name')
    .filter({ hasText: CLASSE_TEST }).first().click();
  await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3_000 });
  await page.waitForTimeout(200);
  // Remettre les valeurs si effacées par le re-render
  await page.getByPlaceholder('Ex : Jean').fill('TestE2E');
  await page.getByPlaceholder('Ex : Dupont').fill('Playwright');
  // Soumettre — redirection vers la fiche élève après succès
  await expect(page.getByRole('button', { name: "Inscrire l'élève" })).not.toBeDisabled({ timeout: 3_000 });
  await page.getByRole('button', { name: "Inscrire l'élève" }).click();
  await expect(page).toHaveURL(/\/eleves\/.+/, { timeout: 8_000 });
  await waitForLoad(page);
  await expect(page.getByRole('heading').first()).toContainText('Playwright', { timeout: 5_000 });

  // Extraire l'ID depuis l'URL
  const eleveUrl = page.url();
  const eleveId = eleveUrl.split('/eleves/')[1];

  // Exclure l'élève (on est déjà sur la fiche)
  await page.goto(`/eleves/${eleveId}`);
  await waitForLoad(page);
  await page.locator('.statut-action-btn-danger').click();
  await page.locator('.form-group').filter({ hasText: "Raison de l'exclusion" }).locator('input').fill('Test E2E exclusion');
  await page.getByRole('button', { name: "Confirmer l'exclusion" }).click();
  await page.locator('.confirm-btn-confirm').click();
  await expect(page.locator('.badge').filter({ hasText: 'Exclu' })).toBeVisible({ timeout: 5_000 });

  // Réintégrer l'élève exclu
  await page.locator('.statut-annuler-btn').click();
  await page.locator('.confirm-btn-confirm').click();
  await expect(page.locator('.badge').filter({ hasText: 'Actif' })).toBeVisible({ timeout: 5_000 });

  // Marquer comme parti
  const btnWarning = page.locator('.statut-action-btn-warning');
  const isWarningVisible = await btnWarning.isVisible();
  if (!isWarningVisible) {
    await page.waitForTimeout(2000);
    await page.reload();
    await waitForLoad(page);
  }
  await page.locator('.statut-action-btn-warning').click();
  await page.locator('.form-group').filter({ hasText: /^Raison \*/ }).locator('input').fill('Test E2E départ');
  await page.getByRole('button', { name: 'Confirmer le départ' }).click();
  await page.locator('.confirm-btn-confirm').click();
  await expect(page.locator('.badge').filter({ hasText: 'A quitté' })).toBeVisible({ timeout: 5_000 });

  // Réintégrer l'élève parti
  await page.locator('.statut-annuler-btn').click();
  await page.locator('.confirm-btn-confirm').click();
  await expect(page.locator('.badge').filter({ hasText: 'Actif' })).toBeVisible({ timeout: 5_000 });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PLANNING
  // ─────────────────────────────────────────────────────────────────────────────
  await page.goto('/classes');
  await waitForLoad(page);
  const classeCard = page.locator('.classe-card-inner').filter({ hasText: CLASSE_TEST });
  await classeCard.getByRole('link', { name: 'Planning' }).click();
  await waitForLoad(page);
  // La grille se charge
  await expect(page.locator('.planning-table')).toBeVisible();
  await expect(page.locator('.planning-th-day').filter({ hasText: 'Lundi' })).toBeVisible();
  // Des créneaux seedés sont visibles
  await expect(page.locator('.pcb-title').first()).toBeVisible({ timeout: 8_000 });
  const countBefore = await page.locator('.pcb-title').count();
  // Créer un créneau
  const emptyCell = page.locator('.planning-cell-empty').first();
  await emptyCell.click();
  await expect(page.locator('.planning-modal')).toBeVisible({ timeout: 3_000 });
  const matiereSelect = page.locator('.planning-modal select').first();
  await expect(matiereSelect).toContainText(/\w+/, { timeout: 5_000 });
  const matiereOptions = await matiereSelect.locator('option').all();
  for (const opt of matiereOptions) {
    const val = await opt.getAttribute('value');
    if (val && val !== '') { await matiereSelect.selectOption(val); break; }
  }
  const createBtn = page.locator('.planning-modal').getByRole('button', { name: 'Créer le créneau' });
  await expect(createBtn).toBeEnabled({ timeout: 3_000 });
  await createBtn.click();
  await expect(page.locator('.planning-modal')).toHaveCount(0, { timeout: 3_000 });
  await expect(page.locator('.pcb-title')).toHaveCount(countBefore + 1, { timeout: 5_000 });
  // Supprimer le créneau via menu contextuel
  const pcb = page.locator('.pcb').last();
  await pcb.click({ button: 'right' });
  await expect(page.locator('.planning-ctx-menu')).toBeVisible({ timeout: 2_000 });
  await page.locator('.planning-ctx-item-danger').click();
  await page.getByRole('button', { name: 'Supprimer' }).click();
  await page.waitForTimeout(500);

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. NOTES & BULLETIN
  // ─────────────────────────────────────────────────────────────────────────────
  const NOTE_T1 = 15;
  const NOTE_T2 = 13;
  const NOTE_T3 = 11;

  // Récupérer l'ID de la matière Mathématiques
  const notesPageRes = await request.get(`${API}/read/notes`);
  const notesPageJson = await notesPageRes.json();
  const matieres: any[] = notesPageJson.matieres ?? [];
  const math = matieres.find((m: any) => m.nom === MATIERE_TEST);
  expect(math, 'Matière Mathématiques introuvable').toBeTruthy();
  const mathId = math.id ?? math._id;

  // Trouver Paul Bertrand dynamiquement
  const pbRes = await request.get(`${API}/read/eleves?search=Bertrand&limit=20`);
  const pbJson = await pbRes.json();
  const pbList: any[] = pbJson.eleves ?? pbJson.items ?? [];
  const paulBertrand = pbList.find((e: any) => e.prenom === 'Paul' && e.nom === 'Bertrand' && e.statut === 'actif');
  expect(paulBertrand, 'Élève Paul Bertrand introuvable').toBeTruthy();
  const ELEVE_NOTES_ID = paulBertrand.id ?? paulBertrand._id;

  // Annuler les notes MATH existantes pour cet élève (idempotence)
  const allNotes: any[] = notesPageJson.notes ?? [];
  const existingNotes = allNotes.filter((n: any) => n.eleve_id === ELEVE_NOTES_ID && n.matiere_id === mathId);
  for (const n of existingNotes) { await request.patch(`${API}/notes/${n.id}/annuler`); }
  if (existingNotes.length > 0) { await page.waitForTimeout(3000); }

  // Créer les 3 notes via API
  const today = new Date().toISOString().split('T')[0];
  const createdNoteIds: string[] = [];
  for (const [trimestre, valeur] of [[1, NOTE_T1], [2, NOTE_T2], [3, NOTE_T3]] as [number, number][]) {
    const res = await request.post(`${API}/notes`, {
      data: { eleve_id: ELEVE_NOTES_ID, matiere_id: mathId, valeur, trimestre, date: today },
    });
    const json = await res.json();
    const id = json.id ?? json._id;
    if (id) createdNoteIds.push(id);
  }
  // Attendre le rebuild du view builder
  await page.waitForTimeout(5000);

  // Vérifier la page de saisie des notes
  await page.goto('/notes');
  await waitForLoad(page);
  await expect(page.locator('h1')).toContainText('notes', { ignoreCase: true });
  await expect(page.locator('.niveau-filter-btn')).toBeVisible();

  // Vérifier le bulletin — T1
  await page.goto(`/eleves/${ELEVE_NOTES_ID}/bulletin`);
  await waitForLoad(page);
  await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 1' }).click();
  await waitForLoad(page);
  const rowMath1 = page.locator('tr').filter({ hasText: MATIERE_TEST });
  await expect(rowMath1.locator('.note-chip').filter({ hasText: String(NOTE_T1) })).toBeVisible({ timeout: 8_000 });

  // T2
  await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 2' }).click();
  await waitForLoad(page);
  await expect(
    page.locator('tr').filter({ hasText: MATIERE_TEST }).locator('.note-chip').filter({ hasText: String(NOTE_T2) })
  ).toBeVisible({ timeout: 8_000 });

  // T3
  await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 3' }).click();
  await waitForLoad(page);
  await expect(
    page.locator('tr').filter({ hasText: MATIERE_TEST }).locator('.note-chip').filter({ hasText: String(NOTE_T3) })
  ).toBeVisible({ timeout: 8_000 });

  // Moyenne générale et mention (T1)
  await page.locator('.trimestre-tab').filter({ hasText: 'Trimestre 1' }).click();
  await waitForLoad(page);
  await expect(page.getByText('Moyenne générale (pondérée)')).toBeVisible({ timeout: 5_000 });
  const moyenneText = await page.locator('tfoot .note-moyenne').textContent();
  expect(moyenneText).toMatch(/\d+(\.\d+)?\/20/);
  await expect(page.locator('tfoot .badge').first()).toBeVisible({ timeout: 5_000 });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. NETTOYAGE GÉNÉRAL
  // ─────────────────────────────────────────────────────────────────────────────

  // Notes
  for (const id of createdNoteIds) { await request.patch(`${API}/notes/${id}/annuler`); }
  // Élève E2E
  await request.delete(`${API}/eleves/${eleveId}`);
  // Professeur E2E
  if (prof) { await request.delete(`${API}/professeurs/${prof.id}`); }
  // Salle E2E
  if (salle) { await request.delete(`${API}/salles/${salle.id}`); }
  // Matière E2E
  if (matiere) { await request.patch(`${API}/matieres/${matiere.id}/desactiver`); }
  // Classes E2E
  if (classeFixe) { await request.patch(`${API}/classes/${classeFixe.id}/desactiver`); }
  if (classeVariable) { await request.patch(`${API}/classes/${classeVariable.id}/desactiver`); }
});
