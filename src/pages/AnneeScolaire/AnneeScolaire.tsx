import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAnnees } from '../../contexts/AnneeContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useDashboardData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { Icon } from '../../components/shared/Icon';
import { Input } from '../../components/shared/Input';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { StatItem } from '../../components/shared/StatItem';
import { PipelineStep, PipelineArrow } from '../../components/shared/PipelineStep';
import { AuditEntry } from '../../components/shared/AuditEntry';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { AnneeScolaire as AnneeScolaireType, AnneeStatut, BadgeVariant } from '../../types';
import { formatDate } from '../../utils/helpers';

const auditColor = (action: string) => action === 'cloture' ? 'var(--danger)' : action === 'demarrage' ? 'var(--success)' : 'var(--primary)';

export function AnneeScolairePage() {
  const { t } = useTranslation();
  const { annees, loading, active, preparation, create, demarrer, terminer, delete: deleteAnnee } = useAnnees();
  const { data: dashData } = useDashboardData();
  const { viewAnnee, isViewingArchive, viewing } = useViewing();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const statutConfig: Record<AnneeStatut, { label: string; variant: BadgeVariant; icon: string }> = {
    active: { label: t('anneeScolaire.statuts.active'), variant: 'success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    preparation: { label: t('anneeScolaire.statuts.preparation'), variant: 'warning', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    terminee: { label: t('anneeScolaire.statuts.terminee'), variant: 'default', icon: 'M5 13l4 4L19 7' },
  };

  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formDebut, setFormDebut] = useState('');
  const [formFin, setFormFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleTerminer = async (annee: AnneeScolaireType) => {
    clearMessages();
    const ok = await confirm({
      title: t('anneeScolaire.terminerTitre'),
      message: t('anneeScolaire.terminerMsg', { label: annee.label }),
      confirmText: t('anneeScolaire.terminerBtn'),
      variant: 'warning',
    });
    if (!ok) return;
    const ok2 = await confirm({
      title: t('anneeScolaire.confirmerTitre'),
      message: t('anneeScolaire.confirmerMsg', { label: annee.label }),
      confirmText: t('anneeScolaire.confirmerBtn'),
      variant: 'danger',
    });
    if (!ok2) return;
    setSubmitting(true);
    await terminer(
      annee.id,
      (n) => { setSuccess(t('anneeScolaire.successTerminer', { label: annee.label, next: n.label })); setSubmitting(false); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  const handleDemarrer = async (annee: AnneeScolaireType) => {
    clearMessages();
    const ok = await confirm({
      title: t('anneeScolaire.demarrerTitre'),
      message: t('anneeScolaire.demarrerMsg', { label: annee.label }),
      confirmText: t('anneeScolaire.demarrerBtn'),
      variant: 'info',
    });
    if (!ok) return;
    setSubmitting(true);
    await demarrer(
      annee.id,
      () => { setSuccess(t('anneeScolaire.successDemarrer', { label: annee.label })); setSubmitting(false); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  const handleDelete = async (annee: AnneeScolaireType) => {
    clearMessages();
    const ok = await confirm({
      title: t('anneeScolaire.supprimerTitre'),
      message: t('anneeScolaire.confirmSupprimer', { label: annee.label }),
      confirmText: t('anneeScolaire.actions.supprimer'),
      variant: 'danger',
    });
    if (!ok) return;
    await deleteAnnee(annee.id, (err) => setError(err));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    if (!formLabel || !formDebut || !formFin) { setError(t('anneeScolaire.champsRequis')); return; }
    setSubmitting(true);
    await create(
      { label: formLabel, debut: formDebut, fin: formFin },
      () => {
        setSuccess(t('anneeScolaire.successCreer', { label: formLabel }));
        setShowForm(false); setFormLabel(''); setFormDebut(''); setFormFin(''); setSubmitting(false);
      },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  if (loading) return <PageLoader />;

  const activeClasses = dashData?.stats?.classes || 0;
  const activeEleves = dashData?.stats?.eleves || 0;
  const activeNotes = dashData?.stats?.notes || 0;

  return (
    <div>
      <PageHeader title={t('anneeScolaire.titre')} subtitle={t('anneeScolaire.sousTitre')}>
        {!isViewingArchive && !showForm && !preparation && <Button variant="primary" onClick={() => setShowForm(true)}>{t('anneeScolaire.preparer')}</Button>}
      </PageHeader>

      {isViewingArchive && (
        <Alert variant="info">Consultation de l'archive « {viewing?.label} » — lecture seule.</Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!isViewingArchive && showForm && (
        <Card className="annee-prepare-section">
          <h3 className="annee-prepare-title">{t('anneeScolaire.preparerTitre')}</h3>
          <form onSubmit={handleCreate}>
            <FormGrid columns={3}>
              <Input label={t('anneeScolaire.form.label')} value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder={t('anneeScolaire.form.labelPlaceholder')} required />
              <Input label={t('anneeScolaire.form.debut')} type="date" value={formDebut} onChange={e => setFormDebut(e.target.value)} required />
              <Input label={t('anneeScolaire.form.fin')} type="date" value={formFin} onChange={e => setFormFin(e.target.value)} required />
            </FormGrid>
            <FormActions>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>{t('common.annuler')}</Button>
              <Button type="submit" variant="primary" loading={submitting}>{t('anneeScolaire.form.creerBtn')}</Button>
            </FormActions>
          </form>
        </Card>
      )}

      {/* Pipeline */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 className="annee-card-section-title">{t('anneeScolaire.cycleTransition')}</h3>
        <div className="annee-pipeline">
          {(['active', 'terminee', 'preparation'] as AnneeStatut[]).map((s, i) => (
            <div key={s} className="d-flex-center" style={{ gap: '0.5rem' }}>
              <PipelineStep label={statutConfig[s].label} active={active?.statut === s || preparation?.statut === s} />
              {i < 2 && <PipelineArrow />}
            </div>
          ))}
        </div>
      </Card>

      {/* Année active */}
      {active && (
        <Card className="annee-active-card">
          <div className="annee-active-header">
            <div className="annee-active-info">
              <div className="annee-active-title-row">
                <div className="annee-active-icon">
                  <Icon path={statutConfig.active.icon} size={20} />
                </div>
                <div>
                  <h3 className="annee-active-name">{active.label}</h3>
                  <Badge label={t('anneeScolaire.anneeActive')} variant="success" />
                </div>
              </div>
              <div className="annee-active-stats">
                <StatItem label={t('anneeScolaire.colonnes.periode')} value={`${formatDate(active.debut)} → ${formatDate(active.fin)}`} />
                <StatItem label={t('anneeScolaire.colonnes.classes')} value={activeClasses} />
                <StatItem label={t('anneeScolaire.colonnes.eleves')} value={activeEleves} />
                <StatItem label={t('anneeScolaire.colonnes.notes')} value={activeNotes} />
              </div>
            </div>
            {!isViewingArchive && <Button variant="danger" onClick={() => handleTerminer(active)} disabled={submitting} loading={submitting}>{t('anneeScolaire.actions.terminer')}</Button>}
          </div>
        </Card>
      )}

      {/* En préparation */}
      {preparation && (
        <Card className="annee-prep-card">
          <div className="annee-prep-header">
            <div className="annee-prep-info">
              <div className="annee-prep-title-row">
                <div className="annee-prep-icon">
                  <Icon path={statutConfig.preparation.icon} size={20} />
                </div>
                <div>
                  <h3 className="annee-prep-name">{preparation.label}</h3>
                  <Badge label={t('anneeScolaire.enPreparation')} variant="warning" />
                </div>
              </div>
              <StatItem label={t('anneeScolaire.colonnes.periode')} value={`${formatDate(preparation.debut)} → ${formatDate(preparation.fin)}`} />
            </div>
            {!isViewingArchive && (
              <div className="annee-prep-actions">
                {!active && <Button variant="primary" onClick={() => handleDemarrer(preparation)} disabled={submitting} loading={submitting}>{t('anneeScolaire.demarrerEmoji')}</Button>}
                <Button variant="danger" size="sm" onClick={() => handleDelete(preparation)}>{t('anneeScolaire.actions.supprimer')}</Button>
              </div>
            )}
          </div>
          {active && <Alert variant="info" icon={false}>{t('anneeScolaire.attente', { active: active.label, prep: preparation.label })}</Alert>}
        </Card>
      )}

      {/* Historique */}
      <Card>
        <h3 className="annee-prepare-title">{t('anneeScolaire.historique')}</h3>
        <div className="annee-historique-list">
          {annees.map(annee => {
            const cfg = statutConfig[annee.statut];
            return (
              <div key={annee.id} className={`annee-historique-item${annee.statut === 'active' ? ' active' : ''}`}>
                <div className="annee-historique-item-left">
                  <Badge label={cfg.label} variant={cfg.variant} />
                  <span className="annee-historique-label">{annee.label}</span>
                  <span className="annee-historique-dates">{formatDate(annee.debut)} → {formatDate(annee.fin)}</span>
                </div>
                <div className="annee-historique-item-right">
                  <span className="annee-historique-count">{t('anneeScolaire.nbActions', { count: annee.historique.length })}</span>
                  {annee.statut === 'terminee' && (
                    <Button variant="outline" size="sm" onClick={async () => { await viewAnnee(annee); navigate('/dashboard'); }}>{t('anneeScolaire.actions.consulter')}</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Journal d'audit */}
      <Card style={{ marginTop: '1rem' }}>
        <h3 className="annee-prepare-title">{t('anneeScolaire.journalAudit')}</h3>
        <div className="annee-audit-container">
          {annees.flatMap(a => a.historique.map(h => ({ ...h, anneeLabel: a.label }))).sort((a, b) => b.date.localeCompare(a.date)).map((entry, i) => (
            <AuditEntry key={i} details={entry.details} date={entry.date} context={entry.anneeLabel} color={auditColor(entry.action)} />
          ))}
          {annees.every(a => a.historique.length === 0) && (
            <p className="annee-audit-empty">{t('anneeScolaire.aucunEvenement')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
