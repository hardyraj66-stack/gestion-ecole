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

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Fiche */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <Avatar initiales={initials} genre={p.genre} size="lg" />
            <div style={{ marginTop: '0.75rem', fontWeight: 600, fontSize: '1rem' }}>{p.prenom} {p.nom}</div>
            <div style={{ marginTop: '0.25rem' }}>
              <Badge label={p.statut === 'actif' ? t('professeurs.statuts.actif') : t('professeurs.statuts.inactif')} variant={p.statut === 'actif' ? 'success' : 'default'} />
            </div>
          </div>
          {[
            { label: t('professeurs.detail.genre'), value: p.genre === 'F' ? t('professeurs.genres.feminin') : t('professeurs.genres.masculin') },
            { label: t('professeurs.detail.email'), value: p.email || '—' },
            { label: t('professeurs.detail.telephone'), value: p.telephone || '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('professeurs.detail.affectations')}</span>
            <span style={{ fontWeight: 600 }}>{assignments.length}</span>
          </div>
        </Card>

        {/* Affectations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: a.matiere_couleur, flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ fontWeight: 500 }}>{a.matiere_nom}</span>
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
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('professeurs.detail.affectationMatiere')}</div>
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
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{t('professeurs.detail.affectationClasses')}</span>
                {assignClasses.size > 0 && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '20px', textTransform: 'none', letterSpacing: 0 }}>{assignClasses.size}</span>}
                {assignMatiere && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {t('professeurs.detail.affectationAide')}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {classes.map((c: any) => {
                  const selected = assignClasses.has(c.id);
                  const disabled = isClasseDisabled(c.id);
                  const alreadyAssigned = assignMatiere
                    ? (data?.assignments ?? []).some((a: any) => a.classe_id === c.id && a.matiere_id === assignMatiere)
                    : false;

                  if (disabled) {
                    return (
                      <span key={c.id} title={alreadyAssigned ? 'Déjà assigné' : 'Matière non enseignée dans ce niveau'} style={{
                        padding: '0.3rem 0.7rem', borderRadius: '20px',
                        border: `1.5px solid ${alreadyAssigned ? 'color-mix(in srgb, var(--success) 35%, transparent)' : 'var(--border)'}`,
                        background: alreadyAssigned ? 'var(--success-light)' : 'transparent',
                        color: alreadyAssigned ? 'var(--success)' : 'var(--text-muted)',
                        fontSize: '0.8rem', fontWeight: 400,
                        cursor: 'not-allowed', userSelect: 'none',
                        textDecoration: alreadyAssigned ? 'none' : 'line-through',
                        opacity: alreadyAssigned ? 0.7 : 0.45,
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      }}>
                        {alreadyAssigned && <span style={{ fontSize: '0.65rem' }}>✓</span>}
                        {c.nom}
                      </span>
                    );
                  }
                  return (
                    <button key={c.id} type="button"
                      onClick={() => setAssignClasses(prev => { const next = new Set(prev); selected ? next.delete(c.id) : next.add(c.id); return next; })}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: '20px',
                        border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: selected ? 'var(--primary)' : 'var(--card-bg)',
                        color: selected ? 'var(--text-on-color)' : 'var(--text)',
                        fontSize: '0.825rem', fontWeight: selected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        boxShadow: selected ? '0 1px 4px rgba(37,99,235,0.18)' : 'none',
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      }}
                    >
                      {selected && <span style={{ fontSize: '0.7rem' }}>✓</span>}
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
