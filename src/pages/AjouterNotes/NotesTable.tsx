import { Eleve } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { getInitials } from '../../utils/helpers';

export interface NoteRow {
  eleve: Eleve;
  note: number | null;
  commentaire: string;
  existingId: string | null;
}

interface NotesTableProps {
  rows: NoteRow[];
  onNoteChange: (eleveId: string, note: number | null) => void;
  onCommentChange: (eleveId: string, commentaire: string) => void;
  readOnly?: boolean;
}

function getNoteColor(note: number | null): string {
  if (note === null) return '';
  if (note >= 16) return 'var(--success)';
  if (note >= 10) return 'var(--warning)';
  return 'var(--danger)';
}

export function NotesTable({ rows, onNoteChange, onCommentChange, readOnly }: NotesTableProps) {
  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Élève</TableCell>
            <TableCell header>Note /20</TableCell>
            <TableCell header>Commentaire</TableCell>
            <TableCell header>Statut</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const noteColor = getNoteColor(row.note);
            const hasNote = row.note !== null;
            return (
              <TableRow key={row.eleve.id}>
                <TableCell>
                  <div className="eleve-info">
                    <Avatar initiales={getInitials(row.eleve)} genre={row.eleve.genre} />
                    <span className="eleve-name">{row.eleve.prenom} {row.eleve.nom}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="note-input-wrapper">
                    <input type="number"
                      className={`note-field ${hasNote ? (row.note! >= 10 ? 'note-field-good' : 'note-field-bad') : ''} ${readOnly ? 'note-field-readonly' : ''}`}
                      value={row.note ?? ''} onChange={e => { if (readOnly) return; onNoteChange(row.eleve.id, e.target.value === '' ? null : Number(e.target.value)); }}
                      min={0} max={20} step={0.5} placeholder="—" disabled={readOnly} />
                    {hasNote && <span className="note-field-indicator" style={{ background: noteColor }} />}
                  </div>
                </TableCell>
                <TableCell>
                  <input type="text"
                    className={`comment-field ${readOnly ? 'comment-field-readonly' : ''}`}
                    value={row.commentaire} onChange={e => { if (readOnly) return; onCommentChange(row.eleve.id, e.target.value); }}
                    placeholder={readOnly ? (row.commentaire || '—') : 'Commentaire…'} disabled={readOnly} />
                </TableCell>
                <TableCell>
                  {row.existingId ? <Badge label="Existante" variant="default" /> :
                   row.note !== null ? <Badge label="Nouvelle" variant="success" /> :
                   <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
