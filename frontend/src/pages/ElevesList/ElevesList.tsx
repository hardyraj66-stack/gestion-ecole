import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useReadOnly } from '../../hooks/useReadOnly';
import { useAnnees } from '../../contexts/AnneeContext';
import { useEleves } from '../../contexts/EleveContext';
import { usePageFetch } from '../../hooks/usePageData';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { Modal } from '../../components/shared/Modal';
import { Select, SelectOption } from '../../components/shared/Select';
import { ElevesFiltersBar } from './ElevesFiltersBar';
import { ElevesListTable } from './ElevesListTable';
import { ExportMenu } from '../../components/shared/ExportMenu';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { exportQs } from '../../utils/helpers';

export function ElevesList() {
  const { t } = useTranslation();
  const { isViewingArchive, viewingId } = useViewing();
  const readOnly = useReadOnly();
  const { preparation, active } = useAnnees();
  const { reinscire } = useEleves();
  const confirm = useConfirm();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classeId, setClasseId] = useState('');
  const [classeNom, setClasseNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [eleveId, setEleveId] = useState('');
  const [sansClasse, setSansClasse] = useState(false);

  // Modal réinscription
  const [reinscriptionEleveId, setReinscriptionEleveId] = useState<string | null>(null);
  const [reinscriptionEleve, setReinscriptionEleve] = useState<any | null>(null);
  const [reinscriptionNiveau, setReinscriptionNiveau] = useState('');
  const [reinscriptionClasseId, setReinscriptionClasseId] = useState('');
  const [classesDisponibles, setClassesDisponibles] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submittingReinscription, setSubmittingReinscription] = useState(false);
  const [reinscriptionError, setReinscriptionError] = useState('');

  // Année cible : préférer preparation, sinon active
  const annéeCible = preparation ?? active ?? null;

  const { data: dataNormal, loading: loadingNormal, error: errorNormal } = usePageFetch(
    useCallback(() => readApi.elevesList(page, 12, search, classeId, eleveId || undefined, viewingId ?? undefined), [page, search, classeId, eleveId, viewingId]),
    undefined, 'eleves',
  );

  const { data: dataSansClasse, loading: loadingSansClasse, error: errorSansClasse } = usePageFetch(
    useCallback(() => sansClasse ? readApi.elevesSansClasse(page, 12, search) : Promise.resolve(null), [sansClasse, page, search]),
    undefined, 'eleves',
  );

  const data = sansClasse ? dataSansClasse : dataNormal;
  const loading = sansClasse ? loadingSansClasse : loadingNormal;
  const error = sansClasse ? errorSansClasse : errorNormal;

  const eleves = data?.eleves || [];
  const total = data?.total || 0;
  const totalAll = dataNormal?.totalAll || 0;

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <Alert variant="error">{t('eleves.erreurChargement')}</Alert>;

  const handleSearch = (s: string) => { setSearch(s); setEleveId(''); setPage(1); };
  const handleSuggestionSelect = (id: string) => { setEleveId(id); setSearch(''); setPage(1); };
  const handleNiveauClasseChange = (niveauLabel: string, cid: string, nom: string) => {
    setNiveau(niveauLabel); setClasseId(cid); setClasseNom(nom); setPage(1);
  };
  const handleReset = () => {
    setSearch(''); setClasseId(''); setClasseNom(''); setNiveau('');
    setEleveId(''); setSansClasse(false); setPage(1);
  };
  const handleSansClasse = (v: boolean) => {
    setSansClasse(v); setClasseId(''); setClasseNom(''); setNiveau(''); setEleveId(''); setPage(1);
  };

  const openReinscription = async (id: string) => {
    setReinscriptionEleveId(id);
    setReinscriptionEleve(null);
    setReinscriptionNiveau('');
    setReinscriptionClasseId('');
    setClassesDisponibles([]);
    setReinscriptionError('');

    // Récupérer suggestion depuis l'API (fonctionne pour tous les élèves)
    const suggestion = await readApi.eleveSuggestionReinscription(id);
    if (!suggestion) return;

    setReinscriptionEleve(suggestion);

    const niveauSuggere = suggestion.niveauSuggere || suggestion.derniereClasseNiveau || '';
    setReinscriptionNiveau(niveauSuggere);

    if (niveauSuggere && annéeCible) {
      setLoadingClasses(true);
      const d = await readApi.classesParNiveau(niveauSuggere, undefined, annéeCible.id);
      const classes = d?.classes || [];
      setClassesDisponibles(classes);
      setLoadingClasses(false);

      // Pré-sélectionner la classe du même nom
      if (suggestion.derniereClasseNom) {
        const match = classes.find((c: any) => c.nom === suggestion.derniereClasseNom);
        if (match) setReinscriptionClasseId(match.id);
      }
    }
  };

  const handleNiveauReinscription = async (niv: string) => {
    setReinscriptionNiveau(niv);
    setReinscriptionClasseId('');
    setReinscriptionError('');
    if (niv && annéeCible) {
      setLoadingClasses(true);
      const d = await readApi.classesParNiveau(niv, undefined, annéeCible.id);
      setClassesDisponibles(d?.classes || []);
      setLoadingClasses(false);
    } else {
      setClassesDisponibles([]);
    }
  };

  const handleConfirmReinscription = async (forceCapacite = false) => {
    if (!reinscriptionEleveId || !reinscriptionClasseId || !annéeCible) return;
    setSubmittingReinscription(true);
    setReinscriptionError('');

    const result = await reinscire(reinscriptionEleveId, reinscriptionClasseId, annéeCible.id, forceCapacite);

    if (!result.ok) {
      setSubmittingReinscription(false);
      if (result.code === 'CAPACITE_DEPASSEE' && result.meta) {
        // Demande confirmation pour forcer
        const { classeNom, nbEleves, capacite } = result.meta;
        const ok = await confirm({
          title: 'Classe complète',
          message: `La classe ${classeNom} est complète (${nbEleves}/${capacite} élèves). Voulez-vous quand même inscrire cet élève en dépassant la capacité ?`,
          confirmText: 'Inscrire quand même',
          variant: 'warning',
        });
        if (ok) await handleConfirmReinscription(true);
      } else {
        setReinscriptionError(result.message || 'Une erreur est survenue');
      }
      return;
    }

    setSubmittingReinscription(false);
    setReinscriptionEleveId(null);
  };

  const niveauxOptions: SelectOption[] = ['6ème','5ème','4ème','3ème','2nde','1ère','Terminale'].map(n => ({ value: n, label: n }));
  const classesOptions: SelectOption[] = classesDisponibles.map((c: any) => ({
    value: c.id,
    label: `${c.nom} — ${c.nb_eleves}/${c.capacite} élèves${c.pleine ? ' (complet)' : ''}`,
  }));

  const subtitle = sansClasse
    ? `${total} élève${total > 1 ? 's' : ''} à réinscrire`
    : t('eleves.nbEleves', { count: totalAll });

  // Libellé de l'année cible dans le modal
  const annéeLabel = annéeCible
    ? `${annéeCible.label}${annéeCible.statut === 'active' ? ' (en cours)' : ' (en préparation)'}`
    : null;

  return (
    <div>
      <PageHeader title={t('eleves.titre')} subtitle={subtitle}>
        <ExportMenu
          csvUrl={`/export/eleves/csv${exportQs({ classeId, search, anneeId: viewingId })}`}
          xlsxUrl={`/export/eleves/xlsx${exportQs({ classeId, search, anneeId: viewingId })}`}
        />
        {!readOnly && <Button as="link" to="/eleves/nouveau" variant="primary">{t('eleves.nouvelEleve')}</Button>}
      </PageHeader>

      <ElevesFiltersBar
        searchTerm={search}
        onSearchChange={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        selectedClasseId={classeId}
        selectedClasseNom={classeNom}
        selectedNiveau={niveau}
        onNiveauClasseChange={handleNiveauClasseChange}
        onReset={handleReset}
        count={total}
        hasEleveFilter={!!eleveId}
        sansClasse={sansClasse}
        onSansClasseChange={handleSansClasse}
        hasAnneeActive={!!active}
      />

      {totalAll === 0 && !sansClasse ? (
        <EmptyState
          icon={<Icon path={Icons.users} size={28} />}
          message={t('eleves.aucunEleve')}
          action={!readOnly ? <Button as="link" to="/eleves/nouveau" variant="primary">{t('eleves.inscrire')}</Button> : undefined}
        />
      ) : total === 0 ? (
        <EmptyState
          icon={<Icon path={sansClasse ? Icons.users : Icons.search} size={28} />}
          message={sansClasse ? 'Tous les élèves sont déjà inscrits' : t('eleves.aucunResultat')}
        />
      ) : (
        <>
          <ElevesListTable
            eleves={eleves}
            sansClasse={sansClasse}
            showReinscription={!sansClasse && !isViewingArchive && !active}
            onReinscire={!isViewingArchive ? openReinscription : undefined}
          />
          <Pagination currentPage={page} totalItems={total} pageSize={12} onPageChange={setPage} />
        </>
      )}

      {/* Modal réinscription */}
      {reinscriptionEleveId && (
        <Modal title="Réinscrire l'élève" onClose={() => setReinscriptionEleveId(null)}>
          {!annéeCible ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Alert variant="warning">
                Aucune année scolaire active ou en préparation. Créez d'abord une année scolaire depuis la page <strong>Année scolaire</strong>.
              </Alert>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setReinscriptionEleveId(null)}>Fermer</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Année cible */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={15} />
                <span>Année cible :</span>
                <strong>{annéeLabel}</strong>
                {annéeCible.statut === 'active' && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
                    ⚠ Inscription en année active
                  </span>
                )}
              </div>

              {/* Dernière classe + suggestion de niveau */}
              {reinscriptionEleve?.derniereClasseNom && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.65rem 0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${reinscriptionEleve.diplome ? 'var(--info, #3b82f6)' : reinscriptionEleve.promeu ? 'var(--success)' : 'var(--warning)'}`, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={13} />
                    Ancienne classe : <strong style={{ color: 'var(--text)' }}>{reinscriptionEleve.derniereClasseNom}</strong>
                    <span>({reinscriptionEleve.derniereClasseNiveau})</span>
                  </div>
                  {reinscriptionEleve.moyenneGenerale !== null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: reinscriptionEleve.diplome ? 'var(--info, #3b82f6)' : reinscriptionEleve.promeu ? 'var(--success)' : 'var(--warning)' }}>
                      <Icon path={reinscriptionEleve.diplome
                        ? 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                        : reinscriptionEleve.promeu
                          ? 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'
                          : 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
                      } size={13} />
                      Moyenne : {reinscriptionEleve.moyenneGenerale}/20
                      {reinscriptionEleve.diplome
                        ? ' — Diplômé (Terminale réussie)'
                        : reinscriptionEleve.promeu
                          ? ` — Promu en ${reinscriptionEleve.niveauSuggere}`
                          : ` — Redouble en ${reinscriptionEleve.niveauSuggere}`
                      }
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Aucune note disponible — niveau suggéré : {reinscriptionEleve.niveauSuggere || reinscriptionEleve.derniereClasseNiveau}
                    </div>
                  )}
                </div>
              )}

              {reinscriptionError && <Alert variant="error">{reinscriptionError}</Alert>}

              <Select
                label="Niveau"
                value={reinscriptionNiveau}
                onChange={e => handleNiveauReinscription(e.target.value)}
                options={niveauxOptions}
                placeholder="Choisir un niveau…"
              />

              {reinscriptionNiveau && (
                loadingClasses
                  ? <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chargement des classes…</div>
                  : classesDisponibles.length === 0
                    ? <Alert variant="warning">Aucune classe disponible pour ce niveau.</Alert>
                    : <Select
                        label="Classe"
                        value={reinscriptionClasseId}
                        onChange={e => setReinscriptionClasseId(e.target.value)}
                        options={classesOptions}
                        placeholder="Choisir une classe…"
                      />
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <Button variant="secondary" onClick={() => setReinscriptionEleveId(null)}>
                  {t('common.annuler')}
                </Button>
                <Button
                  variant="primary"
                  disabled={!reinscriptionClasseId || submittingReinscription}
                  loading={submittingReinscription}
                  onClick={() => handleConfirmReinscription(false)}
                >
                  Confirmer la réinscription
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
