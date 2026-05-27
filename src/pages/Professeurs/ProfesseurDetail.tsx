import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useProfesseurs } from '../../contexts/ProfesseurContext';
import { useTeacherAssignments } from '../../contexts/TeacherAssignmentContext';
import { useProfesseurDetailData } from '../../hooks/usePageData';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Alert } from '../../components/shared/Alert';
import { FormGrid } from '../../components/shared/FormGrid';
import { Input } from '../../components/shared/Input';
import { Avatar } from '../../components/shared/Avatar';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon, Icons } from '../../components/shared/Icon';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import { Modal } from '../../components/shared/Modal';
import { MatierePills } from '../../components/shared/MatierePills';
import { DropdownMenu } from '../../components/shared/DropdownMenu';
import { readApi } from '../../services/readApi';

export function ProfesseurDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isViewingArchive: readOnly } = useViewing();
  const { update: updateProfesseur, desactiver: desactiverProfesseur, activer: activerProfesseur } = useProfesseurs();
  const { create: createAssignment, delete: deleteAssignment } = useTeacherAssignments();
  const confirm = useConfirm();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data, loading, error, refresh } = useProfesseurDetailData(id!);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [editFieldErrors, setEditFieldErrors] = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignClasses, setAssignClasses] = useState<Set<string>>(new Set());
  const [assignMatiere, setAssignMatiere] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);

  useEffect(() => {
    readApi.classesList(1, 100).then((res: any) => { if (res) setClasses(res.items || []); });
    readApi.matieresList(1, 100).then((res: any) => { if (res) setMatieres(res.items || []); });
    readApi.niveaux().then((res: any) => { if (Array.isArray(res)) setNiveaux(res); });
  }, []);

  const isClasseDisabled = useCallback((classeId: string): boolean => {
    if (!assignMatiere) return false;
    const existingAssignments: any[] = data?.assignments ?? [];
    if (existingAssignments.some((a: any) => a.classe_id === classeId && a.matiere_id === assignMatiere)) return true;
    if (niveaux.length > 0) {
      const classe = classes.find((c: any) => c.id === classeId);
      if (classe) {
        const niveauConfig = niveaux.find((n: any) => (n.nom ?? n.niveau) === classe.niveau);
        const allowedIds: string[] = niveauConfig?.matiere_ids ?? [];
        if (allowedIds.length > 0 && !allowedIds.includes(assignMatiere)) return true;
      }
    }
    return false;
  }, [assignMatiere, classes, niveaux, data]);

  const handleAddAssignment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignClasses.size === 0 || !assignMatiere) { setAssignError(t('professeurs.detail.erreurAffectation')); return; }
    setAssignSubmitting(true); setAssignError('');
    for (const classeId of assignClasses) {
      await createAssignment(
        { professeur_id: id, classe_id: classeId, matiere_id: assignMatiere },
        () => {},
        (err) => setAssignError(err),
      );
    }
    setShowAssignForm(false); setAssignClasses(new Set()); setAssignMatiere(''); refresh();
    setAssignSubmitting(false);
  }, [id, assignClasses, assignMatiere, createAssignment, refresh, t]);

  const handleDeleteAssignment = async (a: any) => {
    const ok = await confirm({
      title: t('professeurs.detail.retireTitre'),
      message: t('professeurs.detail.retirerMsg', { matiere: a.matiere_nom, classe: a.classe_nom }),
      confirmText: t('professeurs.detail.retirerBtn'),
      variant: 'danger',
    });
    if (!ok) return;
    await deleteAssignment(a.id);
    refresh();
  };

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      nom: validateEditField('nom', editForm.nom),
      prenom: validateEditField('prenom', editForm.prenom),
      email: validateEditField('email', editForm.email),
      telephone: validateEditField('telephone', editForm.telephone),
    };
    setEditFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setEditSubmitting(true); setEditError('');
    await updateProfesseur(id!, editForm,
      () => { setShowEditForm(false); refresh(); },
      (err) => setEditError(err),
    );
    setEditSubmitting(false);
  }, [id, editForm, updateProfesseur, refresh]);

  if (loading || !data) return <PageLoader />;
  if (error) return <Alert variant="error">{t('professeurs.erreur')}</Alert>;

  const { professeur: p, assignments } = data;

  const initials = `${p.prenom[0] || ''}${p.nom[0] || ''}`.toUpperCase();

  const openEdit = () => {
    setEditForm({ nom: p.nom, prenom: p.prenom, email: p.email || '', telephone: p.telephone || '' });
    setEditFieldErrors({ nom: '', prenom: '', email: '', telephone: '' });
    setEditError('');
    setShowEditForm(true);
  };

  const validateEditField = (field: keyof typeof editForm, value: string) => {
    if (field === 'nom' || field === 'prenom') return !value.trim() ? 'Ce champ est requis.' : '';
    if (field === 'email' && value) return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email invalide.' : '';
    if (field === 'telephone' && value) return !/^[\d\s\+\-\.()]{6,20}$/.test(value) ? 'Numéro invalide.' : '';
    return '';
  };

  const handleEditField = (field: keyof typeof editForm, value: string) => {
    setEditForm(f => ({ ...f, [field]: value }));
    setEditFieldErrors(f => ({ ...f, [field]: validateEditField(field, value) }));
  };

  const handleDesactiverProfesseur = async () => {
    const ok = await confirm({
      title: t('professeurs.detail.confirmDesactiver'),
      message: t('professeurs.detail.confirmDesactiverMsg', { prenom: p.prenom, nom: p.nom }),
      confirmText: t('professeurs.detail.confirmDesactiverBtn'),
      variant: 'danger',
    });
    if (!ok) return;
    await desactiverProfesseur(id!);
    navigate('/professeurs');
  };

  const handleActiverProfesseur = async () => {
    const ok = await confirm({
      title: t('professeurs.detail.confirmReactiver'),
      message: t('professeurs.detail.confirmReactiverMsg', { prenom: p.prenom, nom: p.nom }),
      confirmText: t('professeurs.detail.confirmReactiverBtn'),
      variant: 'warning',
    });
    if (!ok) return;
    await activerProfesseur(id!);
    refresh();
  };

  const prefixe = p.genre === 'F' ? t('professeurs.genres.prefixMme') : t('professeurs.genres.prefixM');

  return (
    <div>
      <PageHeader
        title={`${prefixe} ${p.prenom} ${p.nom}`}
        subtitle={p.statut === 'actif' ? t('professeurs.statuts.actif') : t('professeurs.statuts.inactif')}
      >
        <Button variant="secondary" onClick={() => navigate('/professeurs')}>{t('professeurs.retour')}</Button>
        {!readOnly && (
          <DropdownMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            items={p.statut === 'actif' ? [
              { label: t('professeurs.actions.modifier'), icon: Icons.edit, onClick: openEdit },
              { label: t('professeurs.actions.desactiver'), icon: Icons.trash, onClick: handleDesactiverProfesseur, variant: 'danger' },
            ] : [
              { label: t('professeurs.actions.reactiver'), icon: Icons.edit, onClick: handleActiverProfesseur },
            ]}
          />
        )}
      </PageHeader>

      <div className="prof-detail-layout">

        {/* Fiche */}
        <Card>
          <div className="prof-fiche-hero">
            <Avatar initiales={initials} genre={p.genre} size="lg" />
            <div className="prof-fiche-name">{p.prenom} {p.nom}</div>
            <div className="prof-fiche-badge">
              <Badge label={p.statut === 'actif' ? t('professeurs.statuts.actif') : t('professeurs.statuts.inactif')} variant={p.statut === 'actif' ? 'success' : 'default'} />
            </div>
          </div>
          {[
            { label: t('professeurs.detail.genre'), value: p.genre === 'F' ? t('professeurs.genres.feminin') : t('professeurs.genres.masculin') },
            { label: t('professeurs.detail.email'), value: p.email || '—' },
            { label: t('professeurs.detail.telephone'), value: p.telephone || '—' },
          ].map(item => (
            <div key={item.label} className="prof-fiche-row">
              <span className="prof-fiche-label">{item.label}</span>
              <span className="prof-fiche-value">{item.value}</span>
            </div>
          ))}
          <div className="prof-fiche-row-last">
            <span className="prof-fiche-label">{t('professeurs.detail.affectations')}</span>
            <span className="prof-fiche-count">{assignments.length}</span>
          </div>
        </Card>

        {/* Affectations */}
        <div>
          <div className="prof-assignments-header">
            <h3 className="prof-assignments-title">
              {t('professeurs.detail.affectationsCount', { count: assignments.length })}
            </h3>
            {!readOnly && (
              <Button variant="primary" size="sm" onClick={() => { setShowAssignForm(true); setAssignError(''); setAssignClasses(new Set()); setAssignMatiere(''); }}>
                {t('professeurs.detail.ajouter')}
              </Button>
            )}
          </div>

          {assignments.length === 0 ? (
            <Card>
              <EmptyState icon={<Icon path={Icons.calendar} size={24} />} message={t('professeurs.detail.aucuneAffectation')} />
            </Card>
          ) : (
            <Card padding="none">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell header>{t('professeurs.detail.colonnes.matiere')}</TableCell>
                    <TableCell header>{t('professeurs.detail.colonnes.classe')}</TableCell>
                    {!readOnly && <TableCell header>{t('professeurs.detail.colonnes.actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="prof-matiere-cell">
                          <span className="prof-matiere-dot" style={{ background: a.matiere_couleur }} />
                          <span className="prof-matiere-name">{a.matiere_nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>{a.classe_nom}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteAssignment(a)}>{t('professeurs.detail.retirer')}</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {/* Popup modification professeur */}
      {showEditForm && (
        <Modal title={t('professeurs.actions.modifierTitre')} onClose={() => setShowEditForm(false)} maxWidth={480}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowEditForm(false)}>{t('common.annuler')}</Button>
              <Button type="submit" form="edit-prof-form" variant="primary" disabled={editSubmitting} loading={editSubmitting}>{t('common.enregistrer')}</Button>
            </>
          }
        >
          {editError && <Alert variant="error">{editError}</Alert>}
          <form id="edit-prof-form" onSubmit={handleEditSubmit}>
            <FormGrid columns={2}>
              <Input label={t('professeurs.form.nom')} value={editForm.nom} onChange={e => handleEditField('nom', e.target.value)} placeholder={t('professeurs.form.nomPlaceholder')} error={editFieldErrors.nom} />
              <Input label={t('professeurs.form.prenom')} value={editForm.prenom} onChange={e => handleEditField('prenom', e.target.value)} placeholder={t('professeurs.form.prenomPlaceholder')} error={editFieldErrors.prenom} />
              <Input label={t('professeurs.form.email')} type="email" value={editForm.email} onChange={e => handleEditField('email', e.target.value)} placeholder={t('professeurs.form.emailPlaceholder')} error={editFieldErrors.email} />
              <Input label={t('professeurs.form.telephone')} value={editForm.telephone} onChange={e => handleEditField('telephone', e.target.value)} placeholder={t('professeurs.form.telephonePlaceholder')} error={editFieldErrors.telephone} />
            </FormGrid>
          </form>
        </Modal>
      )}

      {/* Popup ajout affectation */}
      {showAssignForm && (
        <Modal title={t('professeurs.detail.nouvelleAffectation')} onClose={() => setShowAssignForm(false)} maxWidth={560}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowAssignForm(false)}>{t('common.annuler')}</Button>
              <Button type="submit" form="assign-form" variant="primary" disabled={assignSubmitting || assignClasses.size === 0 || !assignMatiere} loading={assignSubmitting}>
                {assignClasses.size > 1
                  ? t('professeurs.detail.ajouterAffectationCount', { count: assignClasses.size })
                  : t('professeurs.detail.ajouterAffectation')}
              </Button>
            </>
          }
        >
          {assignError && <Alert variant="error">{assignError}</Alert>}
          <form id="assign-form" onSubmit={handleAddAssignment}>
            {/* Matière */}
            <div className="prof-assign-section">
              <div className="prof-assign-section-label">{t('professeurs.detail.affectationMatiere')}</div>
              <MatierePills
                matieres={matieres}
                selectedIds={assignMatiere ? [assignMatiere] : []}
                onToggle={(matiereId) => {
                  setAssignMatiere(matiereId);
                  setAssignClasses(prev => {
                    const next = new Set(prev);
                    const existingAssignments: any[] = data?.assignments ?? [];
                    for (const c of classes) {
                      const alreadyAssigned = existingAssignments.some((a: any) => a.classe_id === c.id && a.matiere_id === matiereId);
                      const niveauConfig = niveaux.find((n: any) => (n.nom ?? n.niveau) === c.niveau);
                      const allowedIds: string[] = niveauConfig?.matiere_ids ?? [];
                      const niveauBloque = allowedIds.length > 0 && !allowedIds.includes(matiereId);
                      if (alreadyAssigned || niveauBloque) next.delete(c.id);
                    }
                    return next;
                  });
                }}
                singleSelect={true}
              />
            </div>

            {/* Classes */}
            <div className="prof-assign-section">
              <div className="prof-assign-section-label">
                <span>{t('professeurs.detail.affectationClasses')}</span>
                {assignClasses.size > 0 && <span className="prof-assign-count-badge">{assignClasses.size}</span>}
                {assignMatiere && <span className="prof-assign-hint">— {t('professeurs.detail.affectationAide')}</span>}
              </div>
              <div className="prof-assign-classes">
                {classes.map((c: any) => {
                  const selected = assignClasses.has(c.id);
                  const disabled = isClasseDisabled(c.id);
                  const alreadyAssigned = assignMatiere
                    ? (data?.assignments ?? []).some((a: any) => a.classe_id === c.id && a.matiere_id === assignMatiere)
                    : false;

                  if (disabled) {
                    return (
                      <span
                        key={c.id}
                        title={alreadyAssigned ? 'Déjà assigné' : 'Matière non enseignée dans ce niveau'}
                        className={`prof-assign-class-disabled${alreadyAssigned ? ' already-assigned' : ' niveau-blocked'}`}
                      >
                        {alreadyAssigned && <span className="prof-assign-class-check-sm">✓</span>}
                        {c.nom}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAssignClasses(prev => { const next = new Set(prev); selected ? next.delete(c.id) : next.add(c.id); return next; })}
                      className={`prof-assign-class-btn${selected ? ' selected' : ''}`}
                    >
                      {selected && <span className="prof-assign-class-check">✓</span>}
                      {c.nom}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
