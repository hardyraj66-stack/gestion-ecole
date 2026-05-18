import { useState, useEffect, useCallback } from 'react';
import { Avertissement } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Textarea } from '../../components/shared/Textarea';
import { formatDate } from '../../utils/helpers';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'comportement', label: 'Comportement' },
  { value: 'degats', label: 'Dégâts matériels' },
  { value: 'absence', label: 'Absence injustifiée' },
  { value: 'autre', label: 'Autre' },
];

const TYPE_VARIANT: Record<string, any> = {
  comportement: 'warning',
  degats: 'danger',
  absence: 'info',
  autre: 'default',
};

interface Props {
  eleveId: string;
  anneeActive: string | null;
  readOnly: boolean;
}

export function FicheAvertissements({ eleveId, anneeActive, readOnly }: Props) {
  const [items, setItems] = useState<Avertissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ motif: '', type: 'comportement', commentaire: '', date: new Date().toISOString().slice(0, 10), annee_scolaire: anneeActive || '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/suivi/${eleveId}/avertissements`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [eleveId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.motif.trim()) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/suivi/${eleveId}/avertissements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, annee_scolaire: form.annee_scolaire || anneeActive }),
    });
    if (res.ok) { await load(); setShowForm(false); setForm(f => ({ ...f, motif: '', commentaire: '' })); }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_BASE_URL}/suivi/avertissements/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(a => a.id !== id));
  };

  return (
    <Card>
      <CardHeader title={`Avertissements (${items.length})`}
        action={!readOnly && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </Button>
        )}
      />

      {showForm && (
        <div className="suivi-form">
          <div className="suivi-form-grid">
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TYPE_OPTIONS} />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Année scolaire" value={form.annee_scolaire} onChange={e => setForm(f => ({ ...f, annee_scolaire: e.target.value }))} placeholder={anneeActive || '2025-2026'} />
          </div>
          <Input label="Motif *" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} placeholder="Décrire le motif de l'avertissement" fullWidth />
          <Textarea label="Commentaire" value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Détails supplémentaires…" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button size="sm" variant="primary" onClick={handleAdd} disabled={submitting || !form.motif.trim()} loading={submitting}>Enregistrer</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="suivi-empty">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="suivi-empty">Aucun avertissement enregistré</p>
      ) : (
        <ul className="suivi-list">
          {items.map(a => (
            <li key={a.id} className="suivi-item">
              <div className="suivi-item-left">
                <div className="suivi-item-icon suivi-item-icon-warning">
                  <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} />
                </div>
                <div>
                  <div className="suivi-item-title">
                    {a.motif}
                    <Badge label={TYPE_OPTIONS.find(t => t.value === a.type)?.label || a.type} variant={TYPE_VARIANT[a.type]} />
                  </div>
                  <div className="suivi-item-meta">
                    {formatDate(a.date)} · {a.annee_scolaire}
                    {a.commentaire && ` · ${a.commentaire}`}
                  </div>
                </div>
              </div>
              {!readOnly && (
                <button className="suivi-delete-btn" onClick={() => handleDelete(a.id)} title="Supprimer">
                  <Icon path="M6 18L18 6M6 6l12 12" size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
