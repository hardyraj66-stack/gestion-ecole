import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClasses } from '../../contexts/ClasseContext';
import { useSalles } from '../../contexts/SalleContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useAnneeScolaireStatus } from '../../hooks/useAnneeScolaireStatus';
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

export function CreateClasse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isViewingArchive } = useViewing();
  const { isTerminee } = useAnneeScolaireStatus();
  const { create } = useClasses();
  const { salles, loading: sallesLoading, getAll: fetchSalles } = useSalles();
  const confirm = useConfirm();

  const SALLE_TYPES: SelectOption[] = [
    { value: 'fixe', label: t('classes.form.salleFixe') },
    { value: 'variable', label: t('classes.form.salleVariableLabel') },
  ];

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

  const readOnly = isViewingArchive || isTerminee;
  if (readOnly) return <Navigate to="/classes" replace />;

  const isFixe = salleType === 'fixe';
  const selectedSalle = salles.find(s => s.id === salleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError(t('classes.erreurs.nomObligatoire')); return; }

    if (isFixe) {
      if (!salleId || !selectedSalle) { setError(t('classes.erreurs.salleObligatoire')); return; }
      if (capacite > selectedSalle.capacite) {
        const ok = await confirm({
          title: t('classes.erreurs.capaciteDepassee'),
          message: t('classes.confirmCapacite', { nom: selectedSalle.nom, capacite: selectedSalle.capacite, saisi: capacite }),
          confirmText: t('common.confirmer'), variant: 'warning',
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
      <PageHeader title={t('classes.creer.titre')} subtitle={t('classes.creer.sousTitre')}>
        <Button as="link" to="/classes" variant="secondary">{t('common.retour')}</Button>
      </PageHeader>

      <Card style={{ maxWidth: '600px' }}>
        {success && <Alert variant="success">{t('classes.creer.succes')}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input label={t('classes.form.nom')} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : 6ème A" required />

          <FormGrid>
            {niveauxOptions.length === 0
              ? <Select label={t('classes.form.niveau')} value="" options={[]} placeholder={t('common.chargement')} disabled />
              : <Select label={t('classes.form.niveau')} value={niveau} onChange={e => setNiveau(e.target.value)} options={niveauxOptions} />
            }
          </FormGrid>

          <div style={{ padding: '0.5rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem',
            background: 'var(--info-light)', border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)', borderRadius: 'var(--radius-sm)', color: 'var(--info)',
          }}>
            {t('classes.creer.infoAnnee')}
          </div>

          <Input label={t('classes.form.capacite')} type="number" value={capacite} onChange={e => setCapacite(Number(e.target.value))} min={1} max={200} />

          <Select label={t('classes.form.modeSalle')} value={salleType} onChange={e => setSalleType(e.target.value as SalleType)} options={SALLE_TYPES} />

          {isFixe && (
            <>
              {sallesLoading ? (
                <Select label={t('classes.form.salleAssignee')} value="" options={[]} placeholder={t('common.chargement')} disabled />
              ) : salles.length === 0 ? (
                <div className="form-group">
                  <label className="form-label">{t('classes.form.salleAssignee')}</label>
                  <select disabled><option>{t('classes.creer.aucuneSalle')}</option></select>
                  <p className="form-hint">
                    {t('classes.creer.aucuneSalleInfo')}{' '}
                    <Link to="/salles" style={{ color: 'var(--primary)' }}>{t('classes.creer.creerSalle')}</Link>
                  </p>
                </div>
              ) : (
                <Select label={t('classes.form.salleAssignee')} value={salleId} onChange={e => setSalleId(e.target.value)} options={salleOptions} />
              )}

              {selectedSalle && (
                <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
                  background: capacite > selectedSalle.capacite ? 'var(--warning-light)' : 'var(--success-light)',
                  border: `1px solid color-mix(in srgb, ${capacite > selectedSalle.capacite ? 'var(--warning)' : 'var(--success)'} 30%, transparent)`,
                  color: capacite > selectedSalle.capacite ? 'var(--warning)' : 'var(--success)',
                }}>
                  <strong>{selectedSalle.nom}</strong> — {t('classes.form.salleInfo', { nom: selectedSalle.nom, capacite: selectedSalle.capacite }).replace(selectedSalle.nom + ' — ', '')}
                  {capacite > selectedSalle.capacite && <span> · {t('classes.form.depassementCreation', { val: capacite - selectedSalle.capacite })}</span>}
                </div>
              )}
            </>
          )}

          {!isFixe && (
            <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem',
              background: 'var(--info-light)', border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)', color: 'var(--info)',
            }}>
              {t('classes.form.salleVariableCreation')}
            </div>
          )}

          <FormActions>
            <Button as="link" to="/classes" variant="secondary">{t('common.annuler')}</Button>
            <Button type="submit" variant="primary" disabled={submitting || success || (isFixe && salles.length === 0)} loading={submitting}>
              {t('classes.creer.creerBtn')}
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
