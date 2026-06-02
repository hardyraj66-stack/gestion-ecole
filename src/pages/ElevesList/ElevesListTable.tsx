import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eleve } from '../../types';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { getInitials } from '../../utils/helpers';

interface ElevesListTableProps {
  eleves: Eleve[];
  sansClasse?: boolean;
  showReinscription?: boolean;
  onReinscire?: (eleveId: string) => void;
}

export function ElevesListTable({ eleves, sansClasse, showReinscription, onReinscire }: ElevesListTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card padding="none">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell header>{t('elevesTable.eleve')}</TableCell>
            <TableCell header>{t('professeurs.colonnes.genre')}</TableCell>
            <TableCell header>{t('classes.colonne.classe')}</TableCell>
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
              <TableCell>
                <Badge label={e.genre === 'M' ? t('eleves.genres.masculin') : t('eleves.genres.feminin')} variant={e.genre === 'M' ? 'info' : 'warning'} />
              </TableCell>
              <TableCell>
                {sansClasse ? (
                  <Badge label="Sans classe" variant="default" />
                ) : (
                  <Link to={`/classes/${e.classe_id}/eleves`} className="link-primary">{e.classe_nom || '—'}</Link>
                )}
              </TableCell>
              <TableCell>{e.email || '—'}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '0.5rem' }} onClick={ev => ev.stopPropagation()}>
                  {(sansClasse || (showReinscription && !e.estInscritNouvelleAnnee)) ? (
                    <Button variant="primary" size="sm" onClick={() => onReinscire?.(e.id)}>
                      Réinscrire
                    </Button>
                  ) : (
                    <Button as="link" to={`/eleves/${e.id}/bulletin`} variant="outline" size="sm">{t('dashboard.bulletin')}</Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
