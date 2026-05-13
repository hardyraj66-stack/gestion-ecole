import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanning } from '../../contexts/PlanningContext';

import { useSalles } from '../../contexts/SalleContext';
import { useData } from '../../hooks/useData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/shared/Alert';
import { Icon, Icons } from '../../components/shared/Icon';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { Classe, Creneau, JourSemaine, SalleDisponible } from '../../types';
import { generatePlanningHours, calculateDuration } from '../../utils/helpers';

const JOURS: JourSemaine[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES = generatePlanningHours();

export function Planning() {
  const { id } = useParams<{ id: string }>();
  const { classes, creneaux: dataCreneaux, matieres: dataMatieres, loading, readOnly } = useData();

  // Services live pour les mutations (seulement si pas readOnly)
  const { createWithError, delete: deleteCreneau } = usePlanning();
  const { salles, getDisponibles } = useSalles();

  const confirm = useConfirm();
  const [selectedClasseId, setSelectedClasseId] = useState<string>(id || '');
  const [showForm, setShowForm] = useState(false);

  // Form
  const [matiereId, setMatiereId] = useState('');
  const [jour, setJour] = useState<JourSemaine>('Lundi');
  const [heureDebut, setHeureDebut] = useState('08:00');
  const [heureFin, setHeureFin] = useState('09:00');
  const [salle, setSalle] = useState('');
  const [enseignant, setEnseignant] = useState('');
  const [sallesDisponibles, setSallesDisponibles] = useState<SalleDisponible[]>([]);
  const [loadingSalles, setLoadingSalles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (id) setSelectedClasseId(id); }, [id]);

  const selectedClasse = useMemo(() => classes.find(c => c.id === selectedClasseId), [classes, selectedClasseId]);

  // En mode archive on utilise les créneaux du snapshot, sinon live
  const allCreneaux = dataCreneaux;
  const allMatieres = dataMatieres;

  const classeCreneaux = useMemo(() => {
    if (!selectedClasseId) return [];
    return allCreneaux.filter(c => c.classe_id === selectedClasseId);
  }, [allCreneaux, selectedClasseId]);

  const totalHeures = useMemo(() => {
    return classeCreneaux.reduce((t, c) => t + calculateDuration(c.heure_debut, c.heure_fin), 0);
  }, [classeCreneaux]);

  useEffect(() => { if (selectedClasse) setSalle(selectedClasse.salle); }, [selectedClasse]);

  const loadSallesDisponibles = useCallback(async () => {
    if (readOnly || !selectedClasse || selectedClasse.salle_type !== 'variable' || salles.length === 0) return;
    setLoadingSalles(true);
    const d = await getDisponibles(jour, heureDebut, heureFin);
    setSallesDisponibles(d);
    setLoadingSalles(false);
  }, [readOnly, selectedClasse, jour, heureDebut, heureFin, salles.length, getDisponibles]);

  useEffect(() => {
    if (showForm && selectedClasse?.salle_type === 'variable') loadSallesDisponibles();
  }, [showForm, loadSallesDisponibles, selectedClasse?.salle_type]);

  const handleSelectClasse = (classeId: string) => { setSelectedClasseId(classeId); setShowForm(false); setError(''); };

  const resetForm = () => { setMatiereId(''); setJour('Lundi'); setHeureDebut('08:00'); setHeureFin('09:00'); setEnseignant(''); setError(''); if (selectedClasse) setSalle(selectedClasse.salle); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!matiereId || !salle || !selectedClasse) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    const mat = allMatieres.find(m => m.id === matiereId);
    if (!mat) { setError('Matière invalide'); return; }
    setSubmitting(true); setError('');
    await createWithError(
      { classe_id: selectedClasse.id, matiere_id: matiereId, matiere_nom: mat.nom, matiere_couleur: mat.couleur || '#2563eb', jour, heure_debut: heureDebut, heure_fin: heureFin, salle, enseignant: enseignant.trim() },
      () => { resetForm(); setShowForm(false); },
      (err) => setError(err),
    );
    setSubmitting(false);
  };

  const handleDeleteCreneau = async (creneau: Creneau) => {
    if (readOnly) return;
    const ok = await confirm({ title: 'Supprimer le créneau', message: `Supprimer le créneau de ${creneau.matiere_nom} (${creneau.jour} ${creneau.heure_debut}–${creneau.heure_fin}) ?`, confirmText: 'Supprimer', variant: 'danger' });
    if (ok) deleteCreneau(creneau.id);
  };

  const getCreneaux = (j: JourSemaine, h: string) => classeCreneaux.filter(c => c.jour === j && c.heure_debut === h);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Planning" subtitle={selectedClasse ? `Emploi du temps de ${selectedClasse.nom}` : 'Sélectionnez une classe'}>
        {selectedClasse && !readOnly && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Fermer' : '+ Ajouter un créneau'}
          </Button>
        )}
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Liste classes */}
        <div>
          <Card>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>Classes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {classes.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune classe</p>
              ) : classes.map(c => (
                <ClasseItem key={c.id} classe={c} isSelected={c.id === selectedClasseId}
                  creneauxCount={allCreneaux.filter(cr => cr.classe_id === c.id).length}
                  onClick={() => handleSelectClasse(c.id)} />
              ))}
            </div>
          </Card>
        </div>

        {/* Contenu */}
        <div>
          {!selectedClasse ? (
            <Card><EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Sélectionnez une classe" /></Card>
          ) : (
            <>
              {/* Config */}
              <Card style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Classe</span><p style={{ fontWeight: 600 }}>{selectedClasse.nom}</p></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Niveau</span><p style={{ fontWeight: 600 }}>{selectedClasse.niveau}</p></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salle</span><p style={{ fontWeight: 600 }}>{selectedClasse.salle}</p></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mode</span><p><Badge label={selectedClasse.salle_type === 'fixe' ? 'Fixe' : 'Variable'} variant={selectedClasse.salle_type === 'fixe' ? 'info' : 'warning'} /></p></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Créneaux</span><p style={{ fontWeight: 600 }}>{classeCreneaux.length}</p></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Heures/sem</span><p style={{ fontWeight: 600 }}>{totalHeures}h</p></div>
                </div>
              </Card>

              {/* Form — JAMAIS en readOnly */}
              {showForm && !readOnly && (
                <Card style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Nouveau créneau</h3>
                  {error && <Alert variant="error">{error}</Alert>}
                  <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Matière *</label>
                        <select className="select" value={matiereId} onChange={e => setMatiereId(e.target.value)} required>
                          <option value="">Choisir</option>
                          {allMatieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Jour *</label>
                        <select className="select" value={jour} onChange={e => setJour(e.target.value as JourSemaine)}>
                          {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Enseignant</label>
                        <input type="text" className="input" value={enseignant} onChange={e => setEnseignant(e.target.value)} placeholder="M. Dupont" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Début *</label>
                        <select className="select" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}>
                          {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fin *</label>
                        <select className="select" value={heureFin} onChange={e => setHeureFin(e.target.value)}>
                          {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Salle * {selectedClasse.salle_type === 'fixe' && <Badge label="Fixe" variant="info" />}</label>
                        {selectedClasse.salle_type === 'fixe' ? (
                          <input type="text" className="input input-readonly" value={selectedClasse.salle} readOnly />
                        ) : salles.length > 0 ? (
                          <select className="select" value={salle} onChange={e => setSalle(e.target.value)} disabled={loadingSalles}>
                            {loadingSalles ? <option>Vérification...</option> : sallesDisponibles.map(s => (
                              <option key={s.id} value={s.nom} disabled={!s.disponible}>{s.nom} — {s.disponible ? `${s.capacite} places` : 'Occupée'}</option>
                            ))}
                          </select>
                        ) : (
                          <input type="text" className="input" value={salle} onChange={e => setSalle(e.target.value)} placeholder="Salle" />
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Annuler</Button>
                      <Button type="submit" variant="primary" disabled={submitting || !matiereId || !salle} loading={submitting}>Ajouter le créneau</Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Calendrier */}
              {classeCreneaux.length === 0 && !showForm ? (
                <Card>
                  <EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Aucun créneau"
                    action={!readOnly ? <Button variant="primary" onClick={() => setShowForm(true)}>Ajouter un créneau</Button> : undefined} />
                </Card>
              ) : (
                <Card padding="none">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="planning-table">
                      <thead><tr><th>Horaire</th>{JOURS.map(j => <th key={j}>{j}</th>)}</tr></thead>
                      <tbody>
                        {HEURES.map(heure => (
                          <tr key={heure}>
                            <td>{heure}</td>
                            {JOURS.map(j => {
                              const cc = getCreneaux(j, heure);
                              return (
                                <td key={`${j}-${heure}`}>
                                  {cc.map(cr => (
                                    <div key={cr.id} className="creneau-block" style={{ backgroundColor: cr.matiere_couleur }}>
                                      <div className="creneau-block-title">{cr.matiere_nom}</div>
                                      <div className="creneau-block-time">{cr.heure_debut}–{cr.heure_fin}</div>
                                      <div className="creneau-block-salle">{cr.salle}</div>
                                      {cr.enseignant && <div className="creneau-block-salle">{cr.enseignant}</div>}
                                      {!readOnly && (
                                        <button type="button" className="creneau-block-delete" onClick={() => handleDeleteCreneau(cr)}>✕</button>
                                      )}
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

function ClasseItem({ classe, isSelected, creneauxCount, onClick }: { classe: Classe; isSelected: boolean; creneauxCount: number; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: isSelected ? 'var(--primary-light)' : 'transparent', border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>{classe.nom}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{classe.niveau} • {classe.salle}</div>
        </div>
        <Badge label={`${creneauxCount}`} variant={creneauxCount > 0 ? 'primary' : 'default'} />
      </div>
    </div>
  );
}
