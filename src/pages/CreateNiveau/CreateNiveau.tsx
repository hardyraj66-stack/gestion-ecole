import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useNiveaux as useNiveauxCtx } from '../../contexts/NiveauContext';
import { useViewing } from '../../contexts/ViewingContext';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormActions } from '../../components/shared/FormGrid';

export function CreateNiveau() {
  const { isViewingArchive } = useViewing();
  const navigate = useNavigate();
  const { create } = useNiveauxCtx();

  const [nom, setNom] = useState('');
  const [ordre, setOrdre] = useState('0');
  const [description, setDescription] = useState('');
  const [matiereIds, setMatiereIds] = useState<string[]>([]);
  const [allMatieres, setAllMatieres] = useState<{ id: string; nom: string; code: string }[]>([]);
  const [niveauxCount, setNiveauxCount] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    readApi.matieresList(1, 200).then((res: any) => {
      if (res?.items) setAllMatieres(res.items.map((m: any) => ({ id: m.id, nom: m.nom, code: m.code })));
    });
    readApi.niveaux().then((res: any) => {
      if (res && Array.isArray(res)) setNiveauxCount(res.length);
    });
  }, []);

  if (isViewingArchive) return <Navigate to="/niveaux" replace />;

  const toggleMatiere = (id: string) => {
    setMatiereIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError('Le nom est requis'); return; }
    const ordreVal = parseInt(ordre) || 0;
    if (ordreVal < 0 || ordreVal > niveauxCount) {
      setError(`L'ordre doit être entre 0 et ${niveauxCount}`);
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await create({
      nom: nom.trim(),
      ordre: ordreVal,
      description,
      matiere_ids: matiereIds,
    });
    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => navigate('/niveaux'), 1200);
    } else {
      setError(result.error || 'Erreur lors de la création');
    }
  };

  return (
    <div>
      <PageHeader title="Nouveau niveau" subtitle="Définir un cycle scolaire et ses matières autorisées" />

      <Card style={{ maxWidth: 600 }}>
        {success && <Alert variant="success" style={{ marginBottom: '1rem' }}>Niveau créé avec succès ! Redirection…</Alert>}

        <form onSubmit={handleSubmit}>
          <FormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Nom du niveau *"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: 6ème, CE1, Terminale…"
                required
              />
            </div>

            <Input
              label="Ordre d'affichage"
              type="number"
              value={ordre}
              onChange={e => setOrdre(e.target.value)}
              placeholder="0"
              min={0}
              max={niveauxCount}
              hint={`Entre 0 et ${niveauxCount}`}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Description (optionnel)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Collège, Lycée, Primaire…"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Matières autorisées
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  (vide = toutes autorisées)
                </span>
              </label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
                marginTop: '0.4rem', maxHeight: 220, overflowY: 'auto',
                padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8,
              }}>
                {allMatieres.map(m => {
                  const checked = matiereIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMatiere(m.id)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: 6,
                        border: '1.5px solid',
                        borderColor: checked ? 'var(--primary)' : 'var(--border)',
                        background: checked ? 'rgba(37,99,235,0.08)' : 'transparent',
                        color: checked ? 'var(--primary)' : 'var(--text)',
                        fontSize: '0.82rem',
                        fontWeight: checked ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      {m.nom}
                    </button>
                  );
                })}
                {allMatieres.length === 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Chargement des matières…</span>
                )}
              </div>
              {matiereIds.length > 0 && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {matiereIds.length} matière{matiereIds.length > 1 ? 's' : ''} sélectionnée{matiereIds.length > 1 ? 's' : ''}
                  {' — '}seules ces matières seront autorisées en planning pour ce niveau
                </p>
              )}
            </div>
          </FormGrid>

          {error && <Alert variant="error" style={{ marginTop: '1rem' }}>{error}</Alert>}

          <FormActions>
            <Button type="button" variant="ghost" onClick={() => navigate('/niveaux')} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !nom.trim()}>
              {submitting ? 'Création…' : 'Créer le niveau'}
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
