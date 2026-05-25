import { useMemo } from 'react';
import { Avatar } from '../shared/Avatar';

interface NoteRow {
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  valeur: number | null;
  absent: boolean;
}

interface NotesGridProps {
  notes: NoteRow[];
  readOnly?: boolean;
  onChange?: (notes: NoteRow[]) => void;
}

export function NotesGrid({ notes, readOnly = false, onChange }: NotesGridProps) {
  const { nbNotes, moyenne } = useMemo(() => {
    const valeurs = notes.filter(n => !n.absent && n.valeur !== null).map(n => n.valeur as number);
    const nb = valeurs.length;
    const moy = nb > 0 ? Math.round((valeurs.reduce((a, b) => a + b, 0) / nb) * 10) / 10 : null;
    return { nbNotes: nb, moyenne: moy };
  }, [notes]);

  const handleValeur = (eleveId: string, raw: string) => {
    if (!onChange) return;
    const parsed = raw === '' ? null : parseFloat(raw);
    const valeur = parsed !== null && !isNaN(parsed) ? Math.min(20, Math.max(0, parsed)) : null;
    onChange(notes.map(n => n.eleve_id === eleveId ? { ...n, valeur, absent: false } : n));
  };

  const handleAbsent = (eleveId: string, absent: boolean) => {
    if (!onChange) return;
    onChange(notes.map(n => n.eleve_id === eleveId ? { ...n, absent, valeur: absent ? null : n.valeur } : n));
  };

  return (
    <div className="notes-grid-wrapper">
      <table className="notes-grid-table">
        <thead>
          <tr>
            <th className="notes-grid-th notes-grid-th-eleve">Élève</th>
            <th className="notes-grid-th notes-grid-th-note">Note /20</th>
            <th className="notes-grid-th notes-grid-th-absent">Absent</th>
          </tr>
        </thead>
        <tbody>
          {notes.map(n => (
            <tr key={n.eleve_id} className={`notes-grid-row${n.absent ? ' notes-grid-row-absent' : ''}`}>
              <td className="notes-grid-td notes-grid-td-eleve">
                <Avatar nom={n.eleve_nom} prenom={n.eleve_prenom} genre="M" size="sm" />
                <span className="notes-grid-nom">{n.eleve_prenom} {n.eleve_nom}</span>
              </td>
              <td className="notes-grid-td notes-grid-td-note">
                {readOnly || n.absent ? (
                  <span className="notes-grid-valeur-ro">
                    {n.absent ? '—' : (n.valeur !== null ? `${n.valeur}` : '—')}
                  </span>
                ) : (
                  <input
                    type="number"
                    className="notes-grid-input"
                    value={n.valeur !== null ? n.valeur : ''}
                    min={0}
                    max={20}
                    step={0.5}
                    placeholder="—"
                    onChange={e => handleValeur(n.eleve_id, e.target.value)}
                  />
                )}
              </td>
              <td className="notes-grid-td notes-grid-td-absent">
                {!readOnly && (
                  <input
                    type="checkbox"
                    className="notes-grid-checkbox"
                    checked={n.absent}
                    onChange={e => handleAbsent(n.eleve_id, e.target.checked)}
                  />
                )}
                {readOnly && n.absent && <span className="notes-grid-absent-badge">Absent</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="notes-grid-footer">
        <span>{nbNotes}/{notes.length} élèves notés</span>
        {moyenne !== null && <span>Moyenne provisoire : <strong>{moyenne}/20</strong></span>}
      </div>
    </div>
  );
}
