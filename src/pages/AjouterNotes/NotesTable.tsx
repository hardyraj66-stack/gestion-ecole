import { useState } from 'react';
import { Eleve } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { Pagination, paginate } from '../../components/shared/Pagination';
import { getInitials } from '../../utils/helpers';

export interface NoteRow {
  eleve: Eleve;
  note: number | null;
  commentaire: string;
  existingId: string | null;
}

const PAGE_SIZE = 10;

interface NotesTableProps {
  rows: NoteRow[];
  onNoteChange: (eleveId: string, note: number | null) => void;
  onCommentChange: (eleveId: string, commentaire: string) => void;
  readOnly?: boolean;
}

export function NotesTable({ rows, onNoteChange, onCommentChange, readOnly }: NotesTableProps) {
  const [page, setPage] = useState(1);
  const paged = paginate(rows, page, PAGE_SIZE);

  const getNoteClass = (note: number | null): string => {
    if (note === null) return '';
    return note >= 10 ? 'note-good' : 'note-bad';
  };

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
          {paged.map((row) => (
            <TableRow key={row.eleve.id}>
              <TableCell>
                <div className="eleve-info">
                  <Avatar initiales={getInitials(row.eleve)} genre={row.eleve.genre} />
                  <span className="eleve-name">{row.eleve.prenom} {row.eleve.nom}</span>
                </div>
              </TableCell>
              <TableCell>
                <input
                  type="number"
                  className={`notes-input ${getNoteClass(row.note)}`}
                  value={row.note ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    onNoteChange(row.eleve.id, val);
                  }}
                  min={0}
                  max={20}
                  step={0.5}
                  placeholder="—"
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </TableCell>
              <TableCell>
                <input
                  type="text"
                  className="comment-input"
                  value={row.commentaire}
                  onChange={(e) => onCommentChange(row.eleve.id, e.target.value)}
                  placeholder="Commentaire…"
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </TableCell>
              <TableCell>
                {row.existingId ? (
                  <Badge label="Existante" variant="default" />
                ) : row.note !== null ? (
                  <Badge label="Nouvelle" variant="success" />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div style={{ padding: '0 1rem' }}>
        <Pagination currentPage={page} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </Card>
  );
}
