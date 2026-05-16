import { useState, useMemo } from 'react';
import { useNotes } from '../../contexts/NoteContext';
import { useNotesPageData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { NotesFilters } from './NotesFilters';
import { NotesStatsBar } from './NotesStatsBar';
import { NotesTable, NoteRow } from './NotesTable';
import { Trimestre } from '../../types';

export function AjouterNotes() {
  const { data, loading, readOnly } = useNotesPageData();
  const { create: createNote, update: updateNote } = useNotes();

  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre>(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Extraire les données AVANT tout return conditionnel (Rules of Hooks)
  const classes = data?.classes || [];
  const matieres = data?.matieres || [];
  const eleves = data?.eleves || [];
  const notes = data?.notes || [];

  const selectedMatiereName = useMemo(() => {
    return matieres.find((m: any) => m.id === selectedMatiereId)?.nom || '';
  }, [matieres, selectedMatiereId]);

  const classeStats = useMemo(() => {
    const wv = rows.filter(r => r.note !== null);
    return { filled: wv.length, total: rows.length, average: wv.length > 0 ? wv.reduce((s, r) => s + (r.note || 0), 0) / wv.length : null };
  }, [rows]);

  // Maintenant on peut return conditionnel
  if (loading) return <PageLoader />;

  const loadEleves = () => {
    if (!selectedClasseId || !selectedMatiereId) return;
    setLoadingEleves(true); setSuccess(false); setError('');
    const ce = eleves.filter((e: any) => e.classe_id === selectedClasseId);
    const newRows: NoteRow[] = ce.map((eleve: any) => {
      const existing = notes.find((n: any) => n.eleve_id === eleve.id && n.matiere_id === selectedMatiereId && n.trimestre === selectedTrimestre);
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
    if (readOnly) return;
    setSaving(true); setError(''); setSuccess(false);
    try {
      for (const r of rows) {
        if (r.note !== null) {
          const d = { eleve_id: r.eleve.id, matiere_id: selectedMatiereId, valeur: r.note, trimestre: selectedTrimestre, date: selectedDate, commentaire: r.commentaire || undefined };
          if (r.existingId) await updateNote(r.existingId, d);
          else await createNote(d);
        }
      }
      setSuccess(true);
      setTimeout(loadEleves, 500);
    } catch { setError('Erreur'); }
    setSaving(false);
  };

  if (readOnly) {
    return (
      <div>
        <PageHeader title="Notes" subtitle="Consultation (archive — lecture seule)" />
        <Alert variant="warning" icon={false}>Année archivée — saisie désactivée.</Alert>
        <NotesFilters classes={classes} matieres={matieres} selectedClasseId={selectedClasseId} selectedMatiereId={selectedMatiereId}
          selectedTrimestre={selectedTrimestre} selectedDate={selectedDate} onClasseChange={setSelectedClasseId}
          onMatiereChange={setSelectedMatiereId} onTrimestreChange={setSelectedTrimestre} onDateChange={setSelectedDate}
          onLoad={loadEleves} loading={loadingEleves} />
        {rows.length > 0 && (
          <>
            <NotesStatsBar filled={classeStats.filled} total={classeStats.total} average={classeStats.average} />
            <NotesTable rows={rows} onNoteChange={() => {}} onCommentChange={() => {}} readOnly />
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Saisie des notes" subtitle={selectedMatiereName ? `${selectedMatiereName} — Trimestre ${selectedTrimestre}` : 'Sélectionnez classe et matière'} />
      <NotesFilters classes={classes} matieres={matieres} selectedClasseId={selectedClasseId} selectedMatiereId={selectedMatiereId}
        selectedTrimestre={selectedTrimestre} selectedDate={selectedDate} onClasseChange={setSelectedClasseId}
        onMatiereChange={setSelectedMatiereId} onTrimestreChange={setSelectedTrimestre} onDateChange={setSelectedDate}
        onLoad={loadEleves} loading={loadingEleves} />
      {success && <Alert variant="success">Notes enregistrées !</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      {rows.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <NotesStatsBar filled={classeStats.filled} total={classeStats.total} average={classeStats.average} />
            <Button variant="primary" onClick={handleSave} loading={saving}>✓ Enregistrer</Button>
          </div>
          <NotesTable rows={rows} onNoteChange={handleNoteChange} onCommentChange={handleCommentChange} />
        </>
      )}
    </div>
  );
}
