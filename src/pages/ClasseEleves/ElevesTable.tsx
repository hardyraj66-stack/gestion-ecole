import { Eleve } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { getInitials, getAge, formatDate } from '../../utils/helpers';

interface ElevesTableProps {
  eleves: Eleve[];
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ElevesTable({ eleves, onDelete, readOnly }: ElevesTableProps) {
  const confirm = useConfirm();

  const handleDelete = async (eleve: Eleve) => {
    if (readOnly) return;
    const ok = await confirm({ title: 'Supprimer l\'élève', message: `Supprimer « ${eleve.prenom} ${eleve.nom} » ?`, confirmText: 'Supprimer', variant: 'danger' });
    if (ok) onDelete(eleve.id);
  };

  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Élève</TableCell>
            <TableCell header>Genre</TableCell>
            <TableCell header>Date de naissance</TableCell>
            <TableCell header>Âge</TableCell>
            <TableCell header>Email</TableCell>
            <TableCell header>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {eleves.map((e: any) => (
            <TableRow key={e.id}>
              <TableCell><div className="eleve-info"><Avatar initiales={getInitials(e)} genre={e.genre} /><span className="eleve-name">{e.prenom} {e.nom}</span></div></TableCell>
              <TableCell><Badge label={e.genre === 'M' ? 'Garçon' : 'Fille'} variant={e.genre === 'M' ? 'info' : 'warning'} /></TableCell>
              <TableCell>{formatDate(e.date_naissance)}</TableCell>
              <TableCell>{getAge(e.date_naissance)} ans</TableCell>
              <TableCell>{e.email || '—'}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button as="link" to={`/eleves/${e.id}/bulletin`} variant="outline" size="sm">Bulletin</Button>
                  {!readOnly && <Button variant="danger" size="sm" onClick={() => handleDelete(e)}>✕</Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
