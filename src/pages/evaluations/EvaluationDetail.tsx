import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const TYPE_LABELS: Record<string, string> = { ds: 'DS', evaluation: 'Évaluation' };
const STATUT_VARIANT: Record<string, 'warning' | 'success'> = { brouillon: 'warning', publie: 'success' };

interface NoteRow {
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  valeur: number | null;
  absent: boolean;
}

export function EvaluationDetail() {
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
      setSaveMessage(ok ? 'Enregistré.' : 'Erreur lors de l\'enregistrement.');
    }, 1500);
  }, [id, saisirNotes]);

  const handlePublier = async () => {
    const ok2 = await confirm('Une fois publiée, l\'évaluation sera verrouillée et les notes visibles dans les bulletins. Continuer ?');
    if (!ok2) return;
    setPublishing(true);
    const ok = await publier(id!);
    setPublishing(false);
    if (ok) navigate('/evaluations');
  };

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">Évaluation introuvable.</Alert>;

  const readOnly = isViewingArchive || data.statut === 'publie';

  return (
    <div>
      <PageHeader
        title={`${TYPE_LABELS[data.type] || data.type} — ${data.matiere_nom}`}
        subtitle={`${data.classe_nom} · T${data.trimestre} · ${data.date}`}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Badge variant={STATUT_VARIANT[data.statut] || 'default'}>
            {data.statut === 'publie' ? 'Publié' : 'Brouillon'}
          </Badge>
          <Button as="link" to="/evaluations" variant="secondary">← Retour</Button>
        </div>
      </PageHeader>

      <div style={{ maxWidth: 720 }}>
        {saveMessage && (
          <Alert variant={saveMessage.startsWith('Erreur') ? 'error' : 'success'} style={{ marginBottom: '1rem' }}>
            {saveMessage}
          </Alert>
        )}

        {data.statut === 'publie' && (
          <Alert variant="info" style={{ marginBottom: '1rem' }}>
            Cette évaluation est publiée et en lecture seule.
          </Alert>
        )}

        <NotesGrid
          notes={notes}
          readOnly={readOnly}
          onChange={readOnly ? undefined : handleNotesChange}
        />

        {!readOnly && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            {saving && <span style={{ alignSelf: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Enregistrement…</span>}
            <Button
              variant="primary"
              onClick={handlePublier}
              disabled={publishing}
              loading={publishing}
            >
              Publier →
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
