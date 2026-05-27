import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EleveStatut } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Textarea } from '../../components/shared/Textarea';
import { useConfirm } from '../../components/shared/ConfirmDialog';

interface Props {
  eleveId: string;
  nomComplet: string;
  statut: EleveStatut;
  anneeActiveId: string | null;
  nbAvertissements: number;
  readOnly: boolean;
  onStatutChange: (statut: EleveStatut) => void;
}

export function FicheStatut({ eleveId, nomComplet, statut, anneeActiveId, nbAvertissements, readOnly, onStatutChange }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [mode, setMode] = useState<'idle' | 'exclure' | 'depart'>('idle');
  const [submitting, setSubmitting] = useState(false);

  const MOTIF_DEPART_OPTIONS: SelectOption[] = [
    { value: 'changement_ecole', label: t('fiche.statut.motifs.changementEcole') },
    { value: 'demenagement', label: t('fiche.statut.motifs.demenagement') },
    { value: 'raison_familiale', label: t('fiche.statut.motifs.raisonFamiliale') },
    { value: 'autre', label: t('fiche.statut.motifs.autre') },
  ];

  const [excluForm, setExcluForm] = useState({ raison: '', commentaire: '' });
  const [departForm, setDepartForm] = useState({ raison: '', motif: 'changement_ecole', commentaire: '' });

  const handleExclure = async () => {
    if (!excluForm.raison.trim()) return;
    const ok = await confirm({
      title: t('fiche.statut.confirmExclusion'),
      message: t('fiche.statut.confirmExclusionMsg', { nom: nomComplet }),
      confirmText: t('fiche.statut.exclure'),
      variant: 'danger',
    });
    if (!ok) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/exclusions/eleve/${eleveId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...excluForm, anneeScolaireId: anneeActiveId || '', nb_avertissements: nbAvertissements }),
    });
    if (res.ok) { onStatutChange('exclu'); setMode('idle'); }
    setSubmitting(false);
  };

  const handleDepart = async () => {
    if (!departForm.raison.trim()) return;
    const ok = await confirm({
      title: t('fiche.statut.confirmDepart'),
      message: t('fiche.statut.confirmDepartMsg', { nom: nomComplet }),
      confirmText: t('fiche.statut.confirmerDepart'),
      variant: 'danger',
    });
    if (!ok) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/departs/eleve/${eleveId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...departForm, anneeScolaireId: anneeActiveId || '' }),
    });
    if (res.ok) { onStatutChange('parti'); setMode('idle'); }
    setSubmitting(false);
  };

  const handleAnnulerExclusion = async () => {
    const ok = await confirm({ title: t('ficheStatut.annulerExclusion'), message: t('ficheStatut.reintegrerMsg', { nom: nomComplet }), confirmText: t('fiche.statut.reintegrer'), variant: 'danger' });
    if (!ok) return;
    await fetch(`${API_BASE_URL}/exclusions/eleve/${eleveId}`, { method: 'DELETE' });
    onStatutChange('actif');
  };

  const handleAnnulerDepart = async () => {
    const ok = await confirm({ title: t('ficheStatut.annulerDepart'), message: t('ficheStatut.reintegrerMsg', { nom: nomComplet }), confirmText: t('fiche.statut.reintegrer'), variant: 'danger' });
    if (!ok) return;
    await fetch(`${API_BASE_URL}/departs/eleve/${eleveId}`, { method: 'DELETE' });
    onStatutChange('actif');
  };

  const statutBadge = statut === 'exclu'
    ? <Badge label={t('fiche.statut.exclu')} variant="danger" />
    : statut === 'parti'
    ? <Badge label={t('fiche.statut.parti')} variant="warning" />
    : <Badge label={t('common.actif')} variant="success" />;

  return (
    <Card>
      <CardHeader title={t('fiche.statut.titre')} />

      <div className="statut-current">
        <div className="statut-current-label">{t('fiche.statut.statutActuel')}</div>
        <div className="statut-current-value">{statutBadge}</div>
      </div>

      {statut === 'actif' && !readOnly && mode === 'idle' && (
        <div className="statut-actions">
          <button className="statut-action-btn statut-action-btn-danger" onClick={() => setMode('exclure')}>
            <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" size={16} />
            <div>
              <div className="statut-action-title">{t('fiche.statut.exclure')}</div>
              <div className="statut-action-sub">{t('fiche.statut.exclureDesc')}</div>
            </div>
          </button>
          <button className="statut-action-btn statut-action-btn-warning" onClick={() => setMode('depart')}>
            <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={16} />
            <div>
              <div className="statut-action-title">{t('fiche.statut.marquerParti')}</div>
              <div className="statut-action-sub">{t('fiche.statut.marquerPartiDesc')}</div>
            </div>
          </button>
        </div>
      )}

      {mode === 'exclure' && (
        <div className="suivi-form statut-form">
          <div className="statut-form-warning">
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} />
            {t('fiche.statut.raisonExclusion')}
          </div>
          <Input label={t('fiche.statut.raisonExclusionLabel')} value={excluForm.raison} onChange={e => setExcluForm(f => ({ ...f, raison: e.target.value }))} placeholder={t('fiche.statut.motifPrecis')} fullWidth />
          <Textarea label={t('fiche.statut.commentaire')} value={excluForm.commentaire} onChange={e => setExcluForm(f => ({ ...f, commentaire: e.target.value }))} placeholder={t('fiche.statut.circonstances')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button size="sm" variant="secondary" onClick={() => setMode('idle')}>{t('common.annuler')}</Button>
            <Button size="sm" variant="danger" onClick={handleExclure} disabled={submitting || !excluForm.raison.trim()} loading={submitting}>{t('fiche.statut.confirmExclusion')}</Button>
          </div>
        </div>
      )}

      {mode === 'depart' && (
        <div className="suivi-form statut-form">
          <Select label={t('fiche.statut.motifDepart')} value={departForm.motif} onChange={e => setDepartForm(f => ({ ...f, motif: e.target.value }))} options={MOTIF_DEPART_OPTIONS} />
          <Input label={t('fiche.statut.raison')} value={departForm.raison} onChange={e => setDepartForm(f => ({ ...f, raison: e.target.value }))} placeholder={t('fiche.statut.expliquerDepart')} fullWidth />
          <Textarea label={t('fiche.statut.commentaire')} value={departForm.commentaire} onChange={e => setDepartForm(f => ({ ...f, commentaire: e.target.value }))} placeholder={t('fiche.statut.circonstances')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button size="sm" variant="secondary" onClick={() => setMode('idle')}>{t('common.annuler')}</Button>
            <Button size="sm" variant="danger" onClick={handleDepart} disabled={submitting || !departForm.raison.trim()} loading={submitting}>{t('fiche.statut.confirmerDepart')}</Button>
          </div>
        </div>
      )}

      {statut === 'exclu' && (
        <div className="statut-info statut-info-danger">
          <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" size={16} />
          <div>
            <div className="statut-info-title">{t('fiche.statut.eleveExclu')}</div>
            <div className="statut-info-sub">{t('fiche.statut.eleveExcluDesc')}</div>
          </div>
          {!readOnly && (
            <button className="statut-annuler-btn" onClick={handleAnnulerExclusion}>{t('fiche.statut.reintegrer')}</button>
          )}
        </div>
      )}

      {statut === 'parti' && (
        <div className="statut-info statut-info-warning">
          <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={16} />
          <div>
            <div className="statut-info-title">{t('fiche.statut.eleveParti')}</div>
            <div className="statut-info-sub">{t('fiche.statut.elevePartiDesc')}</div>
          </div>
          {!readOnly && (
            <button className="statut-annuler-btn" onClick={handleAnnulerDepart}>{t('fiche.statut.reintegrer')}</button>
          )}
        </div>
      )}
    </Card>
  );
}
