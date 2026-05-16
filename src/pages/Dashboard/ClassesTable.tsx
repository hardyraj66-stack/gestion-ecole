import { Card, CardHeader } from '../../components/shared/Card';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { Button } from '../../components/shared/Button';
import { MiniPagination } from '../../components/shared/MiniPagination';

interface ClassesTableProps {
  classes: any[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  onPageChange?: (page: number) => void;
}

export function ClassesTable({ classes, pagination, onPageChange }: ClassesTableProps) {
  return (
    <Card padding="none">
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <CardHeader title="Classes" linkTo="/classes" linkText="Voir tout →" />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Classe</TableCell>
            <TableCell header>Niveau</TableCell>
            <TableCell header>Salle</TableCell>
            <TableCell header>Élèves</TableCell>
            <TableCell header>Remplissage</TableCell>
            <TableCell header></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {classes.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell><strong>{c.nom}</strong></TableCell>
              <TableCell>{c.niveau}</TableCell>
              <TableCell>{c.salle}</TableCell>
              <TableCell>{c.nb_eleves} / {c.capacite}</TableCell>
              <TableCell width="150px">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ProgressBar value={c.taux} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '35px' }}>{c.taux}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Button as="link" to={`/classes/${c.id}/eleves`} variant="outline" size="sm">Voir</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && onPageChange && (
        <MiniPagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
      )}
    </Card>
  );
}
