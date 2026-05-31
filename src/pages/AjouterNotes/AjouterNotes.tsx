import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotes } from '../../contexts/NoteContext';
import { useNotesFiltersData } from '../../hooks/usePageData';
import { useActivePeriodeData } from '../../hooks/usePeriodesData';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Alert } from '../../components/shared/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { NotesFilters } from './NotesFilters';
import { NotesStatsBar } from './NotesStatsBar';
import { NotesTable, NoteRow } from './NotesTable';
import { useViewing } from '../../contexts/ViewingContext';
import { useAnneeScolaireStatus } from '../../hooks/useAnneeScolaireStatus';

export function AjouterNotes() {
  const { t } = useTranslation();
  const { data, loading } = useNotesFiltersData();
  const { data: activePeriode, loading: loadingPeriode } = useActivePeriodeData();
  const { isViewingArchive, viewingId } = useViewing();
  const { isTerminee } = useAnneeScolaireStatus();
  const readOnly = isViewingArchive || isTerminee;
  const { create: createNote, update: updateNote } = useNotes();

  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [selectedClasseNom, setSelectedClasseNom] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedMatiereName, setSelectedMatiereName] = useState('');
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const TYPE_LABELS: Record<string, string> = {
    ds: t('notes.types.ds'),
    evaluation: t('notes.types.evaluation'),
  };

  const allMatieres = data?.matieres || [];
  const niveaux: any[] = data?.niveaux || [];

  const matieres = useMemo(() => {
    if (!selectedNiveau) return allMatieres;
    const niveauConfig = niveaux.find((n: any) => n.nom === selectedNiveau);
    const allowedIds: string[] = niveauConfig?.matiere_ids ?? [];
    if (allowedIds.length === 0) return allMatieres;
    return allMatieres.filter((m: any) => allowedIds.includes(m.id));
  }, [allMatieres, niveaux, selectedNiveau]);

  const classeStats = useMemo(() => {
    const wv = rows.filter(r => r.note !== null);
    return { filled: wv.length, total: rows.length, average: wv.length > 0 ? wv.reduce((s, r) => s + (r.note || 0), 0) / wv.length : null };
  }, [rows]);

  const periode = activePeriode as any;
  const trimestre = periode?.trimestre ?? null;

  if (loading || loadingPeriode) return <PageLoader />;

  const handleNiveauClasseChange = (niveau: string, classeId: string, classeNom: string) => {
    setSelectedNiveau(niveau);
    setSelectedClasseId(classeId);
    setSelectedClasseNom(classeNom);
    setSelectedMatiereId('');
    setSelectedMatiereName('');
    setRows([]);
    setSuccess(false);
    setError('');
  };

  const handleMatiereChange = (id: string, nom: string) => {
    setSelectedMatiereId(id);
    setSelectedMatiereName(nom);
    setRows([]);
    setSuccess(false);
    setError('');
  };

  const loadEleves = async () => {
    if (!selectedClasseId || !selectedMatiereId || !trimestre) return;
    setLoadingEleves(true);
    setSuccess(false);
    setError('');
    const res = await readApi.notesEleves(selectedClasseId, selectedMatiereId, trimestre, viewingId ?? undefined);
    if (!res) {
      setError(t('notes.erreurChargement'));
      setLoadingEleves(false);
      return;
    }
    const { eleves, notes } = res;
    const newRows: NoteRow[] = eleves.map((eleve: any) => {
      const existing = notes.find((n: any) =>
        n.eleve_id === eleve.id &&
        n.matiere_id === selectedMatiereId &&
        n.trimestre === trimestre &&
        n.type === periode?.type,
      );
      return { eleve, note: existing?.valeur ?? null, commentaire: existing?.commentaire ?? '', existingId: existing?.id ?? null };
    });
    setRows(newRows);
    setLoadingEleves(false);
  };

  const handleNoteChange = (eleveId: string, note: number | null) => {
    if (readOnly) return;
    setRows(p => p.map(r => r.eleve.id === eleveId ? { ...r, note } : r));
  };

  const handleCommentChange = (eleveId: string, c: string) => {
    if (readOnly) return;
    setRows(p => p.map(r => r.eleve.id === eleveId ? { ...r, commentaire: c } : r));
  };

  const handleSave = async () => {
    if (readOnly || !trimestre) return;
    setSaving(true); setError(''); setSuccess(false);
    const today = new Date().toISOString().split('T')[0];
    const invalid = rows.find(r => r.note !== null && (r.note < 0 || r.note > 20));
    if (invalid) {
      setError(t('notes.erreurNote', { prenom: invalid.eleve.prenom, nom: invalid.eleve.nom }));
      setSaving(false);
      return;
    }

    try {
      const updatedRows = [...rows];
      for (let i = 0; i < updatedRows.length; i++) {
        const r = updatedRows[i];
        if (r.note !== null) {
          const d = { eleve_id: r.eleve.id, matiere_id: selectedMatiereId, valeur: r.note, trimestre, date: today, commentaire: r.commentaire || undefined };
          if (r.existingId && r.existingId !== 'saved') {
            await updateNote(r.existingId, d);
          } else if (!r.existingId) {
            const ok = await createNote(d);
            if (ok) updatedRows[i] = { ...r, existingId: 'saved' };
          }
        }
      }
      setRows(updatedRows);
      setSuccess(true);
    } catch { setError(t('notes.erreurSauvegarde')); }
    setSaving(false);
  };

  const subtitle = selectedMatiereName && selectedClasseNom
    ? t('notes.subtitleFull', { classeNom: selectedClasseNom, matiereName: selectedMatiereName })
    : t('notes.subtitleDefault');

  // Mode archive / année terminée : lecture seule
  if (readOnly) {
    return (
      <div>
        <PageHeader title={t('notes.titre')} subtitle={t('notes.titreArchive')} />
        {isViewingArchive
          ? <Alert variant="warning" icon={false}>{t('notes.anneeArchivee')}</Alert>
          : <Alert variant="info" icon={false}>{t('layout.aucuneAnneeActive')} {t('layout.aucuneAnneeActiveMsg')}</Alert>
        }
        <NotesFilters
          matieres={matieres}
          selectedClasseId={selectedClasseId}
          selectedClasseNom={selectedClasseNom}
          selectedNiveau={selectedNiveau}
          selectedMatiereId={selectedMatiereId}
          selectedMatiereName={selectedMatiereName}
          onNiveauClasseChange={handleNiveauClasseChange}
          onMatiereChange={handleMatiereChange}
          onLoad={loadEleves}
          loading={loadingEleves}
        />
        {rows.length > 0 && (
          <>
            <NotesStatsBar filled={classeStats.filled} total={classeStats.total} average={classeStats.average} />
            <NotesTable rows={rows} onNoteChange={() => {}} onCommentChange={() => {}} readOnly />
          </>
        )}
      </div>
    );
  }

  if (!periode) {
    return (
      <div>
        <PageHeader title={t('notes.titreSaisie')} subtitle={t('notes.aucunePeriodeActive')} />
        <Alert variant="warning">
          {t('notes.blocagePeriode')}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('notes.titreSaisie')} subtitle={subtitle} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'var(--color-surface)', border: '1px solid var(--color-success)',
        borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1.25rem',
      }}>
        <Badge variant="success" label={t('notes.periodeActive')} />
        <strong style={{ fontSize: '0.9rem' }}>
          {TYPE_LABELS[periode.type]} — {t('notes.trimestre', { t: periode.trimestre })}
        </strong>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {t('notes.periodeDate', { debut: periode.date_debut, fin: periode.date_fin })}
        </span>
      </div>

      <NotesFilters
        matieres={matieres}
        selectedClasseId={selectedClasseId}
        selectedClasseNom={selectedClasseNom}
        selectedNiveau={selectedNiveau}
        selectedMatiereId={selectedMatiereId}
        selectedMatiereName={selectedMatiereName}
        onNiveauClasseChange={handleNiveauClasseChange}
        onMatiereChange={handleMatiereChange}
        onLoad={loadEleves}
        loading={loadingEleves}
      />

      {success && <Alert variant="success">{t('notes.succes')}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {rows.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <NotesStatsBar filled={classeStats.filled} total={classeStats.total} average={classeStats.average} />
            <Button variant="primary" onClick={handleSave} loading={saving}>{t('notes.enregistrer')}</Button>
          </div>
          <NotesTable rows={rows} onNoteChange={handleNoteChange} onCommentChange={handleCommentChange} />
        </>
      )}
    </div>
  );
}
