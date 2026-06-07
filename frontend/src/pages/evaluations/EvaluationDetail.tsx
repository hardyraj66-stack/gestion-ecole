import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useEvaluations } from '../../contexts/EvaluationContext';
import { useEvaluationDetailData } from '../../hooks/useEvaluationData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { NotesGrid } from '../../components/evaluations/NotesGrid';

interface NoteRow {
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  valeur: number | null;
  absent: boolean;
}

export function EvaluationDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isViewingArchive } = useViewing();
  const { saisirNotes, publier } = useEvaluations();
  const confirm = useConfirm();

  const { data, loading, error } = useEvaluationDetailData(id || '');
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data) {
      setNotes((data.notes || []).map((n: any) => ({
        eleve_id: n.eleve_id,
        eleve_nom: n.eleve_nom,
        eleve_prenom: n.eleve_prenom,
        valeur: n.valeur ?? null,
        absent: n.absent ?? false,
      })));
    }
  }, [data]);

  const handleNotesChange = useCallback((updated: NoteRow[]) => {
    setNotes(updated);
    setSaveMessage('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      const ok = await saisirNotes(id!, updated.map(n => ({
        eleve_id: n.eleve_id,
        valeur: n.absent ? null : n.valeur,
        absent: n.absent,
      })));
      setSaving(false);
      setSaveMessage(ok ? t('evaluations.detail.enregistre') : t('evaluations.detail.erreurEnregistrement'));
    }, 1500);
  }, [id, saisirNotes, t]);

  const handlePublier = async () => {
    const ok2 = await confirm(t('evaluations.detail.confirmPublier'));
    if (!ok2) return;
    setPublishing(true);
    const ok = await publier(id!);
    setPublishing(false);
    if (ok) navigate('/evaluations');
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('evaluations.detail.introuvable')}</Alert>;

  const readOnly = isViewingArchive || data.statut === 'publie';
  const typeLabel = data.type === 'ds' ? t('evaluations.types.ds') : t('evaluations.types.evaluation');

  return (
    <div>
      <PageHeader
        title={`${typeLabel} — ${data.matiere_nom}`}
        subtitle={`${data.classe_nom} · T${data.trimestre} · ${data.date}`}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Badge
            variant={data.statut === 'brouillon' ? 'warning' : 'success'}
            label={data.statut === 'publie' ? t('evaluations.detail.statuts.publie') : t('evaluations.detail.statuts.brouillon')}
          />
          <Button as="link" to="/evaluations" variant="secondary">{t('evaluations.retour')}</Button>
        </div>
      </PageHeader>

      <div style={{ maxWidth: 720 }}>
        {saveMessage && (
          <Alert variant={saveMessage === t('evaluations.detail.erreurEnregistrement') ? 'error' : 'success'}>
            {saveMessage}
          </Alert>
        )}

        {data.statut === 'publie' && (
          <Alert variant="info">
            {t('evaluations.detail.publiee')}
          </Alert>
        )}

        <NotesGrid
          notes={notes}
          readOnly={readOnly}
          onChange={readOnly ? undefined : handleNotesChange}
        />

        {!readOnly && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            {saving && <span style={{ alignSelf: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('evaluations.detail.enregistrement')}</span>}
            <Button
              variant="primary"
              onClick={handlePublier}
              disabled={publishing}
              loading={publishing}
            >
              {t('evaluations.detail.publierBtn')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
