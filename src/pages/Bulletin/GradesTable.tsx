import { BulletinMatiere } from '../../types';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell, TableFooter } from '../../components/shared/Table';
import { getNoteColor, getMention } from '../../utils/helpers';

interface GradesTableProps {
  bulletinMatieres: BulletinMatiere[];
  moyenneGenerale: number | null;
}

export function GradesTable({ bulletinMatieres, moyenneGenerale }: GradesTableProps) {
  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Matière</TableCell>
            <TableCell header>Code</TableCell>
            <TableCell header>Coef.</TableCell>
            <TableCell header>Notes</TableCell>
            <TableCell header>Moyenne</TableCell>
            <TableCell header>Mention</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bulletinMatieres.map((matiere) => {
            const mention = matiere.notes.length > 0 ? getMention(matiere.moyenne) : null;
            
            return (
              <TableRow key={matiere.matiere_id}>
                <TableCell><strong>{matiere.matiere_nom}</strong></TableCell>
                <TableCell>
                  <Badge label={matiere.code} variant="default" />
                </TableCell>
                <TableCell>{matiere.coefficient}</TableCell>
                <TableCell>
                  <div className="notes-chips">
                    {matiere.notes.length > 0 ? (
                      matiere.notes.map((note, idx) => (
                        <span
                          key={idx}
                          className="note-chip"
                          style={{ backgroundColor: getNoteColor(note) }}
                        >
                          {note}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {matiere.notes.length > 0 ? (
                    <span 
                      className="note-moyenne"
                      style={{ color: getNoteColor(matiere.moyenne) }}
                    >
                      {matiere.moyenne.toFixed(1)}/20
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {mention ? (
                    <Badge label={mention.label} variant={mention.variant} />
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        {moyenneGenerale !== null && bulletinMatieres.some(m => m.notes.length > 0) && (
          <TableFooter>
            <TableRow>
              <TableCell>
                <strong>Moyenne générale (pondérée)</strong>
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>
                <span 
                  className="note-moyenne"
                  style={{ color: getNoteColor(moyenneGenerale), fontSize: '1.1rem' }}
                >
                  {moyenneGenerale.toFixed(1)}/20
                </span>
              </TableCell>
              <TableCell>
                <Badge 
                  label={getMention(moyenneGenerale).label} 
                  variant={getMention(moyenneGenerale).variant} 
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </Card>
  );
}
