import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEleves } from '../../contexts/EleveContext';
import { useViewing } from '../../contexts/ViewingContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/shared/Icon';
import { PageLoader } from '../../components/ui/PageLoader';
import { Modal } from '../../components/shared/Modal';
import { FormGrid, FormSection, FormActions } from '../../components/shared/FormGrid';

const GENRE_OPTIONS: SelectOption[] = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
];

export function CreateEleve() {
  const { isViewingArchive } = useViewing();
  const { create } = useEleves();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [niveaux, setNiveaux] = useState<{ niveau: string; count: number }[]>([]);
  const [classesNiveau, setClassesNiveau] = useState<any[]>([]);
  const [suggestedId, setSuggestedId] = useState<string | null>(null);
  const [loadingNiveaux, setLoadingNiveaux] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [genre, setGenre] = useState<'M' | 'F'>('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [classeId, setClasseId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Niveaux au montage
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    readApi.niveaux().then(d => { if (Array.isArray(d)) setNiveaux(d); setLoadingNiveaux(false); });
  }, []);

  // 2. Classes à la demande
  const fetchClasses = async (niveau: string, dn?: string) => {
    setLoadingClasses(true);
    const data = await readApi.classesParNiveau(niveau, dn);
    if (data) { setClassesNiveau(data.classes || []); setSuggestedId(data.suggestedId || null); }
    setLoadingClasses(false);
  };

  const handleNiveauChange = (niveau: string) => {
    setSelectedNiveau(niveau); setClasseId(''); setClassesNiveau([]); setSuggestedId(null);
    if (niveau) { fetchClasses(niveau, dateNaissance || undefined); setShowPopup(true); }
  };

  const handleDateChange = (dn: string) => {
    setDateNaissance(dn);
    if (selectedNiveau) fetchClasses(selectedNiveau, dn || undefined);
  };

  // Sélection d'une classe — avec avertissement si pleine
  const handleSelectClasse = async (classe: any) => {
    if (classe.pleine) {
      const ok = await confirm({
        title: 'Classe complète',
        message: `La classe « ${classe.nom} » a atteint sa capacité maximale (${classe.nb_eleves}/${classe.capacite} élèves).\n\nVoulez-vous quand même affecter l'élève à cette classe ?`,
        confirmText: 'Confirmer l\'affectation',
        cancelText: 'Choisir une autre classe',
        variant: 'warning',
      });
      if (!ok) return; // retour à la liste
    }
    setClasseId(classe.id);
    setShowPopup(false);
  };

  const selectedClasseObj = classesNiveau.find((c: any) => c.id === classeId);
  const suggestedClasse = classesNiveau.find((c: any) => c.id === suggestedId);
  const niveauOptions: SelectOption[] = niveaux.map(n => ({ value: n.niveau, label: `${n.niveau} (${n.count} classe${n.count > 1 ? 's' : ''})` }));

  if (isViewingArchive) return <Navigate to="/eleves" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim() || !dateNaissance || !classeId) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    setSubmitting(true); setError('');
    const result = await create({
      prenom: prenom.trim(), nom: nom.trim(), genre, date_naissance: dateNaissance, classe_id: classeId,
      statut: 'actif' as const,
      email: email.trim() || undefined, telephone: telephone.trim() || undefined, adresse: adresse.trim() || undefined,
    });
    if (result) {
      navigate(`/eleves/${result.id}`);
    } else { setError('Erreur lors de la création'); setSubmitting(false); }
  };

  if (loadingNiveaux) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Nouvel élève" subtitle="Inscrire un nouvel élève">
        <Button as="link" to="/eleves" variant="secondary">← Retour</Button>
      </PageHeader>
      <Card style={{ maxWidth: '700px' }}>
        {error && <Alert variant="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <FormSection title="Informations personnelles">
            <FormGrid columns={3}>
              <Input label="Prénom *" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Ex : Jean" required />
              <Input label="Nom *" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Dupont" required />
              <Select label="Genre *" value={genre} onChange={e => setGenre(e.target.value as 'M' | 'F')} options={GENRE_OPTIONS} />
            </FormGrid>
          </FormSection>

          <FormSection title="Scolarité">
            <FormGrid>
              <Input label="Date de naissance *" type="date" value={dateNaissance} onChange={e => handleDateChange(e.target.value)} required />
              <Select label="Niveau *" value={selectedNiveau} onChange={e => handleNiveauChange(e.target.value)} options={niveauOptions} placeholder="Choisir un niveau" />
            </FormGrid>

            {selectedNiveau && (
              <div style={{ marginTop: '0.75rem' }}>
                {classeId && selectedClasseObj ? (
                  <div className={`classe-selection-badge ${selectedClasseObj.pleine ? 'classe-selection-badge-warning' : ''}`}>
                    <div className="classe-selection-info">
                      <Icon path="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" size={16} />
                      <div>
                        <span className="classe-selection-name">
                          {selectedClasseObj.nom}
                          {selectedClasseObj.pleine && <Badge label="Dépassement" variant="warning" />}
                        </span>
                        <span className="classe-selection-meta">{selectedClasseObj.nb_eleves}/{selectedClasseObj.capacite} élèves</span>
                      </div>
                    </div>
                    <button type="button" className="classe-selection-change" onClick={() => { fetchClasses(selectedNiveau, dateNaissance || undefined); setShowPopup(true); }}>Changer</button>
                  </div>
                ) : (
                  <button type="button" className="classe-select-trigger" onClick={() => { fetchClasses(selectedNiveau, dateNaissance || undefined); setShowPopup(true); }}>
                    <Icon path="M12 4v16m8-8H4" size={16} />
                    <span>Choisir une classe en {selectedNiveau}</span>
                  </button>
                )}
              </div>
            )}
          </FormSection>

          <FormSection title="Contact (optionnel)">
            <FormGrid>
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.dupont@email.com" />
              <Input label="Téléphone" type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
            </FormGrid>
            <Input label="Adresse" value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="123 Rue de l'École" fullWidth />
          </FormSection>

          <FormActions>
            <Button as="link" to="/eleves" variant="secondary">Annuler</Button>
            <Button type="submit" variant="primary" disabled={submitting || !classeId || !prenom.trim() || !nom.trim() || !dateNaissance} loading={submitting}>Inscrire l'élève</Button>
          </FormActions>
        </form>
      </Card>

      {/* ===== POPUP ===== */}
      {showPopup && selectedNiveau && (
        <Modal title={`Affecter une classe — ${selectedNiveau}`} onClose={() => setShowPopup(false)}>
          {loadingClasses ? (
            <div style={{ padding: '3rem' }}><PageLoader /></div>
          ) : (
            <>
              {/* Suggestion */}
              {suggestedClasse && (
                <div className={`classe-popup-suggestion ${suggestedClasse.pleine ? 'classe-popup-suggestion-warning' : ''}`}>
                  <div className="classe-popup-suggestion-header">
                    <Icon path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" size={18} />
                    <span>Suggestion automatique</span>
                    {suggestedClasse.pleine && <Badge label="Toutes les classes sont pleines" variant="warning" />}
                  </div>
                  <div className="classe-popup-suggestion-card" onClick={() => handleSelectClasse(suggestedClasse)}>
                    <div className="classe-popup-suggestion-main">
                      <span className="classe-popup-suggestion-name">{suggestedClasse.nom}</span>
                      <Badge label="Recommandée" variant={suggestedClasse.pleine ? 'warning' : 'success'} />
                    </div>
                    <div className="classe-popup-suggestion-meta">
                      <span>{suggestedClasse.nb_eleves}/{suggestedClasse.capacite} élèves</span>
                      <span>•</span>
                      <span>{suggestedClasse.pleine ? 'Capacité atteinte' : `${suggestedClasse.places_restantes} places restantes`}</span>
                    </div>
                    <div className="classe-popup-suggestion-bar">
                      <div className="progress" style={{ height: '4px' }}>
                        <div className={`progress-bar ${suggestedClasse.taux >= 90 ? 'full' : ''}`} style={{ width: `${Math.min(suggestedClasse.taux, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste */}
              <div className="classe-popup-list">
                <div className="classe-popup-list-header">Toutes les classes — {selectedNiveau}</div>
                {classesNiveau.map((c: any) => (
                  <div
                    key={c.id}
                    className={`classe-popup-item ${c.id === classeId ? 'classe-popup-item-selected' : ''} ${c.pleine ? 'classe-popup-item-warning' : ''}`}
                    onClick={() => handleSelectClasse(c)}
                  >
                    <div className="classe-popup-item-left">
                      <span className="classe-popup-item-name">{c.nom}</span>
                      {c.id === suggestedId && <Badge label="Suggérée" variant={c.pleine ? 'warning' : 'success'} />}
                      {c.pleine && <Badge label="Complète" variant="danger" />}
                    </div>
                    <div className="classe-popup-item-right">
                      <span className="classe-popup-item-count">{c.nb_eleves}/{c.capacite}</span>
                      <div className="classe-popup-item-bar">
                        <div className="progress" style={{ width: '60px', height: '4px' }}>
                          <div className={`progress-bar ${c.taux >= 90 ? 'full' : ''}`} style={{ width: `${Math.min(c.taux, 100)}%` }} />
                        </div>
                      </div>
                      <span className="classe-popup-item-places">{c.pleine ? '0' : c.places_restantes} pl.</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
