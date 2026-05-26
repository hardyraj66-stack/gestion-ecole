import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useClasses } from '../../contexts/ClasseContext';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { useClassesListData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { AddCard } from '../../components/shared/Card';
import { Icon, Icons } from '../../components/shared/Icon';
import { Pagination } from '../../components/shared/Pagination';
import { Alert } from '../../components/shared/Alert';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { SalleType } from '../../types';
import { getTypeLabel } from '../../utils/helpers';
import { Modal } from '../../components/shared/Modal';
import { ClasseCard } from './ClasseCard';
import { ExportMenu } from '../../components/shared/ExportMenu';

export function ClassesList() {
  const { t } = useTranslation();
  const { desactiver: desactiverClasse, update: updateClasse } = useClasses();
  const [deleteError, setDeleteError] = useState('');
  const { salles, getAll: fetchSalles } = useSalles();
  const { isViewingArchive: readOnly } = useViewing();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [filterNiveau, setFilterNiveau] = useState('');

  const [editClasse, setEditClasse] = useState<any>(null);
  const [editNom, setEditNom] = useState('');
  const [editCapacite, setEditCapacite] = useState(30);
  const [editSalleType, setEditSalleType] = useState<SalleType>('fixe');
  const [editSalleId, setEditSalleId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const { data, loading, error } = useClassesListData(page, '', filterNiveau);

  const fetchedSalles = useRef(false);
  useEffect(() => { if (fetchedSalles.current) return; fetchedSalles.current = true; fetchSalles(); }, [fetchSalles]);

  if (loading) return <PageLoader />;
  if (error || !data) return <Alert variant="error">{t('classes.erreurChargement')}</Alert>;

  const { items, total, totalPages, niveaux: availableNiveaux } = data;
  const niveauOptions: SelectOption[] = [
    { value: '', label: t('classes.tousNiveaux') },
    ...((availableNiveaux || []) as string[]).map((n: string) => ({ value: n, label: n })),
  ];

  const SALLE_TYPES: SelectOption[] = [
    { value: 'fixe', label: t('classes.form.salleFixe') },
    { value: 'variable', label: t('classes.form.salleVariableLabel') },
  ];

  const handleNiveauFilter = (n: string) => { setFilterNiveau(n); setPage(1); };

  const sallesOccupees: { classeId: string; classNom: string; salle: string }[] = (data as any).sallesOccupees ?? [];
  const sallesOccupeesHorsEdit = sallesOccupees.filter(o => o.classeId !== editClasse?.id);

  const salleOptions: SelectOption[] = salles.map(s => {
    const conflit = sallesOccupeesHorsEdit.find(o => o.salle === s.nom);
    return {
      value: s.id,
      label: conflit
        ? `${s.nom} — occupée par ${conflit.classNom}`
        : `${s.nom} — ${s.capacite} places (${getTypeLabel(s.type)})`,
      disabled: !!conflit,
    };
  });

  const selectedSalle = salles.find(s => s.id === editSalleId);

  const openEdit = (classe: any) => {
    setEditClasse(classe);
    setEditNom(classe.nom);
    setEditCapacite(classe.capacite);
    setEditSalleType(classe.salle_type);
    const salle = salles.find(s => s.nom === classe.salle);
    setEditSalleId(salle?.id || '');
    setEditError('');
  };

  const editIsFixe = editSalleType === 'fixe';

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClasse || !editNom.trim()) { setEditError(t('classes.erreurs.nomObligatoire')); return; }

    if (editIsFixe) {
      if (!editSalleId) { setEditError(t('classes.erreurs.salleObligatoire')); return; }
      const salle = salles.find(s => s.id === editSalleId);
      if (!salle) { setEditError(t('classes.erreurs.salleInvalide')); return; }

      if (editCapacite > salle.capacite) {
        const ok = await confirm({
          title: t('classes.erreurs.capaciteDepassee'),
          message: t('classes.confirmCapacite', { nom: salle.nom, capacite: salle.capacite, saisi: editCapacite }),
          confirmText: t('common.confirmer'), variant: 'warning',
        });
        if (!ok) return;
      }

      setEditSubmitting(true); setEditError('');
      await updateClasse(editClasse.id,
        { nom: editNom.trim(), capacite: editCapacite, salle: salle.nom, salle_type: editSalleType },
        () => { setEditClasse(null); setEditSubmitting(false); },
        (err) => { setEditError(err); setEditSubmitting(false); },
      );
    } else {
      setEditSubmitting(true); setEditError('');
      await updateClasse(editClasse.id,
        { nom: editNom.trim(), capacite: editCapacite, salle: '', salle_type: editSalleType },
        () => { setEditClasse(null); setEditSubmitting(false); },
        (err) => { setEditError(err); setEditSubmitting(false); },
      );
    }
  };

  return (
    <div>
      <PageHeader title={t('classes.titre')} subtitle={t('classes.nbClasses', { count: total })}>
        <ExportMenu
          csvUrl={`/export/classes/csv${filterNiveau ? `?niveau=${encodeURIComponent(filterNiveau)}` : ''}`}
          xlsxUrl={`/export/classes/xlsx${filterNiveau ? `?niveau=${encodeURIComponent(filterNiveau)}` : ''}`}
        />
        {!readOnly && <Button as="link" to="/classes/nouvelle" variant="primary">{t('classes.nouvelleClasse')}</Button>}
      </PageHeader>

      {deleteError && <Alert variant="error">{deleteError}</Alert>}

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('classes.filtrer')}</span>
        {niveauOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`niveau-filter-btn ${filterNiveau === opt.value ? 'niveau-filter-btn-active' : ''}`}
            onClick={() => handleNiveauFilter(opt.value as string)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {total === 0 && filterNiveau ? (
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message={t('classes.aucuneClasseNiveau', { niveau: filterNiveau })}
          action={<Button variant="secondary" onClick={() => handleNiveauFilter('')}>{t('classes.voirToutes')}</Button>} />
      ) : total === 0 ? (
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message={t('classes.aucuneClasse')}
          action={!readOnly ? <Button as="link" to="/classes/nouvelle" variant="primary">{t('classes.creerClasse')}</Button> : undefined} />
      ) : (
        <>
          <div className="classes-grid">
            {items.map((c: any) => (
              <ClasseCard key={c.id} classe={c} onDelete={readOnly ? () => {} : (id) => desactiverClasse(id, setDeleteError)} onEdit={readOnly ? undefined : openEdit} readOnly={readOnly} />
            ))}
            {!readOnly && page === totalPages && <AddCard to="/classes/nouvelle" label={t('classes.nouvelleClasse')} />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}

      {editClasse && (
        <Modal title={t('classes.modifierClasse', { nom: editClasse.nom })} onClose={() => setEditClasse(null)} maxWidth={520}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setEditClasse(null)}>{t('common.annuler')}</Button>
              <Button type="submit" form="edit-classe-form" variant="primary" disabled={editSubmitting || !editNom.trim() || (editIsFixe && !editSalleId)} loading={editSubmitting}>
                {t('common.enregistrer')}
              </Button>
            </>
          }
        >
          {editError && <Alert variant="error">{editError}</Alert>}
          <form id="edit-classe-form" onSubmit={handleEditSubmit}>
            <Input label={t('classes.form.nom')} value={editNom} onChange={e => setEditNom(e.target.value)} required />
            <Select label={t('classes.form.modeSalle')} value={editSalleType} onChange={e => setEditSalleType(e.target.value as SalleType)} options={SALLE_TYPES} />
            {editIsFixe ? (
              <>
                <Select label={t('classes.form.salleAssignee')} value={editSalleId} onChange={e => setEditSalleId(e.target.value)} options={salleOptions} placeholder={t('classes.form.choisirSalle')} />
                {selectedSalle && (
                  <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
                    background: editCapacite > selectedSalle.capacite ? 'var(--warning-light)' : 'var(--success-light)',
                    border: `1px solid ${editCapacite > selectedSalle.capacite ? '#fde68a' : '#bbf7d0'}`,
                    color: editCapacite > selectedSalle.capacite ? 'var(--warning)' : 'var(--success)',
                  }}>
                    <strong>{selectedSalle.nom}</strong> — {selectedSalle.capacite} places
                    {editCapacite > selectedSalle.capacite && <span> · {t('classes.form.depassement', { val: editCapacite - selectedSalle.capacite })}</span>}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
                background: 'var(--info-light)', border: '1px solid #a5f3fc', color: 'var(--info)',
              }}>
                {t('classes.form.salleVariable')}
              </div>
            )}
            <Input label={t('classes.form.capacite')} type="number" value={editCapacite} onChange={e => setEditCapacite(Number(e.target.value))} min={1} max={200} />
          </form>
        </Modal>
      )}
    </div>
  );
}
