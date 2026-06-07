import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eleve } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { getInitials, getAge, formatDate } from '../../utils/helpers';

interface ElevesTableProps {
  eleves: Eleve[];
  readOnly?: boolean;
}

export function ElevesTable({ eleves }: ElevesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>{t('elevesTable.eleve')}</TableCell>
            <TableCell header>{t('professeurs.colonnes.genre')}</TableCell>
            <TableCell header>{t('elevesTable.dateNaissance')}</TableCell>
            <TableCell header>{t('elevesTable.age')}</TableCell>
            <TableCell header>{t('professeurs.colonnes.email')}</TableCell>
            <TableCell header>{t('professeurs.colonnes.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {eleves.map((e: any) => (
            <TableRow key={e.id} onClick={() => navigate(`/eleves/${e.id}`)}>
              <TableCell>
                <div className="eleve-info">
                  <Avatar initiales={getInitials(e)} genre={e.genre} />
                  <span className="eleve-name eleve-name-link">{e.prenom} {e.nom}</span>
                </div>
              </TableCell>
              <TableCell><Badge label={e.genre === 'M' ? t('eleves.genres.masculin') : t('eleves.genres.feminin')} variant={e.genre === 'M' ? 'info' : 'warning'} /></TableCell>
              <TableCell>{formatDate(e.date_naissance)}</TableCell>
              <TableCell>{getAge(e.date_naissance)} {t('elevesTable.ans')}</TableCell>
              <TableCell>{e.email || '—'}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '0.5rem' }} onClick={ev => ev.stopPropagation()}>
                  <Button as="link" to={`/eleves/${e.id}/bulletin`} variant="outline" size="sm">{t('dashboard.bulletin')}</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
