import { useState, useEffect, useRef } from 'react';
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
import { FormActions } from '../../components/shared/FormGrid';
import { SalleType } from '../../types';
import { getTypeLabel } from '../../utils/helpers';
import { ClasseCard } from './ClasseCard';

const SALLE_TYPES: SelectOption[] = [
  { value: 'fixe', label: 'Salle fixe' },
  { value: 'variable', label: 'Salle variable' },
];

export function ClassesList() {
  const { delete: deleteClasse, update: updateClasse } = useClasses();
  const { salles, getAll: fetchSalles } = useSalles();
  const { isViewingArchive: readOnly } = useViewing();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [filterNiveau, setFilterNiveau] = useState('');

  // Edit popup
  const [editClasse, setEditClasse] = useState<any>(null);
  const [editNom, setEditNom] = useState('');
  const [editCapacite, setEditCapacite] = useState(30);
  const [editSalleType, setEditSalleType] = useState<SalleType>('fixe');
  const [editSalleId, setEditSalleId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const { data, loading, error } = useClassesListData(page, '', filterNiveau);

  // Charger les salles au montage pour le formulaire d'édition
  const fetchedSalles = useRef(false);
  useEffect(() => { if (fetchedSalles.current) return; fetchedSalles.current = true; fetchSalles(); }, [fetchSalles]);

  if (loading) return <PageLoader />;
  if (error || !data) return <Alert variant="error">Problème de chargement des classes.</Alert>;

  const { items, total, totalPages, niveaux: availableNiveaux } = data;
  const niveauOptions: SelectOption[] = [
    { value: '', label: 'Tous les niveaux' },
    ...((availableNiveaux || []) as string[]).map((n: string) => ({ value: n, label: n })),
  ];

  const handleNiveauFilter = (n: string) => { setFilterNiveau(n); setPage(1); };

  const salleOptions: SelectOption[] = salles.map(s => ({
    value: s.id,
    label: `${s.nom} — ${s.capacite} places (${getTypeLabel(s.type)})`,
  }));

  const selectedSalle = salles.find(s => s.id === editSalleId);

  const openEdit = (classe: any) => {
    setEditClasse(classe);
    setEditNom(classe.nom);
    setEditCapacite(classe.capacite);
    setEditSalleType(classe.salle_type);
    // Trouver la salle par nom
    const salle = salles.find(s => s.nom === classe.salle);
    setEditSalleId(salle?.id || '');
    setEditError('');
  };

  const editIsFixe = editSalleType === 'fixe';

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClasse || !editNom.trim()) { setEditError('Le nom est obligatoire.'); return; }

    if (editIsFixe) {
      if (!editSalleId) { setEditError('Sélectionnez une salle.'); return; }
      const salle = salles.find(s => s.id === editSalleId);
      if (!salle) { setEditError('Salle invalide.'); return; }

      if (editCapacite > salle.capacite) {
        const ok = await confirm({
          title: 'Capacité supérieure à la salle',
          message: `La salle « ${salle.nom} » a ${salle.capacite} places mais vous définissez ${editCapacite} élèves.\n\nContinuer ?`,
          confirmText: 'Confirmer', variant: 'warning',
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
      // Variable → pas de salle
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
      <PageHeader title="Classes" subtitle={`${total} classe(s)`}>
        {!readOnly && <Button as="link" to="/classes/nouvelle" variant="primary">+ Nouvelle classe</Button>}
      </PageHeader>

      {/* Filtre par niveau */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filtrer :</span>
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
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message={`Aucune classe en ${filterNiveau}`}
          action={<Button variant="secondary" onClick={() => handleNiveauFilter('')}>Voir toutes les classes</Button>} />
      ) : total === 0 ? (
        <EmptyState icon={<Icon path={Icons.building} size={28} />} message="Aucune classe créée"
          action={!readOnly ? <Button as="link" to="/classes/nouvelle" variant="primary">Créer une classe</Button> : undefined} />
      ) : (
        <>
          <div className="classes-grid">
            {items.map((c: any) => (
              <ClasseCard key={c.id} classe={c} onDelete={readOnly ? () => {} : deleteClasse} onEdit={readOnly ? undefined : openEdit} readOnly={readOnly} />
            ))}
            {!readOnly && page === totalPages && <AddCard to="/classes/nouvelle" label="Nouvelle classe" />}
          </div>
          <Pagination currentPage={page} totalItems={total} pageSize={8} onPageChange={setPage} />
        </>
      )}

      {/* ===== POPUP ÉDITION ===== */}
      {editClasse && (
        <div className="classe-popup-overlay" onClick={() => setEditClasse(null)}>
          <div className="classe-popup" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="classe-popup-header">
              <h3>Modifier — {editClasse.nom}</h3>
              <button type="button" className="classe-popup-close" onClick={() => setEditClasse(null)}>✕</button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {editError && <Alert variant="error">{editError}</Alert>}
              <form onSubmit={handleEditSubmit}>
                <Input label="Nom de la classe *" value={editNom} onChange={e => setEditNom(e.target.value)} required />

                <Select label="Mode de salle *" value={editSalleType} onChange={e => setEditSalleType(e.target.value as SalleType)} options={SALLE_TYPES} />

                {editIsFixe ? (
                  <>
                    <Select label="Salle assignée *" value={editSalleId} onChange={e => setEditSalleId(e.target.value)} options={salleOptions} placeholder="Choisir une salle" />
                    {selectedSalle && (
                      <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
                        background: editCapacite > selectedSalle.capacite ? 'var(--warning-light)' : 'var(--success-light)',
                        border: `1px solid ${editCapacite > selectedSalle.capacite ? '#fde68a' : '#bbf7d0'}`,
                        color: editCapacite > selectedSalle.capacite ? 'var(--warning)' : 'var(--success)',
                      }}>
                        <strong>{selectedSalle.nom}</strong> — {selectedSalle.capacite} places
                        {editCapacite > selectedSalle.capacite && <span> · ⚠ +{editCapacite - selectedSalle.capacite}</span>}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
                    background: 'var(--info-light)', border: '1px solid #a5f3fc', color: 'var(--info)',
                  }}>
                    La salle sera déterminée dynamiquement selon le planning.
                  </div>
                )}

                <Input label="Capacité maximale *" type="number" value={editCapacite} onChange={e => setEditCapacite(Number(e.target.value))} min={1} max={200} />

                <FormActions>
                  <Button type="button" variant="secondary" onClick={() => setEditClasse(null)}>Annuler</Button>
                  <Button type="submit" variant="primary" disabled={editSubmitting || !editNom.trim() || (editIsFixe && !editSalleId)} loading={editSubmitting}>
                    Enregistrer
                  </Button>
                </FormActions>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
