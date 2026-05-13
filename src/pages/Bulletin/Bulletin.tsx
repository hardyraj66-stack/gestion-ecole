import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useNotes } from '../../contexts/NoteContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/shared/Button';
import { Icon, Icons } from '../../components/shared/Icon';
import { StudentCard } from './StudentCard';
import { TrimestreTabs } from './TrimestreTabs';
import { GradesTable } from './GradesTable';
import { BulletinMatiere, Trimestre } from '../../types';

export function Bulletin() {
  const { id } = useParams<{ id: string }>();
  const { eleves, classes, loading, readOnly } = useData();
  const { getBulletinFromApi, getMoyenneGenerale } = useNotes();

  const [trimestre, setTrimestre] = useState<Trimestre>(1);
  const [bulletinMatieres, setBulletinMatieres] = useState<BulletinMatiere[]>([]);
  const [loadingBulletin, setLoadingBulletin] = useState(true);

  const eleve = useMemo(() => eleves.find(e => e.id === id), [eleves, id]);
  const classe = useMemo(() => eleve ? classes.find(c => c.id === eleve.classe_id) : undefined, [eleve, classes]);

  const loadBulletin = useCallback(async () => {
    if (!id) return;
    setLoadingBulletin(true);
    const data = await getBulletinFromApi(id, trimestre);
    setBulletinMatieres(data);
    setLoadingBulletin(false);
  }, [id, trimestre, getBulletinFromApi]);

  useEffect(() => { loadBulletin(); }, [loadBulletin]);

  const moyenneGenerale = bulletinMatieres.length > 0 ? getMoyenneGenerale(bulletinMatieres) : null;

  if (loading) return <PageLoader />;

  if (!eleve) {
    return (
      <EmptyState icon={<Icon path={Icons.warning} size={28} />} message="Élève introuvable."
        action={<Button as="link" to="/eleves" variant="primary">Retour aux élèves</Button>} />
    );
  }

  return (
    <div>
      <PageHeader title={`Bulletin de ${eleve.prenom} ${eleve.nom}`} subtitle={`Trimestre ${trimestre} — ${classe?.annee_scolaire || ''}`}>
        {classe && <Button as="link" to={`/classes/${classe.id}/eleves`} variant="secondary">← Classe</Button>}
        <Button as="link" to="/eleves" variant="outline">Tous les élèves</Button>
      </PageHeader>

      <div className="bulletin-layout">
        <StudentCard eleve={eleve} classe={classe} bulletinMatieres={bulletinMatieres} moyenneGenerale={moyenneGenerale} />
        <div>
          <TrimestreTabs selected={trimestre} onChange={setTrimestre} />
          {loadingBulletin ? (
            <PageLoader />
          ) : bulletinMatieres.length === 0 || !bulletinMatieres.some(m => m.notes.length > 0) ? (
            <EmptyState icon={<Icon path={Icons.document} size={28} />} message={`Aucune note pour le trimestre ${trimestre}`}
              action={!readOnly ? <Button as="link" to="/notes" variant="primary">Saisir des notes</Button> : undefined} />
          ) : (
            <GradesTable bulletinMatieres={bulletinMatieres} moyenneGenerale={moyenneGenerale} />
          )}
        </div>
      </div>
    </div>
  );
}
