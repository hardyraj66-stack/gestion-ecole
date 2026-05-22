import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    readApi.classesList(1, 100).then((res: any) => { if (res) setClasses(res.items || []); });
    readApi.matieresList(1, 100).then((res: any) => { if (res) setMatieres(res.items || []); });
  }, []);

  const handleAddAssignment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignClasses.size === 0 || !assignMatiere) { setAssignError('Sélectionnez au moins une classe et une matière.'); return; }
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
  }, [id, assignClasses, assignMatiere, createAssignment, refresh]);

  const handleDeleteAssignment = async (a: any) => {
    const ok = await confirm({ title: 'Retirer affectation', message: `Retirer ${a.matiere_nom} — ${a.classe_nom} ?`, confirmText: 'Retirer', variant: 'danger' });
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
  if (error) return <Alert variant="error">Professeur introuvable.</Alert>;

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
    const ok = await confirm({ title: 'Désactiver le professeur', message: `Désactiver ${p.prenom} ${p.nom} ? Il ne sera plus disponible pour les affectations, mais ses données sont conservées.`, confirmText: 'Désactiver', variant: 'danger' });
    if (!ok) return;
    await desactiverProfesseur(id!);
    navigate('/professeurs');
  };

  const handleActiverProfesseur = async () => {
    const ok = await confirm({ title: 'Réactiver le professeur', message: `Réactiver ${p.prenom} ${p.nom} ? Il redeviendra disponible pour les affectations.`, confirmText: 'Réactiver', variant: 'warning' });
    if (!ok) return;
    await activerProfesseur(id!);
    refresh();
  };

  return (
    <div>
      <PageHeader
        title={`${p.genre === 'F' ? 'Mme' : 'M.'} ${p.prenom} ${p.nom}`}
        subtitle={p.statut === 'actif' ? 'Actif' : 'Inactif'}
      >
        <Button variant="secondary" onClick={() => navigate('/professeurs')}>← Retour</Button>
        {!readOnly && (
          <DropdownMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            items={p.statut === 'actif' ? [
              { label: 'Modifier', icon: Icons.edit, onClick: openEdit },
              { label: 'Désactiver', icon: Icons.trash, onClick: handleDesactiverProfesseur, variant: 'danger' },
            ] : [
              { label: 'Réactiver', icon: Icons.edit, onClick: handleActiverProfesseur },
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
              <Badge label={p.statut === 'actif' ? 'Actif' : 'Inactif'} variant={p.statut === 'actif' ? 'success' : 'default'} />
            </div>
          </div>
          {[
            { label: 'Genre', value: p.genre === 'F' ? 'Féminin' : 'Masculin' },
            { label: 'Email', value: p.email || '—' },
            { label: 'Téléphone', value: p.telephone || '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Affectations</span>
            <span style={{ fontWeight: 600 }}>{assignments.length}</span>
          </div>
        </Card>

        {/* Affectations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Affectations ({assignments.length})
            </h3>
            {!readOnly && (
              <Button variant="primary" size="sm" onClick={() => { setShowAssignForm(true); setAssignError(''); setAssignClasses(new Set()); setAssignMatiere(''); }}>
                + Ajouter
              </Button>
            )}
          </div>

          {assignments.length === 0 ? (
            <Card>
              <EmptyState icon={<Icon path={Icons.calendar} size={24} />} message="Aucune affectation" />
            </Card>
          ) : (
            <Card padding="none">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell header>Matière</TableCell>
                    <TableCell header>Classe</TableCell>
                    {!readOnly && <TableCell header>Actions</TableCell>}
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
                          <Button variant="danger" size="sm" onClick={() => handleDeleteAssignment(a)}>Retirer</Button>
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
        <Modal title="Modifier le professeur" onClose={() => setShowEditForm(false)} maxWidth={480}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowEditForm(false)}>Annuler</Button>
              <Button type="submit" form="edit-prof-form" variant="primary" disabled={editSubmitting} loading={editSubmitting}>Enregistrer</Button>
            </>
          }
        >
          {editError && <Alert variant="error">{editError}</Alert>}
          <form id="edit-prof-form" onSubmit={handleEditSubmit}>
            <FormGrid columns={2}>
              <Input label="Nom *" value={editForm.nom} onChange={e => handleEditField('nom', e.target.value)} placeholder="Dupont" error={editFieldErrors.nom} />
              <Input label="Prénom *" value={editForm.prenom} onChange={e => handleEditField('prenom', e.target.value)} placeholder="Jean" error={editFieldErrors.prenom} />
              <Input label="Email" type="email" value={editForm.email} onChange={e => handleEditField('email', e.target.value)} placeholder="jean.dupont@ecole.fr" error={editFieldErrors.email} />
              <Input label="Téléphone" value={editForm.telephone} onChange={e => handleEditField('telephone', e.target.value)} placeholder="06 00 00 00 00" error={editFieldErrors.telephone} />
            </FormGrid>
          </form>
        </Modal>
      )}

      {/* Popup ajout affectation */}
      {showAssignForm && (
        <Modal title="Nouvelle affectation" onClose={() => setShowAssignForm(false)} maxWidth={560}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowAssignForm(false)}>Annuler</Button>
              <Button type="submit" form="assign-form" variant="primary" disabled={assignSubmitting || assignClasses.size === 0 || !assignMatiere} loading={assignSubmitting}>
                Ajouter {assignClasses.size > 1 ? `(${assignClasses.size})` : ''}
              </Button>
            </>
          }
        >
          {assignError && <Alert variant="error">{assignError}</Alert>}
          <form id="assign-form" onSubmit={handleAddAssignment}>
            {/* Matière */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Matière *</div>
              <MatierePills
                matieres={matieres}
                selectedIds={assignMatiere ? [assignMatiere] : []}
                onToggle={(id) => setAssignMatiere(id)}
                singleSelect={true}
              />
            </div>

            {/* Classes */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Classes * {assignClasses.size > 0 && <span style={{ color: 'var(--primary)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— {assignClasses.size} sélectionnée(s)</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {classes.map((c: any) => {
                  const selected = assignClasses.has(c.id);
                  return (
                    <button key={c.id} type="button"
                      onClick={() => setAssignClasses(prev => { const next = new Set(prev); selected ? next.delete(c.id) : next.add(c.id); return next; })}
                      style={{
                        padding: '0.3rem 0.75rem', borderRadius: '20px',
                        border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: selected ? '#2563eb18' : 'transparent',
                        color: selected ? 'var(--primary)' : 'var(--text)',
                        fontSize: '0.825rem', fontWeight: selected ? 600 : 400, cursor: 'pointer',
                      }}
                    >
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
