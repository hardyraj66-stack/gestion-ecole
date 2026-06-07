import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useReadOnly } from '../../hooks/useReadOnly';
import { useNiveaux as useNiveauxCtx } from '../../contexts/NiveauContext';
import { useNiveauxListData } from '../../hooks/usePageData';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { Input } from '../../components/shared/Input';
import { Icon, Icons } from '../../components/shared/Icon';
import { Modal } from '../../components/shared/Modal';
import { MatierePills } from '../../components/shared/MatierePills';
import { Badge } from '../../components/ui/Badge';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import type { Niveau } from '../../contexts/NiveauContext';

interface EditForm {
  nom: string;
  ordre: string;
  description: string;
  matiere_ids: string[];
}

export function NiveauxList() {
  const { t } = useTranslation();
  const { isViewingArchive } = useViewing();
  const readOnly = useReadOnly();
  const { create, update, delete: deleteNiveau } = useNiveauxCtx();
  const confirm = useConfirm();
  const { data, loading, error } = useNiveauxListData();

  const [allMatieres, setAllMatieres] = useState<{ id: string; nom: string; code: string }[]>([]);
  const [editNiveau, setEditNiveau] = useState<Niveau | null>(null);
  const [form, setForm] = useState<EditForm>({ nom: '', ordre: '0', description: '', matiere_ids: [] });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [localNiveaux, setLocalNiveaux] = useState<any[] | null>(null);

  useEffect(() => {
    readApi.matieresList(1, 200).then((res: any) => {
      if (res?.items) setAllMatieres(res.items.map((m: any) => ({ id: m.id, nom: m.nom, code: m.code })));
    });
  }, []);

  useEffect(() => {
    if (data) setLocalNiveaux(Array.isArray(data) ? data : []);
  }, [data]);

  const niveaux: any[] = localNiveaux ?? (Array.isArray(data) ? data : []);

  const openEdit = (n: any) => {
    const nom = n.nom ?? n.niveau ?? '';
    setEditNiveau({ ...n, nom });
    setForm({ nom, ordre: String(n.ordre ?? 0), description: n.description ?? '', matiere_ids: n.matiere_ids ?? [] });
    setFormError('');
  };

  const closeEdit = () => { setEditNiveau(null); setFormError(''); };

  const toggleMatiere = (id: string) => {
    setForm(f => ({
      ...f,
      matiere_ids: f.matiere_ids.includes(id) ? f.matiere_ids.filter(x => x !== id) : [...f.matiere_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!editNiveau) return;
    if (!form.nom.trim()) { setFormError(t('niveaux.erreurs.nomRequis')); return; }
    const ordreVal = parseInt(form.ordre) || 0;
    const maxOrdre = editNiveau.id ? niveaux.length - 1 : niveaux.length;
    if (ordreVal < 0 || ordreVal > maxOrdre) {
      setFormError(t('niveaux.erreurs.ordreInvalide', { max: maxOrdre }));
      return;
    }
    setSubmitting(true);
    setFormError('');

    if (!editNiveau.id) {
      const result = await create({
        nom: form.nom.trim(),
        ordre: parseInt(form.ordre) || 0,
        description: form.description,
        matiere_ids: form.matiere_ids,
      });
      setSubmitting(false);
      if (result.ok) {
        setLocalNiveaux(null);
        closeEdit();
      } else {
        setFormError(result.error || t('niveaux.erreurCreation'));
      }
      return;
    }

    const result = await update(editNiveau.id, {
      nom: form.nom.trim(),
      ordre: parseInt(form.ordre) || 0,
      description: form.description,
      matiere_ids: form.matiere_ids,
    });
    setSubmitting(false);
    if (result.ok) {
      setLocalNiveaux(prev => prev ? prev.map(n =>
        n.id === editNiveau.id
          ? { ...n, nom: form.nom.trim(), niveau: form.nom.trim(), ordre: parseInt(form.ordre) || 0, description: form.description, matiere_ids: form.matiere_ids }
          : n,
      ) : prev);
      closeEdit();
    } else {
      setFormError(result.error || t('niveaux.erreurModification'));
    }
  };

  const handleDelete = async (n: any) => {
    const nomAffiche = n.nom ?? n.niveau ?? '';
    const ok = await confirm({
      title: t('niveaux.supprimerTitre'),
      message: t('niveaux.supprimerMsg', { nom: nomAffiche }),
      confirmText: t('niveaux.supprimerBtn'),
      variant: 'danger',
    });
    if (!ok) return;
    if (!n.id) {
      setLocalNiveaux(prev => prev ? prev.filter(x => (x.nom ?? x.niveau) !== nomAffiche) : prev);
      return;
    }
    const success = await deleteNiveau(n.id);
    if (success) setLocalNiveaux(prev => prev ? prev.filter(x => x.id !== n.id) : prev);
  };

  if (loading) return <PageLoader />;
  if (error) return <Alert variant="error">{t('niveaux.erreurChargementMsg')}</Alert>;

  return (
    <div>
      <PageHeader
        title={t('niveaux.titre')}
        subtitle={t('niveaux.nbNiveaux', { count: niveaux.length })}
      >
        {!readOnly && <Link to="/niveaux/nouveau"><Button variant="primary" size="sm">{t('niveaux.nouveauNiveau')}</Button></Link>}
      </PageHeader>

      {niveaux.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon path={Icons.building} size={28} />}
            message={t('niveaux.aucunNiveau')}
            action={!readOnly ? <Link to="/niveaux/nouveau"><Button variant="primary">{t('niveaux.creerPremierNiveau')}</Button></Link> : undefined}
          />
        </Card>
      ) : (
        <div className="niveaux-grid">
          {niveaux.map((n: any) => (
            <NiveauCard
              key={n.id ?? n.niveau}
              niveau={n}
              allMatieres={allMatieres}
              readOnly={readOnly}
              onEdit={() => openEdit(n)}
              onDelete={() => handleDelete(n)}
            />
          ))}
          {!readOnly && (
            <Link to="/niveaux/nouveau" style={{ textDecoration: 'none' }}>
              <div className="add-card">
                <div className="add-card-icon">+</div>
                <span className="add-card-text">{t('niveaux.nouveauNiveau')}</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {editNiveau && (
        <EditNiveauModal
          niveau={editNiveau}
          form={form}
          setForm={setForm}
          allMatieres={allMatieres}
          maxOrdre={editNiveau.id ? niveaux.length - 1 : niveaux.length}
          submitting={submitting}
          error={formError}
          onToggleMatiere={toggleMatiere}
          onSave={handleSave}
          onClose={closeEdit}
        />
      )}
    </div>
  );
}

function NiveauCard({
  niveau, allMatieres, readOnly, onEdit, onDelete,
}: {
  niveau: any;
  allMatieres: { id: string; nom: string; code: string }[];
  readOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const matiereNames = (niveau.matiere_ids || [])
    .map((id: string) => allMatieres.find(m => m.id === id)?.nom)
    .filter(Boolean);

  return (
    <Card>
      <div className="niveau-card-inner">
        <div className="niveau-card-top">
          <div className="niveau-card-title-row">
            <span className="niveau-card-name">{niveau.nom ?? niveau.niveau}</span>
            {niveau.count !== undefined && (
              <Badge label={t('niveaux.nbClasses', { count: niveau.count })} variant="default" />
            )}
          </div>
          {niveau.ordre !== undefined && (
            <span className="niveau-card-ordre">{t('niveaux.ordre', { n: niveau.ordre })}</span>
          )}
        </div>

        {niveau.description && (
          <p className="niveau-card-desc">{niveau.description}</p>
        )}

        {(niveau.matiere_ids?.length > 0) ? (
          <div className="niveau-card-matieres">
            {matiereNames.map((nom: string) => (
              <Badge key={nom} label={nom} variant="info" />
            ))}
          </div>
        ) : (
          <p className="niveau-card-all-matieres">
            {t('niveaux.toutesMatieresAutorisees')}
          </p>
        )}

        {!readOnly && (
          <div className="niveau-card-actions">
            <Button variant="secondary" size="sm" onClick={onEdit} style={{ flex: 1 }}>{t('niveaux.modifier')}</Button>
            {(niveau.count ?? 0) === 0
              ? <Button variant="danger" size="sm" onClick={onDelete}>{t('niveaux.supprimer')}</Button>
              : <span className="niveau-card-non-supprimable">{t('niveaux.nonSupprimable')}</span>
            }
          </div>
        )}
      </div>
    </Card>
  );
}

function EditNiveauModal({
  niveau, form, setForm, allMatieres, maxOrdre, submitting, error,
  onToggleMatiere, onSave, onClose,
}: {
  niveau: Niveau;
  form: EditForm;
  setForm: React.Dispatch<React.SetStateAction<EditForm>>;
  allMatieres: { id: string; nom: string; code: string }[];
  maxOrdre: number;
  submitting: boolean;
  error: string;
  onToggleMatiere: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t('niveaux.modifierTitre', { nom: niveau.nom })}
      onClose={onClose}
      maxWidth={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>{t('niveaux.annuler')}</Button>
          <Button variant="primary" onClick={onSave} disabled={submitting || !form.nom.trim()}>
            {submitting ? t('niveaux.enregistrement') : t('niveaux.enregistrer')}
          </Button>
        </>
      }
    >
      <div className="niveau-edit-form">
        <div className="niveau-edit-grid">
          <Input
            label={t('niveaux.form.nom')}
            value={form.nom}
            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            placeholder={t('niveaux.form.nomPlaceholder')}
          />
          <Input
            label={t('niveaux.form.ordre', { max: maxOrdre })}
            type="number"
            value={form.ordre}
            onChange={e => setForm(f => ({ ...f, ordre: e.target.value }))}
            min={0}
            max={maxOrdre}
            style={{ width: 90 }}
          />
        </div>

        <Input
          label={t('niveaux.form.description')}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder={t('niveaux.form.descriptionPlaceholder')}
        />

        <div>
          <label className="form-label niveau-edit-matieres-header">
            {t('niveaux.form.matieres')}
            {' '}<span className="niveau-edit-matieres-label">({t('niveaux.creer.form.matieresInfo')})</span>
          </label>
          <div className="niveau-edit-matieres-scroll">
            {allMatieres.length === 0 ? (
              <span className="niveau-edit-matieres-empty">{t('niveaux.form.aucuneMatiere')}</span>
            ) : (
              <MatierePills
                matieres={allMatieres}
                selectedIds={form.matiere_ids}
                onToggle={onToggleMatiere}
              />
            )}
          </div>
          {form.matiere_ids.length > 0 && (
            <p className="niveau-edit-matieres-count">
              {t('niveaux.nbMatieres', { count: form.matiere_ids.length })}
            </p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
