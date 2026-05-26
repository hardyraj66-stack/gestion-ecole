import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function CreateEleve() {
  const { t } = useTranslation();
  const { isViewingArchive } = useViewing();
  const { create } = useEleves();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const GENRE_OPTIONS: SelectOption[] = [
    { value: 'M', label: t('eleves.creer.form.masculin') },
    { value: 'F', label: t('eleves.creer.form.feminin') },
  ];

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

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    readApi.niveaux().then(d => { if (Array.isArray(d)) setNiveaux(d); setLoadingNiveaux(false); });
  }, []);

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

  const handleSelectClasse = async (classe: any) => {
    if (classe.pleine) {
      const ok = await confirm({
        title: t('eleves.creer.classeComplete'),
        message: t('eleves.creer.confirmClasseComplete', { nom: classe.nom, nb: classe.nb_eleves, capacite: classe.capacite }),
        confirmText: t('eleves.creer.confirmerAffectation'),
        cancelText: t('eleves.creer.choisirAutreClasse'),
        variant: 'warning',
      });
      if (!ok) return;
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
    if (!prenom.trim() || !nom.trim() || !dateNaissance || !classeId) { setError(t('eleves.creer.erreurChamps')); return; }
    setSubmitting(true); setError('');
    const result = await create({
      prenom: prenom.trim(), nom: nom.trim(), genre, date_naissance: dateNaissance, classe_id: classeId,
      statut: 'actif' as const,
      email: email.trim() || undefined, telephone: telephone.trim() || undefined, adresse: adresse.trim() || undefined,
    });
    if (result) {
      navigate(`/eleves/${result.id}`);
    } else { setError(t('eleves.creer.erreurCreation')); setSubmitting(false); }
  };

  if (loadingNiveaux) return <PageLoader />;

  return (
    <div>
      <PageHeader title={t('eleves.creer.titre')} subtitle={t('eleves.creer.sousTitre')}>
        <Button as="link" to="/eleves" variant="secondary">{t('common.retour')}</Button>
      </PageHeader>
      <Card style={{ maxWidth: '700px' }}>
        {error && <Alert variant="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <FormSection title={t('eleves.creer.sections.personnel')}>
            <FormGrid columns={3}>
              <Input label={t('eleves.creer.form.prenom')} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder={t('eleves.creer.form.prenomPlaceholder')} required />
              <Input label={t('eleves.creer.form.nom')} value={nom} onChange={e => setNom(e.target.value)} placeholder={t('eleves.creer.form.nomPlaceholder')} required />
              <Select label={t('eleves.creer.form.genre')} value={genre} onChange={e => setGenre(e.target.value as 'M' | 'F')} options={GENRE_OPTIONS} />
            </FormGrid>
          </FormSection>

          <FormSection title={t('eleves.creer.sections.scolarite')}>
            <FormGrid>
              <Input label={t('eleves.creer.form.dateNaissance')} type="date" value={dateNaissance} onChange={e => handleDateChange(e.target.value)} required />
              <Select label={t('eleves.creer.form.niveau')} value={selectedNiveau} onChange={e => handleNiveauChange(e.target.value)} options={niveauOptions} placeholder={t('eleves.creer.form.choisirNiveau')} />
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
                          {selectedClasseObj.pleine && <Badge label={t('eleves.creer.capaciteAtteinte')} variant="warning" />}
                        </span>
                        <span className="classe-selection-meta">{selectedClasseObj.nb_eleves}/{selectedClasseObj.capacite} {t('elevesTable.eleve').toLowerCase()}s</span>
                      </div>
                    </div>
                    <button type="button" className="classe-selection-change" onClick={() => { fetchClasses(selectedNiveau, dateNaissance || undefined); setShowPopup(true); }}>{t('eleves.creer.changer')}</button>
                  </div>
                ) : (
                  <button type="button" className="classe-select-trigger" onClick={() => { fetchClasses(selectedNiveau, dateNaissance || undefined); setShowPopup(true); }}>
                    <Icon path="M12 4v16m8-8H4" size={16} />
                    <span>{t('eleves.creer.choisirClasseNiveau', { niveau: selectedNiveau })}</span>
                  </button>
                )}
              </div>
            )}
          </FormSection>

          <FormSection title={t('eleves.creer.sections.contact')}>
            <FormGrid>
              <Input label={t('eleves.creer.form.email')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('eleves.creer.form.emailPlaceholder')} />
              <Input label={t('eleves.creer.form.telephone')} type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder={t('eleves.creer.form.telephonePlaceholder')} />
            </FormGrid>
            <Input label={t('eleves.creer.form.adresse')} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder={t('eleves.creer.form.adressePlaceholder')} fullWidth />
          </FormSection>

          <FormActions>
            <Button as="link" to="/eleves" variant="secondary">{t('common.annuler')}</Button>
            <Button type="submit" variant="primary" disabled={submitting || !classeId || !prenom.trim() || !nom.trim() || !dateNaissance} loading={submitting}>{t('eleves.creer.inscrireBtn')}</Button>
          </FormActions>
        </form>
      </Card>

      {showPopup && selectedNiveau && (
        <Modal title={t('eleves.creer.affecterClasseNiveau', { niveau: selectedNiveau })} onClose={() => setShowPopup(false)}>
          {loadingClasses ? (
            <div style={{ padding: '3rem' }}><PageLoader /></div>
          ) : (
            <>
              {suggestedClasse && (
                <div className={`classe-popup-suggestion ${suggestedClasse.pleine ? 'classe-popup-suggestion-warning' : ''}`}>
                  <div className="classe-popup-suggestion-header">
                    <Icon path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" size={18} />
                    <span>{t('eleves.creer.suggestionAuto')}</span>
                    {suggestedClasse.pleine && <Badge label={t('eleves.creer.toutesClassespleines')} variant="warning" />}
                  </div>
                  <div className="classe-popup-suggestion-card" onClick={() => handleSelectClasse(suggestedClasse)}>
                    <div className="classe-popup-suggestion-main">
                      <span className="classe-popup-suggestion-name">{suggestedClasse.nom}</span>
                      <Badge label={t('eleves.creer.recommandee')} variant={suggestedClasse.pleine ? 'warning' : 'success'} />
                    </div>
                    <div className="classe-popup-suggestion-meta">
                      <span>{suggestedClasse.nb_eleves}/{suggestedClasse.capacite} {t('elevesTable.eleve').toLowerCase()}s</span>
                      <span>•</span>
                      <span>{suggestedClasse.pleine ? t('eleves.creer.capaciteAtteinte') : t('eleves.creer.placesRestantes', { count: suggestedClasse.places_restantes })}</span>
                    </div>
                    <div className="classe-popup-suggestion-bar">
                      <div className="progress" style={{ height: '4px' }}>
                        <div className={`progress-bar ${suggestedClasse.taux >= 90 ? 'full' : ''}`} style={{ width: `${Math.min(suggestedClasse.taux, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="classe-popup-list">
                <div className="classe-popup-list-header">{t('eleves.creer.toutesClasses', { niveau: selectedNiveau })}</div>
                {classesNiveau.map((c: any) => (
                  <div
                    key={c.id}
                    className={`classe-popup-item ${c.id === classeId ? 'classe-popup-item-selected' : ''} ${c.pleine ? 'classe-popup-item-warning' : ''}`}
                    onClick={() => handleSelectClasse(c)}
                  >
                    <div className="classe-popup-item-left">
                      <span className="classe-popup-item-name">{c.nom}</span>
                      {c.id === suggestedId && <Badge label={t('eleves.creer.suggeree')} variant={c.pleine ? 'warning' : 'success'} />}
                      {c.pleine && <Badge label={t('eleves.creer.complete')} variant="danger" />}
                    </div>
                    <div className="classe-popup-item-right">
                      <span className="classe-popup-item-count">{c.nb_eleves}/{c.capacite}</span>
                      <div className="classe-popup-item-bar">
                        <div className="progress" style={{ width: '60px', height: '4px' }}>
                          <div className={`progress-bar ${c.taux >= 90 ? 'full' : ''}`} style={{ width: `${Math.min(c.taux, 100)}%` }} />
                        </div>
                      </div>
                      <span className="classe-popup-item-places">{c.pleine ? t('eleves.creer.zeroPlaces') : t('eleves.creer.nbPlaces', { count: c.places_restantes })}</span>
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
