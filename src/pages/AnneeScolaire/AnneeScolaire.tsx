import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAnnees } from '../../contexts/AnneeContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useDashboardData } from '../../hooks/usePageData';
import { useAnneeScolaireStatus } from '../../hooks/useAnneeScolaireStatus';
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
import { Modal } from '../../components/shared/Modal';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { AnneeScolaire as AnneeScolaireType, AnneeStatut, BadgeVariant } from '../../types';
import { formatDate } from '../../utils/helpers';

const auditColor = (action: string) => {
  if (action === 'cloture' || action === 'cloture_anticipee') return 'var(--danger)';
  if (action === 'demarrage') return 'var(--success)';
  if (action === 'migration') return 'var(--info)';
  return 'var(--primary)';
};

export function AnneeScolairePage() {
  const { t } = useTranslation();
  const { annees, loading, active, preparation, create, updateDates, demarrer, terminer, delete: deleteAnnee, migrerEleves } = useAnnees();
  const { data: dashData } = useDashboardData();
  const { viewAnnee, isViewingArchive, viewing } = useViewing();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { terminaisonPlanifieeAtteinte, terminaisonAnticipee, joursAvantFin } = useAnneeScolaireStatus();

  const statutConfig: Record<AnneeStatut, { label: string; variant: BadgeVariant; icon: string }> = {
    active: { label: t('anneeScolaire.statuts.active'), variant: 'success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    preparation: { label: t('anneeScolaire.statuts.preparation'), variant: 'warning', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    terminee: { label: t('anneeScolaire.statuts.terminee'), variant: 'default', icon: 'M5 13l4 4L19 7' },
  };

  // ── État UI ──────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formDebut, setFormDebut] = useState('');
  const [formFin, setFormFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dates inline de la préparation
  const [editingDates, setEditingDates] = useState(false);
  const [prepDebut, setPrepDebut] = useState('');
  const [prepFin, setPrepFin] = useState('');
  const [savingDates, setSavingDates] = useState(false);

  // Dates inline de l'année active (uniquement fin_planifie)
  const [editingFinActive, setEditingFinActive] = useState(false);
  const [activeFinEdit, setActiveFinEdit] = useState('');
  const [savingFinActive, setSavingFinActive] = useState(false);

  // Migration
  const [showMigrationInput, setShowMigrationInput] = useState(false);
  const [migrationConfirmText, setMigrationConfirmText] = useState('');
  const [migrating, setMigrating] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const year = new Date().getFullYear();
  const openModal = () => {
    setFormLabel(`${year} - ${year + 1}`);
    setFormDebut('');
    setFormFin('');
    setShowModal(true);
    clearMessages();
  };

  // ── Créer une année ───────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (formDebut && formFin && formDebut >= formFin) {
      setError(t('anneeScolaire.champsRequis'));
      return;
    }
    setSubmitting(true);
    await create(
      { label: formLabel || undefined, debut_planifie: formDebut || null, fin_planifie: formFin || null },
      () => { setSuccess(t('anneeScolaire.successCreer', { label: formLabel || `${year} - ${year + 1}` })); setShowModal(false); setSubmitting(false); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  // ── Terminer l'année active ───────────────────────────────────────────────
  const handleTerminer = async (annee: AnneeScolaireType) => {
    clearMessages();

    if (terminaisonAnticipee) {
      const ok1 = await confirm({
        title: t('anneeScolaire.terminerAnticipeTitre'),
        message: t('anneeScolaire.terminerAnticipeMsg', {
          fin_planifie: annee.fin_planifie,
          jours: Math.abs(joursAvantFin ?? 0),
        }),
        confirmText: t('anneeScolaire.terminerAnticipeBtn2'),
        variant: 'danger',
      });
      if (!ok1) return;
    } else {
      const ok1 = await confirm({
        title: t('anneeScolaire.terminerNormalTitre'),
        message: t('anneeScolaire.terminerNormalMsg', { label: annee.label }),
        confirmText: t('anneeScolaire.terminerNormalBtn2'),
        variant: 'warning',
      });
      if (!ok1) return;
    }

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
      () => { setSuccess(t('anneeScolaire.successTerminer', { label: annee.label })); setSubmitting(false); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  // ── Démarrer ──────────────────────────────────────────────────────────────
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
      () => { setSubmitting(false); window.location.reload(); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  // ── Supprimer ─────────────────────────────────────────────────────────────
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

  // ── Enregistrer dates préparation ─────────────────────────────────────────
  const handleSaveDatesPrep = async () => {
    if (!preparation) return;
    if (prepDebut && prepFin && prepDebut >= prepFin) {
      setError(t('anneeScolaire.champsRequis'));
      return;
    }
    setSavingDates(true);
    await updateDates(
      preparation.id,
      { debut_planifie: prepDebut || null, fin_planifie: prepFin || null },
      () => { setEditingDates(false); setSavingDates(false); },
      (err) => { setError(err); setSavingDates(false); },
    );
  };

  // ── Enregistrer fin planifiée active ─────────────────────────────────────
  const handleSaveFinActive = async () => {
    if (!active) return;
    setSavingFinActive(true);
    await updateDates(
      active.id,
      { fin_planifie: activeFinEdit || null },
      () => { setEditingFinActive(false); setSavingFinActive(false); },
      (err) => { setError(err); setSavingFinActive(false); },
    );
  };

  // ── Migration ─────────────────────────────────────────────────────────────
  const migrationTarget = preparation;

  const handleMigrationActive = () => {
    clearMessages();
    setShowMigrationInput(true);
  };

  const handleMigrationValiderActive = async () => {
    if (!active || migrationConfirmText !== 'CONFIRMER') return;
    setMigrating(true);
    setShowMigrationInput(false);
    setMigrationConfirmText('');
    await migrerEleves(
      active.id,
      (r) => { setSuccess(t('anneeScolaire.migrationElevesSuccess', { count: r.eleves })); setMigrating(false); },
      (err) => { setError(err); setMigrating(false); },
    );
  };

  const handleMigration = async () => {
    if (!migrationTarget) return;
    clearMessages();

    const ok1 = window.confirm(t('anneeScolaire.migrationConfirm1'));
    if (!ok1) return;
    const ok2 = window.confirm(t('anneeScolaire.migrationConfirm2', { label: migrationTarget.label }));
    if (!ok2) return;

    setShowMigrationInput(true);
  };

  const handleMigrationValider = async () => {
    if (!migrationTarget || migrationConfirmText !== 'CONFIRMER') return;
    setMigrating(true);
    setShowMigrationInput(false);
    setMigrationConfirmText('');
    await migrerEleves(
      migrationTarget.id,
      (r) => { setSuccess(t('anneeScolaire.migrationClasses', { count: r.classes })); setMigrating(false); },
      (err) => { setError(err); setMigrating(false); },
    );
  };

  if (loading) return <PageLoader />;

  const activeClasses = dashData?.stats?.classes || 0;
  const activeEleves  = dashData?.stats?.eleves  || 0;
  const activeNotes   = dashData?.stats?.notes   || 0;

  // Couleur du bouton Terminer
  const terminerVariant = terminaisonAnticipee ? 'danger' : terminaisonPlanifieeAtteinte ? 'primary' : 'outline';
  const terminerLabel   = terminaisonAnticipee
    ? t('anneeScolaire.terminerAnticipeBtn')
    : t('anneeScolaire.terminerNormalBtn');

  return (
    <div>
      <PageHeader title={t('anneeScolaire.titre')} subtitle={t('anneeScolaire.sousTitre')}>
        {!isViewingArchive && !preparation && !active && annees.length === 0 && (
          <Button variant="primary" onClick={openModal}>{t('anneeScolaire.preparer')}</Button>
        )}
      </PageHeader>

      {isViewingArchive && (
        <Alert variant="info">Consultation de l'archive « {viewing?.label} » — lecture seule.</Alert>
      )}
      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* ── Modal nouvelle année ──────────────────────────────────────────── */}
      {showModal && (
        <Modal
          title={t('anneeScolaire.preparerTitre')}
          onClose={() => setShowModal(false)}
          footer={
            <FormActions>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t('common.annuler')}</Button>
              <Button type="submit" form="form-nouvelle-annee" variant="primary" loading={submitting}>{t('anneeScolaire.form.creerBtn')}</Button>
            </FormActions>
          }
        >
          <form id="form-nouvelle-annee" onSubmit={handleCreate}>
            <FormGrid columns={1}>
              <Input
                label={t('anneeScolaire.form.label')}
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
                placeholder={t('anneeScolaire.form.labelPlaceholder')}
              />
              <FormGrid columns={2}>
                <Input
                  label={t('anneeScolaire.form.debut')}
                  type="date"
                  value={formDebut}
                  onChange={e => setFormDebut(e.target.value)}
                />
                <Input
                  label={t('anneeScolaire.form.fin')}
                  type="date"
                  value={formFin}
                  onChange={e => setFormFin(e.target.value)}
                />
              </FormGrid>
            </FormGrid>
          </form>
        </Modal>
      )}

      {/* ── Pipeline de transition ───────────────────────────────────────── */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 className="annee-card-section-title">{t('anneeScolaire.pipelineTitre', { defaultValue: 'Pipeline de transition' })}</h3>
        <div className="annee-pipeline">
          {(['preparation', 'active', 'terminee'] as AnneeStatut[]).map((s, i) => {
            const isCurrentStep =
              s === 'active' ? !!active :
              s === 'preparation' ? (!!preparation && !active) :
              s === 'terminee' ? (!active && !preparation && annees.some(a => a.statut === 'terminee')) :
              false;
            return (
              <div key={s} className="d-flex-center" style={{ gap: '0.5rem' }}>
                <PipelineStep label={statutConfig[s].label} active={isCurrentStep} />
                {i < 2 && <PipelineArrow />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Section : Année TERMINÉE (pas encore de nouvelle préparation) ── */}
      {!isViewingArchive && !active && !preparation && annees.some(a => a.statut === 'terminee') && (
        <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-success, var(--success))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--success)' }}>
                ✅ {t('anneeScolaire.anneeTermineeTitre', { label: annees.find(a => a.statut === 'terminee')?.label })}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('anneeScolaire.anneeTermineeMsg')}
              </p>
            </div>
            <Button variant="primary" onClick={openModal}>
              {t('anneeScolaire.preparerSuivante')}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Section : Année ACTIVE ───────────────────────────────────────── */}
      {active && (
        <Card className="annee-active-card" style={{ marginBottom: '1.5rem' }}>
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

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <StatItem label={t('anneeScolaire.debutPlanifie')} value={active.debut_planifie ? formatDate(active.debut_planifie) : '—'} />
                <StatItem label={t('anneeScolaire.debutReel')} value={active.debut_reel ? formatDate(active.debut_reel) : '—'} />
                {editingFinActive ? (
                  <div>
                    <Input
                      label={t('anneeScolaire.finPlanifie')}
                      type="date"
                      value={activeFinEdit}
                      onChange={e => setActiveFinEdit(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button size="sm" variant="primary" loading={savingFinActive} onClick={handleSaveFinActive}>{t('anneeScolaire.enregistrerDates')}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingFinActive(false)}>{t('common.annuler')}</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <StatItem label={t('anneeScolaire.finPlanifie')} value={active.fin_planifie ? formatDate(active.fin_planifie) : '—'} />
                    {!isViewingArchive && (
                      <Button size="sm" variant="outline" onClick={() => { setActiveFinEdit(active.fin_planifie ?? ''); setEditingFinActive(true); }}>
                        {t('common.modifier')}
                      </Button>
                    )}
                  </div>
                )}
                <StatItem label={t('anneeScolaire.finReel')} value={active.fin_reel ? formatDate(active.fin_reel) : '—'} />
              </div>

              <div className="annee-active-stats" style={{ marginTop: '0.75rem' }}>
                <StatItem label={t('anneeScolaire.colonnes.classes')} value={activeClasses} />
                <StatItem label={t('anneeScolaire.colonnes.eleves')} value={activeEleves} />
                <StatItem label={t('anneeScolaire.colonnes.notes')} value={activeNotes} />
              </div>

            </div>

            {!isViewingArchive && (
              <Button
                variant={terminerVariant}
                onClick={() => handleTerminer(active)}
                disabled={submitting}
                loading={submitting}
              >
                {terminerLabel}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ── Section : Année en PREPARATION ──────────────────────────────── */}
      {preparation && (
        <Card className="annee-prep-card" style={{ marginBottom: '1.5rem' }}>
          <div className="annee-prep-header">
            <div className="annee-prep-info" style={{ flex: 1 }}>
              <div className="annee-prep-title-row">
                <div className="annee-prep-icon">
                  <Icon path={statutConfig.preparation.icon} size={20} />
                </div>
                <div>
                  <h3 className="annee-prep-name">{preparation.label}</h3>
                  <Badge label={t('anneeScolaire.enPreparation')} variant="warning" />
                </div>
              </div>

              {/* ── Dates ── */}
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Dates</p>
                {editingDates ? (
                  <div>
                    <FormGrid columns={2}>
                      <Input label={t('anneeScolaire.debutPlanifie')} type="date" value={prepDebut} onChange={e => setPrepDebut(e.target.value)} />
                      <Input label={t('anneeScolaire.finPlanifie')} type="date" value={prepFin} onChange={e => setPrepFin(e.target.value)} />
                    </FormGrid>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button size="sm" variant="primary" loading={savingDates} onClick={handleSaveDatesPrep}>{t('anneeScolaire.enregistrerDates')}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingDates(false)}>{t('common.annuler')}</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatItem label={t('anneeScolaire.debutPlanifie')} value={preparation.debut_planifie ? formatDate(preparation.debut_planifie) : '—'} />
                    <StatItem label={t('anneeScolaire.finPlanifie')} value={preparation.fin_planifie ? formatDate(preparation.fin_planifie) : '—'} />
                    {!isViewingArchive && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setPrepDebut(preparation.debut_planifie ?? '');
                        setPrepFin(preparation.fin_planifie ?? '');
                        setEditingDates(true);
                      }}>
                        {t('anneeScolaire.modifierDates')}
                      </Button>
                    )}
                  </div>
                )}
              </div>


              {/* ── Démarrage ── */}
              {!isViewingArchive && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {!active ? (
                    <Button variant="primary" onClick={() => handleDemarrer(preparation)} disabled={submitting} loading={submitting}>
                      {t('anneeScolaire.commencer')}
                    </Button>
                  ) : (
                    <Alert variant="info" icon={false}>{t('anneeScolaire.enAttenteActive', { active: active.label })}</Alert>
                  )}
                  {!active && (
                    <Button variant="danger" size="sm" onClick={() => handleDelete(preparation)}>
                      {t('anneeScolaire.actions.supprimer')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Section : Réinscriptions ─────────────────────────────────────── */}
      {!isViewingArchive && preparation && (
        <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Réinscriptions — {preparation.label}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Gérez les réinscriptions des élèves pour la nouvelle année scolaire.
              </p>
            </div>
            <Button as="link" to="/eleves" variant="outline">
              Gérer les réinscriptions
            </Button>
          </div>
        </Card>
      )}

      {/* ── Historique des années ────────────────────────────────────────── */}
      <Card style={{ marginBottom: '1rem' }}>
        <h3 className="annee-prepare-title">{t('anneeScolaire.historique')}</h3>
        <div className="annee-historique-list">
          {annees.map(annee => {
            const cfg = statutConfig[annee.statut];
            return (
              <div key={annee.id} className={`annee-historique-item${annee.statut === 'active' ? ' active' : ''}`}>
                <div className="annee-historique-item-left">
                  <Badge label={cfg.label} variant={cfg.variant} />
                  <span className="annee-historique-label">{annee.label}</span>
                  <span className="annee-historique-dates">
                    {annee.debut_planifie ? formatDate(annee.debut_planifie) : '—'} → {annee.fin_planifie ? formatDate(annee.fin_planifie) : '—'}
                  </span>
                </div>
                <div className="annee-historique-item-right">
                  <span className="annee-historique-count">{t('anneeScolaire.nbActions', { count: annee.historique.length })}</span>
                  {annee.statut === 'terminee' && (
                    <Button variant="outline" size="sm" onClick={async () => { await viewAnnee(annee); navigate('/dashboard'); }}>
                      {t('anneeScolaire.actions.consulter')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {annees.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>{t('anneeScolaire.aucunEvenement')}</p>
          )}
        </div>
      </Card>

      {/* ── Journal d'audit ──────────────────────────────────────────────── */}
      <Card>
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
