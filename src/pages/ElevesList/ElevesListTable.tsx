import { Link, useNavigate } from 'react-router-dom';
import { Eleve } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { getInitials } from '../../utils/helpers';

interface ElevesListTableProps {
  eleves: Eleve[];
  classes: any[];
}

export function ElevesListTable({ eleves, classes }: ElevesListTableProps) {
  const navigate = useNavigate();

  const getClasseName = (cid: string) => classes.find((c: any) => c.id === cid)?.nom || '—';

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
          {eleves.map((e: any) => (
            <TableRow key={e.id} onClick={() => navigate(`/eleves/${e.id}`)}>
              <TableCell><div className="eleve-info"><Avatar initiales={getInitials(e)} genre={e.genre} /><span className="eleve-name eleve-name-link">{e.prenom} {e.nom}</span></div></TableCell>
              <TableCell><Badge label={e.genre === 'M' ? 'Garçon' : 'Fille'} variant={e.genre === 'M' ? 'info' : 'warning'} /></TableCell>
              <TableCell><Link to={`/classes/${e.classe_id}/eleves`} className="link-primary">{e.classe_nom || getClasseName(e.classe_id)}</Link></TableCell>
              <TableCell>{e.email || '—'}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '0.5rem' }} onClick={ev => ev.stopPropagation()}>
                  <Button as="link" to={`/eleves/${e.id}/bulletin`} variant="outline" size="sm">Bulletin</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
