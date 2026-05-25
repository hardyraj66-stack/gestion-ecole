import { useState, useMemo } from 'react';
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

const TYPE_LABELS: Record<string, string> = { ds: 'DS', evaluation: 'Évaluation' };

export function AjouterNotes() {
  const { data, loading } = useNotesFiltersData();
  const { data: activePeriode, loading: loadingPeriode } = useActivePeriodeData();
  const { isViewingArchive: readOnly } = useViewing();
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

  // La période active détermine le trimestre et le type automatiquement
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
    const res = await readApi.notesEleves(selectedClasseId, selectedMatiereId, trimestre);
    if (!res) {
      setError('Erreur lors du chargement des élèves.');
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
      setError(`La note de ${invalid.eleve.prenom} ${invalid.eleve.nom} est invalide (0 à 20).`);
      setSaving(false);
      return;
    }

    try {
      const updatedRows = [...rows];
      for (let i = 0; i < updatedRows.length; i++) {
        const r = updatedRows[i];
        if (r.note !== null) {
          // trimestre et type seront auto-taggés par le backend depuis la période active
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
    } catch { setError('Erreur lors de la sauvegarde.'); }
    setSaving(false);
  };

  const subtitle = selectedMatiereName && selectedClasseNom
    ? `${selectedClasseNom} · ${selectedMatiereName}`
    : 'Sélectionnez niveau, classe et matière';

  // Mode archive : lecture seule
  if (readOnly) {
    return (
      <div>
        <PageHeader title="Notes" subtitle="Consultation (archive — lecture seule)" />
        <Alert variant="warning" icon={false}>Année archivée — saisie désactivée.</Alert>
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

  // Aucune période active : blocage
  if (!periode) {
    return (
      <div>
        <PageHeader title="Saisie des notes" subtitle="Aucune période active" />
        <Alert variant="warning">
          La saisie des notes est bloquée. Aucune période d'évaluation n'est en cours.
          Rendez-vous dans <strong>Périodes</strong> pour définir les dates des périodes DS et Évaluation.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Saisie des notes" subtitle={subtitle} />

      {/* Bandeau période active */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'var(--color-surface)', border: '1px solid var(--color-success)',
        borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1.25rem',
      }}>
        <Badge variant="success" label="Période active" />
        <strong style={{ fontSize: '0.9rem' }}>
          {TYPE_LABELS[periode.type]} — Trimestre {periode.trimestre}
        </strong>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {periode.date_debut} → {periode.date_fin}
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
