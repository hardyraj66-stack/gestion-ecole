import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnnees } from '../../contexts/AnneeContext';
import { useClasses } from '../../contexts/ClasseContext';
import { useEleves } from '../../contexts/EleveContext';
import { useNotes } from '../../contexts/NoteContext';
import { useViewing } from '../../contexts/ViewingContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { Icon } from '../../components/shared/Icon';
import { Input } from '../../components/shared/Input';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { AnneeScolaire as AnneeScolaireType, AnneeStatut, BadgeVariant } from '../../types';
import { formatDate } from '../../utils/helpers';

const statutConfig: Record<AnneeStatut, { label: string; variant: BadgeVariant; icon: string }> = {
  active: {
    label: 'Active',
    variant: 'success',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  preparation: {
    label: 'En préparation',
    variant: 'warning',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  },
  terminee: {
    label: 'Terminée',
    variant: 'default',
    icon: 'M5 13l4 4L19 7',
  },
};

export function AnneeScolairePage() {
  const { annees, loading, active, preparation, create, demarrer, terminer, delete: deleteAnnee } = useAnnees();
  const { classes } = useClasses();
  const { eleves } = useEleves();
  const { notes } = useNotes();
  const { viewAnnee } = useViewing();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formDebut, setFormDebut] = useState('');
  const [formFin, setFormFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ============ TERMINER ============
  const handleTerminer = async (annee: AnneeScolaireType) => {
    clearMessages();
    const ok = await confirm({
      title: 'Terminer l\'année scolaire',
      message: `Vous êtes sur le point de clôturer l'année « ${annee.label} ». Cette action est irréversible.\n\nUne nouvelle année sera automatiquement créée en préparation. Toutes les données de l'année en cours seront figées en lecture seule.`,
      confirmText: 'Terminer l\'année',
      variant: 'warning',
    });
    if (!ok) return;

    // Double confirmation
    const ok2 = await confirm({
      title: 'Confirmation définitive',
      message: `Confirmez-vous la clôture de l'année « ${annee.label} » ? Cette action ne peut PAS être annulée.`,
      confirmText: 'Je confirme la clôture',
      variant: 'danger',
    });
    if (!ok2) return;

    setSubmitting(true);
    await terminer(
      annee.id,
      (nouvelle) => {
        setSuccess(`Année « ${annee.label} » terminée. L'année « ${nouvelle.label} » est prête en préparation.`);
        setSubmitting(false);
      },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  // ============ DÉMARRER ============
  const handleDemarrer = async (annee: AnneeScolaireType) => {
    clearMessages();
    const ok = await confirm({
      title: 'Démarrer l\'année scolaire',
      message: `Vous allez démarrer officiellement l'année « ${annee.label} ». Elle deviendra l'année active de l'établissement.\n\nAssurez-vous que la configuration (classes, matières, salles) est prête.`,
      confirmText: 'Démarrer l\'année',
      variant: 'info',
    });
    if (!ok) return;

    setSubmitting(true);
    await demarrer(
      annee.id,
      () => { setSuccess(`Année « ${annee.label} » démarrée avec succès !`); setSubmitting(false); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  // ============ SUPPRIMER ============
  const handleDelete = async (annee: AnneeScolaireType) => {
    clearMessages();
    const ok = await confirm({
      title: 'Supprimer l\'année',
      message: `Supprimer l'année « ${annee.label} » en préparation ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    await deleteAnnee(annee.id, (err) => setError(err));
  };

  // ============ CRÉER ============
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!formLabel || !formDebut || !formFin) { setError('Tous les champs sont requis'); return; }
    setSubmitting(true);
    await create(
      { label: formLabel, debut: formDebut, fin: formFin },
      () => { setSuccess(`Année « ${formLabel} » créée en préparation`); setShowForm(false); setFormLabel(''); setFormDebut(''); setFormFin(''); setSubmitting(false); },
      (err) => { setError(err); setSubmitting(false); },
    );
  };

  if (loading) return <PageLoader />;

  // Stats de l'année active
  const activeClasses = active ? classes.filter(c => c.annee_scolaire === active.label).length : 0;
  const activeEleves = active ? eleves.length : 0;
  const activeNotes = active ? notes.length : 0;

  return (
    <div>
      <PageHeader title="Cycle scolaire" subtitle="Gestion des années scolaires">
        {!showForm && !preparation && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            + Préparer une année
          </Button>
        )}
      </PageHeader>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* ============ FORMULAIRE ============ */}
      {showForm && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Préparer une nouvelle année</h3>
          <form onSubmit={handleCreate}>
            <FormGrid columns={3}>
              <Input label="Label *" value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="2025-2026" required />
              <Input label="Date de début *" type="date" value={formDebut} onChange={e => setFormDebut(e.target.value)} required />
              <Input label="Date de fin *" type="date" value={formFin} onChange={e => setFormFin(e.target.value)} required />
            </FormGrid>
            <FormActions>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" variant="primary" loading={submitting}>Créer en préparation</Button>
            </FormActions>
          </form>
        </Card>
      )}

      {/* ============ FLUX VISUEL ============ */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Cycle de transition
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['active', 'terminee', 'preparation'] as AnneeStatut[]).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: active?.statut === s || preparation?.statut === s ? `var(--${statutConfig[s].variant === 'default' ? 'bg' : statutConfig[s].variant + '-light'})` : '#f8fafc',
                border: `1.5px solid ${active?.statut === s || preparation?.statut === s ? 'var(--primary)' : 'var(--border)'}`,
                fontWeight: 600,
                fontSize: '0.85rem',
                color: active?.statut === s || preparation?.statut === s ? 'var(--text)' : 'var(--text-muted)',
              }}>
                {statutConfig[s].label}
              </div>
              {i < 2 && (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ============ ANNÉE ACTIVE ============ */}
      {active && (
        <Card style={{ marginBottom: '1rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={statutConfig.active.icon} size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{active.label}</h3>
                  <Badge label="Année active" variant="success" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span>📅 {formatDate(active.debut)} → {formatDate(active.fin)}</span>
                <span>🏫 {activeClasses} classes</span>
                <span>👥 {activeEleves} élèves</span>
                <span>📝 {activeNotes} notes</span>
              </div>
            </div>
            <Button variant="danger" onClick={() => handleTerminer(active)} disabled={submitting} loading={submitting}>
              Terminer l'année
            </Button>
          </div>
        </Card>
      )}

      {/* ============ EN PRÉPARATION ============ */}
      {preparation && (
        <Card style={{ marginBottom: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={statutConfig.preparation.icon} size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{preparation.label}</h3>
                  <Badge label="En préparation" variant="warning" />
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                📅 {formatDate(preparation.debut)} → {formatDate(preparation.fin)}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Configurez les classes, matières et salles pour cette année avant de la démarrer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!active && (
                <Button variant="primary" onClick={() => handleDemarrer(preparation)} disabled={submitting} loading={submitting}>
                  🚀 Démarrer l'année
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => handleDelete(preparation)}>
                Supprimer
              </Button>
            </div>
          </div>
          {active && (
            <Alert variant="info" icon={false}>
              L'année « {active.label} » est encore active. Terminez-la avant de démarrer « {preparation.label} ».
            </Alert>
          )}
        </Card>
      )}

      {/* ============ HISTORIQUE ============ */}
      <Card>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Historique des années scolaires</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {annees.map(annee => {
            const cfg = statutConfig[annee.statut];
            return (
              <div key={annee.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: annee.statut === 'active' ? 'var(--success-light)' : 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge label={cfg.label} variant={cfg.variant} />
                  <span style={{ fontWeight: 600 }}>{annee.label}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDate(annee.debut)} → {formatDate(annee.fin)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {annee.historique.length} action(s)
                  </span>
                  {annee.statut === 'terminee' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await viewAnnee(annee);
                        navigate('/dashboard');
                      }}
                    >
                      📂 Consulter
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ============ JOURNAL D'AUDIT ============ */}
      <Card style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Journal d'audit</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {annees.flatMap(a => a.historique.map(h => ({ ...h, anneeLabel: a.label }))).sort((a, b) => b.date.localeCompare(a.date)).map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: '0.4rem', flexShrink: 0, background: entry.action === 'cloture' ? 'var(--danger)' : entry.action === 'demarrage' ? 'var(--success)' : 'var(--primary)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{entry.details}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {entry.anneeLabel} · {new Date(entry.date).toLocaleDateString('fr-FR')} à {new Date(entry.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {annees.every(a => a.historique.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Aucun événement enregistré</p>
          )}
        </div>
      </Card>
    </div>
  );
}
