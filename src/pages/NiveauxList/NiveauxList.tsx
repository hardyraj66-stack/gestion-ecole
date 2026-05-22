import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useViewing } from '../../contexts/ViewingContext';
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
  const { isViewingArchive: readOnly } = useViewing();
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
    if (!form.nom.trim()) { setFormError('Le nom est requis'); return; }
    const ordreVal = parseInt(form.ordre) || 0;
    const maxOrdre = editNiveau.id ? niveaux.length - 1 : niveaux.length;
    if (ordreVal < 0 || ordreVal > maxOrdre) {
      setFormError(`L'ordre doit être entre 0 et ${maxOrdre}`);
      return;
    }
    setSubmitting(true);
    setFormError('');

    // Niveau orphelin (pas encore en base) → créer d'abord
    if (!editNiveau.id) {
      const result = await create({
        nom: form.nom.trim(),
        ordre: parseInt(form.ordre) || 0,
        description: form.description,
        matiere_ids: form.matiere_ids,
      });
      setSubmitting(false);
      if (result.ok) {
        setLocalNiveaux(null); // force re-fetch via data
        closeEdit();
      } else {
        setFormError(result.error || 'Erreur lors de la création');
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
      setFormError(result.error || 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (n: any) => {
    const nomAffiche = n.nom ?? n.niveau ?? '';
    const ok = await confirm({ title: 'Supprimer le niveau ?', message: `Le niveau « ${nomAffiche} » sera supprimé. Les classes existantes gardent leur valeur de niveau, mais celui-ci ne sera plus configurable.`, confirmText: 'Supprimer', variant: 'danger' });
    if (!ok) return;
    // Niveau orphelin → rien à supprimer en base, juste retirer de la liste locale
    if (!n.id) {
      setLocalNiveaux(prev => prev ? prev.filter(x => (x.nom ?? x.niveau) !== nomAffiche) : prev);
      return;
    }
    const success = await deleteNiveau(n.id);
    if (success) setLocalNiveaux(prev => prev ? prev.filter(x => x.id !== n.id) : prev);
  };

  if (loading) return <PageLoader />;
  if (error) return <Alert variant="error">Problème de chargement des niveaux.</Alert>;

  const niveaux: any[] = localNiveaux ?? (Array.isArray(data) ? data : []);

  return (
    <div>
      <PageHeader
        title="Niveaux"
        subtitle={`${niveaux.length} niveau${niveaux.length !== 1 ? 'x' : ''} configuré${niveaux.length !== 1 ? 's' : ''}`}
        action={!readOnly ? <Link to="/niveaux/nouveau"><Button variant="primary" size="sm">+ Nouveau niveau</Button></Link> : undefined}
      />

      {niveaux.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon path={Icons.building} size={28} />}
            message="Aucun niveau configuré"
            action={!readOnly ? <Link to="/niveaux/nouveau"><Button variant="primary">Créer le premier niveau</Button></Link> : undefined}
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
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
                <span className="add-card-text">Nouveau niveau</span>
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
  const matiereNames = (niveau.matiere_ids || [])
    .map((id: string) => allMatieres.find(m => m.id === id)?.nom)
    .filter(Boolean);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{niveau.nom ?? niveau.niveau}</span>
          {niveau.count !== undefined && (
            <Badge label={`${niveau.count} classe${niveau.count !== 1 ? 's' : ''}`} variant="default" />
          )}
        </div>
        {niveau.ordre !== undefined && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ordre {niveau.ordre}</span>
        )}
      </div>

      {niveau.description && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{niveau.description}</p>
      )}

      {(niveau.matiere_ids?.length > 0) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {matiereNames.map((nom: string) => (
            <Badge key={nom} label={nom} variant="info" />
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Toutes les matières autorisées
        </p>
      )}

      {!readOnly && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <Button variant="ghost" size="sm" onClick={onEdit} style={{ flex: 1 }}>Modifier</Button>
          {(niveau.count ?? 0) === 0
            ? <Button variant="ghost" size="sm" onClick={onDelete} style={{ color: 'var(--danger)' }}>Supprimer</Button>
            : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', paddingRight: '0.25rem' }}>Non supprimable</span>
          }
        </div>
      )}
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
  return (
    <Modal
      title={`Modifier le niveau — ${niveau.nom}`}
      onClose={onClose}
      maxWidth={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Annuler</Button>
          <Button variant="primary" onClick={onSave} disabled={submitting || !form.nom.trim()}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
          <Input
            label="Nom du niveau *"
            value={form.nom}
            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            placeholder="Ex: 6ème, CE1..."
          />
          <Input
            label={`Ordre (0–${maxOrdre})`}
            type="number"
            value={form.ordre}
            onChange={e => setForm(f => ({ ...f, ordre: e.target.value }))}
            min={0}
            max={maxOrdre}
            style={{ width: 90 }}
          />
        </div>

        <Input
          label="Description (optionnel)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description courte du niveau"
        />

        <div>
          <label className="form-label">Matières autorisées <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(vide = toutes autorisées)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem', maxHeight: 200, overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8 }}>
            {allMatieres.map(m => {
              const checked = form.matiere_ids.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onToggleMatiere(m.id)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 6,
                    border: '1.5px solid',
                    borderColor: checked ? 'var(--primary)' : 'var(--border)',
                    background: checked ? 'rgba(37,99,235,0.08)' : 'transparent',
                    color: checked ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: checked ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {m.nom}
                </button>
              );
            })}
            {allMatieres.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Aucune matière disponible</span>}
          </div>
          {form.matiere_ids.length > 0 && (
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {form.matiere_ids.length} matière{form.matiere_ids.length > 1 ? 's' : ''} sélectionnée{form.matiere_ids.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
