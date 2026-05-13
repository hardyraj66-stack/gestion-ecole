import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eleve, Classe } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { Pagination, paginate } from '../../components/shared/Pagination';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { getInitials } from '../../utils/helpers';

const PAGE_SIZE = 12;

interface ElevesListTableProps {
  eleves: Eleve[];
  classes: Classe[];
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ElevesListTable({ eleves, classes, onDelete, readOnly }: ElevesListTableProps) {
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const paged = paginate(eleves, page, PAGE_SIZE);

  const getClasseName = (classeId: string): string => {
    return classes.find(c => c.id === classeId)?.nom || '—';
  };

  const handleDelete = async (eleve: Eleve) => {
    const ok = await confirm({
      title: 'Supprimer l\'élève',
      message: `Êtes-vous sûr de vouloir supprimer l'élève « ${eleve.prenom} ${eleve.nom} » ? Toutes ses notes seront également supprimées.`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (ok) onDelete(eleve.id);
  };

  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>Élève</TableCell>
            <TableCell header>Genre</TableCell>
            <TableCell header>Classe</TableCell>
            <TableCell header>Email</TableCell>
            <TableCell header>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((eleve) => {
            const classe = classes.find(c => c.id === eleve.classe_id);
            return (
              <TableRow key={eleve.id}>
                <TableCell>
                  <div className="eleve-info">
                    <Avatar initiales={getInitials(eleve)} genre={eleve.genre} />
                    <span className="eleve-name">{eleve.prenom} {eleve.nom}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    label={eleve.genre === 'M' ? 'Garçon' : 'Fille'}
                    variant={eleve.genre === 'M' ? 'info' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  {classe ? (
                    <Link to={`/classes/${classe.id}/eleves`} className="link-primary">
                      {getClasseName(eleve.classe_id)}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>{eleve.email || '—'}</TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button as="link" to={`/eleves/${eleve.id}/bulletin`} variant="outline" size="sm">
                      Bulletin
                    </Button>
                    {!readOnly && (
                      <Button variant="danger" size="sm" onClick={() => handleDelete(eleve)}>
                        ✕
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div style={{ padding: '0 1rem' }}>
        <Pagination currentPage={page} totalItems={eleves.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </Card>
  );
}
