import { useTranslation } from 'react-i18next';
import { BulletinMatiere } from '../../types';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell, TableFooter } from '../../components/shared/Table';
import { getNoteColor, getMention } from '../../utils/helpers';

interface GradesTableProps {
  bulletinMatieres: BulletinMatiere[];
  moyenneGenerale: number | null;
}

function NoteCell({ valeur }: { valeur: number | null }) {
  if (valeur === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <span className="note-chip" style={{ backgroundColor: getNoteColor(valeur) }}>
      {valeur}
    </span>
  );
}

export function GradesTable({ bulletinMatieres, moyenneGenerale }: GradesTableProps) {
  const { t } = useTranslation();

  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>{t('bulletin.table.matiere')}</TableCell>
            <TableCell header>{t('bulletin.table.code')}</TableCell>
            <TableCell header>{t('bulletin.table.coef')}</TableCell>
            <TableCell header>{t('bulletin.table.ds')}</TableCell>
            <TableCell header>{t('bulletin.table.evaluation')}</TableCell>
            <TableCell header>{t('bulletin.table.moyenne')}</TableCell>
            <TableCell header>{t('bulletin.table.mention')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bulletinMatieres.map((matiere) => {
            const hasNote = matiere.ds !== null || matiere.evaluation !== null;
            const mention = hasNote ? getMention(matiere.moyenne) : null;

            return (
              <TableRow key={matiere.matiere_id}>
                <TableCell><strong>{matiere.matiere_nom}</strong></TableCell>
                <TableCell>
                  <Badge label={matiere.code} variant="default" />
                </TableCell>
                <TableCell>{matiere.coefficient}</TableCell>
                <TableCell><NoteCell valeur={matiere.ds} /></TableCell>
                <TableCell><NoteCell valeur={matiere.evaluation} /></TableCell>
                <TableCell>
                  {hasNote ? (
                    <span className="note-moyenne" style={{ color: getNoteColor(matiere.moyenne) }}>
                      {matiere.moyenne.toFixed(1)}{t('bulletin.sur20')}
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
        {moyenneGenerale !== null && bulletinMatieres.some(m => m.ds !== null || m.evaluation !== null) && (
          <TableFooter>
            <TableRow>
              <TableCell><strong>{t('bulletin.table.moyenneGenerale')}</strong></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>
                <span className="note-moyenne" style={{ color: getNoteColor(moyenneGenerale), fontSize: '1.1rem' }}>
                  {moyenneGenerale.toFixed(1)}{t('bulletin.sur20')}
                </span>
              </TableCell>
              <TableCell>
                <Badge label={getMention(moyenneGenerale).label} variant={getMention(moyenneGenerale).variant} />
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </Card>
  );
}
