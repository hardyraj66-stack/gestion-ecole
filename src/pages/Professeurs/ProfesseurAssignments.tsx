import { useState, useEffect, useCallback, useMemo } from 'react';
import { useViewing } from '../../contexts/ViewingContext';
import { useTeacherAssignments } from '../../contexts/TeacherAssignmentContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/shared/Card';
import { Select } from '../../components/shared/Select';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { readApi } from '../../services/readApi';
import { API_BASE_URL } from '../../config/api';

export function ProfesseurAssignments() {
  const { isViewingArchive: readOnly } = useViewing();
  const { create: upsertAssignment } = useTeacherAssignments();

  const [classes, setClasses] = useState<any[]>([]);
  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [allMatieres, setAllMatieres] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState('');
  const [classeData, setClasseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingMatiereId, setSavingMatiereId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    readApi.classesList(1, 100).then((res: any) => { if (res) setClasses(res.items || []); });
    readApi.professeursActifs().then((res: any) => { if (res) setProfesseurs(Array.isArray(res) ? res : []); });
    readApi.niveaux().then((res: any) => { if (Array.isArray(res)) setNiveaux(res); });
    // Charger toutes les matières pour afficher les non-autorisées en grisé
    readApi.matieresList(1, 200).then((res: any) => { if (res) setAllMatieres(res.items || []); });
  }, []);

  const loadClasseData = useCallback(async (classeId: string) => {
    if (!classeId) { setClasseData(null); return; }
    setLoading(true);
    const res = await readApi.planningClasse(classeId);
    setClasseData(res);
    setLoading(false);
  }, []);

  useEffect(() => { loadClasseData(selectedClasseId); }, [selectedClasseId, loadClasseData]);

  // Calculer les matières autorisées pour le niveau de la classe sélectionnée
  const matieresAvecFlag = useMemo(() => {
    if (!classeData || allMatieres.length === 0) return [];
    const niveauNom = classeData.classe?.niveau;
    const niveauConfig = niveaux.find((n: any) => (n.nom ?? n.niveau) === niveauNom);
    const allowedIds: string[] = niveauConfig?.matiere_ids ?? [];
    // Si aucun niveau configuré ou pas de matiere_ids, toutes autorisées
    if (allowedIds.length === 0) {
      return allMatieres.map((m: any) => ({ ...m, autorisee: true }));
    }
    return allMatieres.map((m: any) => ({ ...m, autorisee: allowedIds.includes(m.id) }));
  }, [classeData, allMatieres, niveaux]);

  const handleChangeProf = async (matiereId: string, professeurId: string) => {
    setSavingMatiereId(matiereId);
    setError('');
    await upsertAssignment(
      { professeur_id: professeurId || null, classe_id: selectedClasseId, matiere_id: matiereId },
      () => { loadClasseData(selectedClasseId); },
      (err) => setError(err),
    );
    setSavingMatiereId(null);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await fetch(`${API_BASE_URL}/teacher-assignments/${assignmentId}`, { method: 'DELETE' });
      loadClasseData(selectedClasseId);
    } catch {}
  };

  const classeOptions = [
    { value: '', label: 'Choisir une classe…' },
    ...classes.map((c: any) => ({ value: c.id, label: c.nom })),
  ];

  const profOptions = (matiereId: string) => {
    const existing = classeData?.assignments?.find((a: any) => a.matiere_id === matiereId);
    return [
      { value: '', label: existing ? '— Retirer le prof' : '— Non assigné' },
      ...professeurs.map((p: any) => ({ value: p.id, label: `${p.genre === 'F' ? 'Mme' : 'M.'} ${p.prenom} ${p.nom}` })),
    ];
  };

  return (
    <div>
      <PageHeader title="Affectations professeurs" subtitle="Assigner un prof par classe et matière" />

      {error && <Alert variant="error">{error}</Alert>}

      <Card style={{ marginBottom: '1.25rem' }}>
        <div style={{ maxWidth: 320 }}>
          <Select
            label="Classe"
            value={selectedClasseId}
            onChange={e => setSelectedClasseId(e.target.value)}
            options={classeOptions}
          />
        </div>
      </Card>

      {loading && <PageLoader />}

      {!loading && selectedClasseId && classeData && (
        <Card>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            MATIÈRES DE {classeData.classe?.nom?.toUpperCase()}
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Professeur assigné</th>
                {!readOnly && <th style={{ width: 200 }}>Changer</th>}
              </tr>
            </thead>
            <tbody>
              {matieresAvecFlag.map((m: any) => {
                const assignment = classeData.assignments?.find((a: any) => a.matiere_id === m.id);
                const isSaving = savingMatiereId === m.id;
                const nonAutorisee = !m.autorisee;
                return (
                  <tr key={m.id} style={nonAutorisee ? { opacity: 0.4 } : undefined}>
                    <td style={{ fontWeight: 500 }}>
                      {m.nom} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({m.code})</span>
                      {nonAutorisee && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>— non enseignée dans ce niveau</span>}
                    </td>
                    <td>
                      {assignment?.professeur_nom
                        ? <Badge label={assignment.professeur_nom} variant="info" />
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>— non assigné</span>
                      }
                    </td>
                    {!readOnly && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Select
                            label=""
                            value={assignment?.professeur_id || ''}
                            onChange={e => handleChangeProf(m.id, e.target.value)}
                            options={profOptions(m.id)}
                            disabled={isSaving || nonAutorisee}
                          />
                          {assignment && !nonAutorisee && (
                            <Button variant="danger" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                              ✕
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {!selectedClasseId && (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Sélectionnez une classe pour gérer les affectations
          </div>
        </Card>
      )}
    </div>
  );
}
