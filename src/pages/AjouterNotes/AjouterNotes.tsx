import { useState, useMemo, useCallback } from 'react';
import { useNotes } from '../../contexts/NoteContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { NotesFilters } from './NotesFilters';
import { NotesStatsBar } from './NotesStatsBar';
import { NotesTable, NoteRow } from './NotesTable';
import { Trimestre } from '../../types';

export function AjouterNotes() {
  const { classes, eleves, matieres, notes, loading, readOnly } = useData();
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

  const selectedMatiereName = useMemo(() => {
    return matieres.find(m => m.id === selectedMatiereId)?.nom || '';
  }, [matieres, selectedMatiereId]);

  const loadEleves = useCallback(() => {
    if (!selectedClasseId || !selectedMatiereId) return;
    setLoadingEleves(true); setSuccess(false); setError('');
    const classeEleves = eleves.filter(e => e.classe_id === selectedClasseId);
    const newRows: NoteRow[] = classeEleves.map(eleve => {
      const existingNote = notes.find(n => n.eleve_id === eleve.id && n.matiere_id === selectedMatiereId && n.trimestre === selectedTrimestre);
      return { eleve, note: existingNote?.valeur ?? null, commentaire: existingNote?.commentaire ?? '', existingId: existingNote?.id ?? null };
    });
    setRows(newRows);
    setLoadingEleves(false);
  }, [selectedClasseId, selectedMatiereId, selectedTrimestre, eleves, notes]);

  const handleNoteChange = (eleveId: string, note: number | null) => {
    if (readOnly) return;
    setRows(prev => prev.map(r => r.eleve.id === eleveId ? { ...r, note } : r));
  };

  const handleCommentChange = (eleveId: string, commentaire: string) => {
    if (readOnly) return;
    setRows(prev => prev.map(r => r.eleve.id === eleveId ? { ...r, commentaire } : r));
  };

  const classeStats = useMemo(() => {
    const withVal = rows.filter(r => r.note !== null);
    const total = rows.length;
    const filled = withVal.length;
    const average = filled > 0 ? withVal.reduce((s, r) => s + (r.note || 0), 0) / filled : null;
    return { filled, total, average };
  }, [rows]);

  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true); setError(''); setSuccess(false);
    try {
      for (const row of rows) {
        if (row.note !== null) {
          const data = { eleve_id: row.eleve.id, matiere_id: selectedMatiereId, valeur: row.note, trimestre: selectedTrimestre, date: selectedDate, commentaire: row.commentaire || undefined };
          if (row.existingId) await updateNote(row.existingId, data);
          else await createNote(data);
        }
      }
      setSuccess(true);
      setTimeout(() => loadEleves(), 500);
    } catch { setError('Erreur lors de l\'enregistrement'); }
    setSaving(false);
  };

  if (loading) return <PageLoader />;

  // En mode archive : page consultation seule, pas de saisie
  if (readOnly) {
    return (
      <div>
        <PageHeader title="Notes" subtitle="Consultation des notes (archive — lecture seule)" />
        <Alert variant="warning" icon={false}>
          Vous consultez une année scolaire archivée. La saisie et la modification des notes sont désactivées.
        </Alert>
        <NotesFilters
          classes={classes} matieres={matieres}
          selectedClasseId={selectedClasseId} selectedMatiereId={selectedMatiereId}
          selectedTrimestre={selectedTrimestre} selectedDate={selectedDate}
          onClasseChange={setSelectedClasseId} onMatiereChange={setSelectedMatiereId}
          onTrimestreChange={setSelectedTrimestre} onDateChange={setSelectedDate}
          onLoad={loadEleves} loading={loadingEleves}
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

  return (
    <div>
      <PageHeader title="Saisie des notes" subtitle={selectedMatiereName ? `${selectedMatiereName} — Trimestre ${selectedTrimestre}` : 'Sélectionnez une classe et une matière'} />

      <NotesFilters
        classes={classes} matieres={matieres}
        selectedClasseId={selectedClasseId} selectedMatiereId={selectedMatiereId}
        selectedTrimestre={selectedTrimestre} selectedDate={selectedDate}
        onClasseChange={setSelectedClasseId} onMatiereChange={setSelectedMatiereId}
        onTrimestreChange={setSelectedTrimestre} onDateChange={setSelectedDate}
        onLoad={loadEleves} loading={loadingEleves}
      />

      {success && <Alert variant="success">Notes enregistrées avec succès !</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {rows.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <NotesStatsBar filled={classeStats.filled} total={classeStats.total} average={classeStats.average} />
            <Button variant="primary" onClick={handleSave} loading={saving}>✓ Enregistrer toutes les notes</Button>
          </div>
          <NotesTable rows={rows} onNoteChange={handleNoteChange} onCommentChange={handleCommentChange} />
        </>
      )}
    </div>
  );
}
