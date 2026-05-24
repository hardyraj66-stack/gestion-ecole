import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useClasses } from '../../contexts/ClasseContext';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { SalleType } from '../../types';
import { readApi } from '../../services/readApi';
import { getTypeLabel } from '../../utils/helpers';

const SALLE_TYPES: SelectOption[] = [
  { value: 'fixe', label: 'Salle fixe (toujours la même)' },
  { value: 'variable', label: 'Salle variable (selon l\'emploi du temps)' },
];

export function CreateClasse() {
  const navigate = useNavigate();
  const { isViewingArchive } = useViewing();
  const { create } = useClasses();
  const { salles, loading: sallesLoading, getAll: fetchSalles } = useSalles();
  const confirm = useConfirm();

  const [niveauxOptions, setNiveauxOptions] = useState<SelectOption[]>([]);
  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [capacite, setCapacite] = useState(30);
  const [salleType, setSalleType] = useState<SalleType>('fixe');
  const [salleId, setSalleId] = useState('');

  const [sallesOccupees, setSallesOccupees] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const salleOptions: SelectOption[] = salles.map(s => {
    const occupee = sallesOccupees.includes(s.nom);
    return {
      value: s.id,
      label: occupee ? `${s.nom} — déjà assignée` : `${s.nom} — ${s.capacite} places (${getTypeLabel(s.type)})`,
      disabled: occupee,
    };
  });

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSalles();
    // Récupère toutes les salles déjà assignées en fixe
    fetch('http://localhost:3000/read/classes?limit=1000')
      .then(r => r.json())
      .then((res: any) => {
        const occupees: string[] = (res.sallesOccupees ?? []).map((o: any) => o.salle as string);
        setSallesOccupees(occupees);
      })
      .catch(() => {});
  }, [fetchSalles]);

  useEffect(() => {
    readApi.niveaux().then((res: any) => {
      if (res && Array.isArray(res)) {
        // Niveaux configurés en priorité, sinon tous (orphelins depuis les classes)
        const all = res.map((n: any) => n.nom ?? n.niveau).filter(Boolean);
        const opts: SelectOption[] = all.map((n: string) => ({ value: n, label: n }));
        setNiveauxOptions(opts);
        if (opts.length > 0) setNiveau(prev => prev || (opts[0].value as string));
      }
    });
  }, []);

  useEffect(() => {
    if (salles.length > 0 && !salleId) {
      const libre = salles.find(s => !sallesOccupees.includes(s.nom));
      setSalleId(libre?.id ?? salles[0].id);
    }
  }, [salles, salleId, sallesOccupees]);

  if (isViewingArchive) return <Navigate to="/classes" replace />;

  const isFixe = salleType === 'fixe';
  const selectedSalle = salles.find(s => s.id === salleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError('Le nom est obligatoire.'); return; }

    if (isFixe) {
      if (!salleId || !selectedSalle) { setError('Sélectionnez une salle.'); return; }
      if (capacite > selectedSalle.capacite) {
        const ok = await confirm({
          title: 'Capacité supérieure à la salle',
          message: `La salle « ${selectedSalle.nom} » a ${selectedSalle.capacite} places mais vous définissez ${capacite} élèves.\n\nContinuer ?`,
          confirmText: 'Confirmer', variant: 'warning',
        });
        if (!ok) return;
      }
    }

    setSubmitting(true); setError('');
    await create(
      { nom: nom.trim(), niveau, capacite, salle: isFixe ? selectedSalle!.nom : '', salle_type: salleType },
      () => { setSuccess(true); setTimeout(() => navigate('/classes'), 1500); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  return (
    <div>
      <PageHeader title="Nouvelle classe" subtitle="Créer une nouvelle classe">
        <Button as="link" to="/classes" variant="secondary">← Retour</Button>
      </PageHeader>

      <Card style={{ maxWidth: '600px' }}>
        {success && <Alert variant="success">Classe créée avec succès ! Redirection…</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input label="Nom de la classe *" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : 6ème A" required />

          <FormGrid>
            {niveauxOptions.length === 0
              ? <Select label="Niveau *" value="" options={[]} placeholder="Chargement…" disabled />
              : <Select label="Niveau *" value={niveau} onChange={e => setNiveau(e.target.value)} options={niveauxOptions} />
            }
          </FormGrid>
          <div style={{ padding: '0.5rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem',
            background: 'var(--info-light)', border: '1px solid #a5f3fc', borderRadius: 'var(--radius-sm)', color: 'var(--info)',
          }}>
            La classe sera automatiquement créée pour l'année scolaire active.
          </div>

          <Input label="Capacité maximale *" type="number" value={capacite} onChange={e => setCapacite(Number(e.target.value))} min={1} max={200} />

          <Select label="Mode de salle *" value={salleType} onChange={e => setSalleType(e.target.value as SalleType)} options={SALLE_TYPES} />

          {/* Salle visible UNIQUEMENT en mode fixe */}
          {isFixe && (
            <>
              {sallesLoading ? (
                <Select label="Salle assignée *" value="" options={[]} placeholder="Chargement…" disabled hint="Récupération en cours…" />
              ) : salles.length === 0 ? (
                <div className="form-group">
                  <label className="form-label">Salle assignée *</label>
                  <select disabled><option>Aucune salle disponible</option></select>
                  <p className="form-hint">
                    Aucune salle enregistrée.{' '}
                    <Link to="/salles" style={{ color: 'var(--primary)' }}>Créer une salle</Link>
                  </p>
                </div>
              ) : (
                <Select label="Salle assignée *" value={salleId} onChange={e => setSalleId(e.target.value)} options={salleOptions} />
              )}

              {selectedSalle && (
                <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
                  background: capacite > selectedSalle.capacite ? 'var(--warning-light)' : 'var(--success-light)',
                  border: `1px solid ${capacite > selectedSalle.capacite ? '#fde68a' : '#bbf7d0'}`,
                  color: capacite > selectedSalle.capacite ? 'var(--warning)' : 'var(--success)',
                }}>
                  <strong>{selectedSalle.nom}</strong> — {selectedSalle.capacite} places
                  {capacite > selectedSalle.capacite && <span> · ⚠ Dépassement de {capacite - selectedSalle.capacite}</span>}
                </div>
              )}
            </>
          )}

          {!isFixe && (
            <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
              background: 'var(--info-light)', border: '1px solid #a5f3fc', color: 'var(--info)',
            }}>
              En mode variable, la salle sera déterminée dynamiquement selon le planning.
            </div>
          )}

          <FormActions>
            <Button as="link" to="/classes" variant="secondary">Annuler</Button>
            <Button type="submit" variant="primary" disabled={submitting || success || (isFixe && salles.length === 0)} loading={submitting}>
              Créer la classe
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
