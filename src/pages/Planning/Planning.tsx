import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanning } from '../../contexts/PlanningContext';
import { usePlanningClasses, usePlanningClasse } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/shared/Alert';
import { Icon, Icons } from '../../components/shared/Icon';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';
import { StatItem } from '../../components/shared/StatItem';
import { ListItem } from '../../components/shared/ListItem';
import { Popover } from '../../components/shared/Popover';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { Creneau, JourSemaine } from '../../types';
import { generatePlanningHours, calculateDuration } from '../../utils/helpers';

const JOURS: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES = generatePlanningHours();
const JOUR_OPTIONS: SelectOption[] = JOURS.map(j => ({ value: j, label: j }));
const HEURE_OPTIONS: SelectOption[] = HEURES.map(h => ({ value: h, label: h }));

const NIVEAUX_ORDRE = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];

export function Planning() {
  const { id } = useParams<{ id: string }>();
  const { createWithError, delete: deleteCreneau } = usePlanning();
  const confirm = useConfirm();

  const [selectedClasseId, setSelectedClasseId] = useState<string>(id || '');
  const [openNiveau, setOpenNiveau] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [matiereId, setMatiereId] = useState('');
  const [jour, setJour] = useState<JourSemaine>('Lundi');
  const [heureDebut, setHeureDebut] = useState('08:00');
  const [heureFin, setHeureFin] = useState('09:00');
  const [salle, setSalle] = useState('');
  const [enseignant, setEnseignant] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (id) setSelectedClasseId(id); }, [id]);

  // 1. Charger la liste des classes (léger, une seule fois)
  const { data: classesData, loading: classesLoading, readOnly } = usePlanningClasses();

  // 2. Charger les créneaux de la classe sélectionnée (à la demande)
  const { data: classeData, loading: classeLoading } = usePlanningClasse(selectedClasseId);

  // Grouper par niveau
  const niveaux = useMemo(() => {
    if (!classesData?.classes) return [];
    const map = new Map<string, any[]>();
    for (const c of classesData.classes) {
      const n = c.niveau || 'Autre';
      if (!map.has(n)) map.set(n, []);
      map.get(n)!.push(c);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ia = NIVEAUX_ORDRE.indexOf(a), ib = NIVEAUX_ORDRE.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
      })
      .map(([niveau, classes]) => ({ niveau, classes }));
  }, [classesData]);

  if (classesLoading) return <PageLoader />;
  if (!classesData) return <Alert variant="error">Problème de chargement.</Alert>;

  // Données de la classe sélectionnée
  const selectedClasse = classeData?.classe || null;
  const classeCreneaux: any[] = classeData?.creneaux || [];
  const allMatieres: any[] = classeData?.matieres || [];
  const totalHeures = classeCreneaux.reduce((t: number, c: any) => t + calculateDuration(c.heure_debut, c.heure_fin), 0);
  const getCreneaux = (j: JourSemaine, h: string) => classeCreneaux.filter((c: any) => c.jour === j && c.heure_debut === h);
  const matiereOptions: SelectOption[] = allMatieres.map((m: any) => ({ value: m.id, label: m.nom }));
  const selectedNiveau = selectedClasse?.niveau || null;

  const handleSelectClasse = (cid: string) => {
    setSelectedClasseId(cid);
    setOpenNiveau(null);
    setShowForm(false);
    setError('');
  };

  const resetForm = () => {
    setMatiereId(''); setJour('Lundi'); setHeureDebut('08:00'); setHeureFin('09:00');
    setEnseignant(''); setError('');
    if (selectedClasse) setSalle(selectedClasse.salle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !matiereId || !salle || !selectedClasse) return;
    const mat = allMatieres.find((m: any) => m.id === matiereId);
    if (!mat) return;
    setSubmitting(true); setError('');
    await createWithError(
      { classe_id: selectedClasse.id, matiere_id: matiereId, matiere_nom: mat.nom, matiere_couleur: mat.couleur || '#2563eb', jour, heure_debut: heureDebut, heure_fin: heureFin, salle, enseignant: enseignant.trim() },
      () => { resetForm(); setShowForm(false); }, (err) => setError(err),
    );
    setSubmitting(false);
  };

  const handleDeleteCreneau = async (cr: Creneau) => {
    if (readOnly) return;
    const ok = await confirm({ title: 'Supprimer', message: `Supprimer ${cr.matiere_nom} (${cr.jour} ${cr.heure_debut}–${cr.heure_fin}) ?`, confirmText: 'Supprimer', variant: 'danger' });
    if (ok) deleteCreneau(cr.id);
  };

  return (
    <div>
      <PageHeader title="Planning" subtitle={selectedClasse ? `Emploi du temps de ${selectedClasse.nom}` : 'Sélectionnez un niveau puis une classe'}>
        {selectedClasse && !readOnly && <Button variant="primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fermer' : '+ Ajouter un créneau'}</Button>}
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
        {/* ===== SIDEBAR NIVEAUX ===== */}
        <div>
          <Card>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Niveaux</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {niveaux.map(({ niveau, classes: nClasses }) => {
                const isSelected = selectedNiveau === niveau;
                const totalCr = nClasses.reduce((t: number, c: any) => t + (c._creneauxCount || 0), 0);

                return (
                  <Popover
                    key={niveau}
                    open={openNiveau === niveau}
                    onClose={() => setOpenNiveau(null)}
                    trigger={
                      <div
                        className={`niveau-item ${isSelected ? 'niveau-item-selected' : openNiveau === niveau ? 'niveau-item-active' : ''}`}
                        onClick={() => setOpenNiveau(openNiveau === niveau ? null : niveau)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{niveau}</span>
                          <Badge label={`${nClasses.length}`} variant={isSelected ? 'primary' : 'default'} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="niveau-item-count" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{totalCr}h</span>
                          <span className="niveau-item-arrow">▾</span>
                        </div>
                      </div>
                    }
                  >
                    <div style={{ padding: '0.35rem 0' }}>
                      <div style={{ padding: '0.4rem 0.85rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Classes — {niveau}
                      </div>
                      {nClasses.map((c: any) => (
                        <ListItem
                          key={c.id}
                          title={c.nom}
                          subtitle={c.salle}
                          selected={c.id === selectedClasseId}
                          onClick={() => handleSelectClasse(c.id)}
                          trailing={<Badge label={`${c._creneauxCount || 0}`} variant={c.id === selectedClasseId ? 'primary' : (c._creneauxCount || 0) > 0 ? 'info' : 'default'} />}
                        />
                      ))}
                    </div>
                  </Popover>
                );
              })}
            </div>

            {selectedClasse && (
              <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Sélection</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)' }}>{selectedClasse.nom}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedClasse.niveau} • {selectedClasse.salle}</div>
              </div>
            )}
          </Card>
        </div>

        {/* ===== CONTENU ===== */}
        <div>
          {!selectedClasseId ? (
            <Card><EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Sélectionnez un niveau dans la liste, puis choisissez une classe" /></Card>
          ) : classeLoading ? (
            <PageLoader />
          ) : !selectedClasse ? (
            <Card><EmptyState icon={<Icon path={Icons.warning} size={28} />} message="Classe introuvable" /></Card>
          ) : (
            <>
              <Card style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <StatItem label="Classe" value={selectedClasse.nom} />
                  <StatItem label="Créneaux" value={classeCreneaux.length} />
                  <StatItem label="Heures/sem" value={`${totalHeures}h`} />
                  <StatItem label="Mode" value={<Badge label={selectedClasse.salle_type === 'fixe' ? 'Fixe' : 'Variable'} variant={selectedClasse.salle_type === 'fixe' ? 'info' : 'warning'} />} />
                </div>
              </Card>

              {showForm && !readOnly && (
                <Card style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Nouveau créneau</h3>
                  {error && <Alert variant="error">{error}</Alert>}
                  <form onSubmit={handleSubmit}>
                    <FormGrid columns={3}>
                      <Select label="Matière *" value={matiereId} onChange={e => setMatiereId(e.target.value)} options={matiereOptions} placeholder="Choisir" />
                      <Select label="Jour *" value={jour} onChange={e => setJour(e.target.value as JourSemaine)} options={JOUR_OPTIONS} />
                      <Input label="Enseignant" value={enseignant} onChange={e => setEnseignant(e.target.value)} placeholder="M. Dupont" />
                    </FormGrid>
                    <FormGrid columns={3}>
                      <Select label="Début *" value={heureDebut} onChange={e => setHeureDebut(e.target.value)} options={HEURE_OPTIONS} />
                      <Select label="Fin *" value={heureFin} onChange={e => setHeureFin(e.target.value)} options={HEURE_OPTIONS} />
                      <Input label="Salle *" value={salle} onChange={e => setSalle(e.target.value)} placeholder="Salle" />
                    </FormGrid>
                    <FormActions>
                      <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Annuler</Button>
                      <Button type="submit" variant="primary" disabled={submitting || !matiereId || !salle} loading={submitting}>Ajouter</Button>
                    </FormActions>
                  </form>
                </Card>
              )}

              {classeCreneaux.length === 0 && !showForm ? (
                <Card><EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Aucun créneau"
                  action={!readOnly ? <Button variant="primary" onClick={() => setShowForm(true)}>Ajouter</Button> : undefined} /></Card>
              ) : (
                <Card padding="none">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="planning-table">
                      <thead><tr><th>Horaire</th>{JOURS.map(j => <th key={j}>{j}</th>)}</tr></thead>
                      <tbody>
                        {HEURES.map(h => (
                          <tr key={h}>
                            <td>{h}</td>
                            {JOURS.map(j => {
                              const cc = getCreneaux(j, h);
                              return (
                                <td key={`${j}-${h}`}>
                                  {cc.map((cr: any) => (
                                    <div key={cr.id} className="creneau-block" style={{ backgroundColor: cr.matiere_couleur }}>
                                      <div className="creneau-block-title">{cr.matiere_nom}</div>
                                      <div className="creneau-block-time">{cr.heure_debut}–{cr.heure_fin}</div>
                                      <div className="creneau-block-salle">{cr.salle}</div>
                                      {!readOnly && <button type="button" className="creneau-block-delete" onClick={() => handleDeleteCreneau(cr)}>✕</button>}
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
