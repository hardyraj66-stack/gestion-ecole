import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>{t('notes.table.eleve')}</TableCell>
            <TableCell header>{t('notes.table.noteSur')}</TableCell>
            <TableCell header>{t('notes.table.commentaire')}</TableCell>
            <TableCell header>{t('notes.table.statut')}</TableCell>
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
                      value={row.note ?? ''} onChange={e => { if (readOnly) return; const v = e.target.value === '' ? null : Math.min(20, Math.max(0, Number(e.target.value))); onNoteChange(row.eleve.id, v); }}
                      min={0} max={20} step={0.5} placeholder="—" disabled={readOnly} />
                    {hasNote && <span className="note-field-indicator" style={{ background: noteColor }} />}
                  </div>
                </TableCell>
                <TableCell>
                  <input type="text"
                    className={`comment-field ${readOnly ? 'comment-field-readonly' : ''}`}
                    value={row.commentaire} onChange={e => { if (readOnly) return; onCommentChange(row.eleve.id, e.target.value); }}
                    placeholder={readOnly ? (row.commentaire || '—') : t('notes.table.commentairePlaceholder')} disabled={readOnly} />
                </TableCell>
                <TableCell>
                  {row.existingId ? <Badge label={t('notes.table.existante')} variant="default" /> :
                   row.note !== null ? <Badge label={t('notes.table.nouvelle')} variant="success" /> :
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
