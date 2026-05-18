import { Eleve, Creneau } from '../../types';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/shared/Avatar';
import { getInitials, getAge, formatDate } from '../../utils/helpers';

interface Props {
  eleve: Eleve & { classe_nom?: string; classe_niveau?: string };
  classe: any;
  salleActuelle: string | null;
  creneaux: Creneau[];
}

// Salle actuelle en mode variable : salle du premier créneau du jour courant ou du prochain
function getSalleVariable(creneaux: Creneau[]): string | null {
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const today = jours[new Date().getDay()];
  const now = new Date().toTimeString().slice(0, 5);
  // Créneau en cours aujourd'hui
  const enCours = creneaux.find(c => c.jour === today && c.heure_debut <= now && c.heure_fin > now);
  if (enCours) return enCours.salle;
  // Prochain créneau aujourd'hui
  const prochains = creneaux.filter(c => c.jour === today && c.heure_debut > now);
  if (prochains.length > 0) return prochains.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))[0].salle;
  return null;
}

export function FicheIdentite({ eleve, classe, salleActuelle, creneaux }: Props) {
  const salle = salleActuelle ?? (classe?.salle_type === 'variable' ? getSalleVariable(creneaux) : null);
  const age = eleve.date_naissance ? getAge(eleve.date_naissance) : null;

  return (
    <Card>
      <div className="fiche-identite-header">
        <div className="fiche-avatar-lg">
          <Avatar initiales={getInitials(eleve)} genre={eleve.genre} size="lg" />
        </div>
        <div>
          <h2 className="fiche-nom">{eleve.prenom} {eleve.nom}</h2>
          <Badge label={eleve.genre === 'M' ? 'Garçon' : 'Fille'} variant={eleve.genre === 'M' ? 'info' : 'warning'} />
        </div>
      </div>

      <div className="fiche-info-grid">
        <div className="fiche-info-item">
          <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={16} />
          <div>
            <span className="fiche-info-label">Date de naissance</span>
            <span className="fiche-info-value">{formatDate(eleve.date_naissance)}{age !== null ? ` (${age} ans)` : ''}</span>
          </div>
        </div>

        <div className="fiche-info-item">
          <Icon path="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" size={16} />
          <div>
            <span className="fiche-info-label">Classe</span>
            <span className="fiche-info-value">{classe?.nom || '—'} {classe?.niveau ? `(${classe.niveau})` : ''}</span>
          </div>
        </div>

        <div className="fiche-info-item">
          <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" size={16} />
          <div>
            <span className="fiche-info-label">Salle {classe?.salle_type === 'variable' ? '(maintenant)' : ''}</span>
            <span className="fiche-info-value">
              {salle ?? <span className="text-muted">Non assignée</span>}
              {classe?.salle_type === 'variable' && <Badge label="Variable" variant="default" />}
            </span>
          </div>
        </div>

        {eleve.email && (
          <div className="fiche-info-item">
            <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={16} />
            <div>
              <span className="fiche-info-label">Email</span>
              <span className="fiche-info-value">{eleve.email}</span>
            </div>
          </div>
        )}

        {eleve.telephone && (
          <div className="fiche-info-item">
            <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={16} />
            <div>
              <span className="fiche-info-label">Téléphone</span>
              <span className="fiche-info-value">{eleve.telephone}</span>
            </div>
          </div>
        )}

        {eleve.adresse && (
          <div className="fiche-info-item fiche-info-item-full">
            <Icon path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" size={16} />
            <div>
              <span className="fiche-info-label">Adresse</span>
              <span className="fiche-info-value">{eleve.adresse}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
