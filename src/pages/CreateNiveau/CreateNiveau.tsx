import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNiveaux as useNiveauxCtx } from '../../contexts/NiveauContext';
import { useViewing } from '../../contexts/ViewingContext';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { MatierePills } from '../../components/shared/MatierePills';

export function CreateNiveau() {
  const { t } = useTranslation();
  const { isViewingArchive } = useViewing();
  const navigate = useNavigate();
  const { create } = useNiveauxCtx();

  const [nom, setNom] = useState('');
  const [ordre, setOrdre] = useState('0');
  const [description, setDescription] = useState('');
  const [matiereIds, setMatiereIds] = useState<string[]>([]);
  const [allMatieres, setAllMatieres] = useState<{ id: string; nom: string; code: string }[]>([]);
  const [niveauxCount, setNiveauxCount] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    readApi.matieresList(1, 200).then((res: any) => {
      if (res?.items) setAllMatieres(res.items.map((m: any) => ({ id: m.id, nom: m.nom, code: m.code })));
    });
    readApi.niveaux().then((res: any) => {
      if (res && Array.isArray(res)) setNiveauxCount(res.length);
    });
  }, []);

  if (isViewingArchive) return <Navigate to="/niveaux" replace />;

  const toggleMatiere = (id: string) => {
    setMatiereIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError(t('niveaux.erreurs.nomRequis')); return; }
    const ordreVal = parseInt(ordre) || 0;
    if (ordreVal < 0 || ordreVal > niveauxCount) {
      setError(t('niveaux.erreurs.ordreInvalide', { max: niveauxCount }));
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await create({
      nom: nom.trim(),
      ordre: ordreVal,
      description,
      matiere_ids: matiereIds,
    });
    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => navigate('/niveaux'), 1200);
    } else {
      setError(result.error || t('niveaux.erreurCreation'));
    }
  };

  return (
    <div>
      <PageHeader title={t('niveaux.creer.titre')} subtitle={t('niveaux.creer.sousTitre')} />

      <Card style={{ maxWidth: 600 }}>
        {success && <Alert variant="success">{t('niveaux.creer.succes')}</Alert>}

        <form onSubmit={handleSubmit}>
          <FormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label={t('niveaux.creer.form.nom')}
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder={t('niveaux.creer.form.nomPlaceholder')}
                required
              />
            </div>

            <Input
              label={t('niveaux.creer.form.ordre')}
              type="number"
              value={ordre}
              onChange={e => setOrdre(e.target.value)}
              placeholder="0"
              min={0}
              max={niveauxCount}
              hint={t('niveaux.creer.ordreEntre', { max: niveauxCount })}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label={t('niveaux.creer.form.description')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('niveaux.creer.form.descriptionPlaceholder')}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                {t('niveaux.creer.form.matieres')}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  {t('niveaux.creer.form.matieresInfo')}
                </span>
              </label>
              <div style={{ marginTop: '0.4rem', maxHeight: 220, overflowY: 'auto', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                {allMatieres.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{t('niveaux.creer.form.chargementMatieres')}</span>
                ) : (
                  <MatierePills
                    matieres={allMatieres}
                    selectedIds={matiereIds}
                    onToggle={toggleMatiere}
                  />
                )}
              </div>
              {matiereIds.length > 0 && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('niveaux.creer.form.nbMatieres', { count: matiereIds.length })}
                  {' — '}{t('niveaux.creer.matieresInfo')}
                </p>
              )}
            </div>
          </FormGrid>

          {error && <Alert variant="error">{error}</Alert>}

          <FormActions>
            <Button type="button" variant="secondary" onClick={() => navigate('/niveaux')} disabled={submitting}>
              {t('common.annuler')}
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !nom.trim()}>
              {submitting ? t('niveaux.creation') : t('niveaux.creer.creerBtn')}
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
