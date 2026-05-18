import { useState, useEffect, useCallback } from 'react';
import { Absence } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { formatDate } from '../../utils/helpers';

interface AddFormProps {
  type: 'absence' | 'retard';
  eleveId: string;
  onAdded: () => void;
  onCancel: () => void;
}

function AddForm({ type, eleveId, onAdded, onCancel }: AddFormProps) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), motif: '', duree: '', justifiee: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const endpoint = type === 'absence' ? 'absences' : 'retards';
    const res = await fetch(`${API_BASE_URL}/suivi/${eleveId}/${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { onAdded(); }
    setSubmitting(false);
  };

  return (
    <div className="suivi-form">
      <div className="suivi-form-grid">
        <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        {type === 'retard' && (
          <Input label="Durée (ex: 15 min)" value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} placeholder="15 min" />
        )}
        <Input label="Motif" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} placeholder="Motif éventuel" />
        <div className="suivi-form-check">
          <label className="suivi-check-label">
            <input type="checkbox" checked={form.justifiee} onChange={e => setForm(f => ({ ...f, justifiee: e.target.checked }))} />
            Justifiée
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Button size="sm" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button size="sm" variant="primary" onClick={handleSubmit} loading={submitting}>Enregistrer</Button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  type: 'absence' | 'retard';
  items: Absence[];
  eleveId: string;
  readOnly: boolean;
  onRefresh: () => void;
}

function AssiduiteSection({ title, type, items, eleveId, readOnly, onRefresh }: SectionProps) {
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: string) => {
    await fetch(`${API_BASE_URL}/suivi/absences/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const icon = type === 'absence'
    ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
    : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';

  return (
    <div className="assiduite-section">
      <div className="assiduite-section-header">
        <div className="assiduite-section-title">
          <Icon path={icon} size={16} />
          <span>{title} <strong>({items.length})</strong></span>
        </div>
        {!readOnly && (
          <button className="suivi-add-btn" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        )}
      </div>

      {showForm && (
        <AddForm type={type} eleveId={eleveId} onAdded={() => { onRefresh(); setShowForm(false); }} onCancel={() => setShowForm(false)} />
      )}

      {items.length === 0 ? (
        <p className="suivi-empty">Aucun(e) {type === 'absence' ? 'absence' : 'retard'} enregistré(e)</p>
      ) : (
        <ul className="suivi-list">
          {items.map(a => (
            <li key={a.id} className="suivi-item">
              <div className="suivi-item-left">
                <div className={`suivi-item-icon ${type === 'absence' ? 'suivi-item-icon-danger' : 'suivi-item-icon-info'}`}>
                  <Icon path={icon} size={15} />
                </div>
                <div>
                  <div className="suivi-item-title">
                    {formatDate(a.date)}
                    {a.duree && <span className="suivi-item-duree"> · {a.duree}</span>}
                    <Badge label={a.justifiee ? 'Justifiée' : 'Non justifiée'} variant={a.justifiee ? 'success' : 'danger'} />
                  </div>
                  {a.motif && <div className="suivi-item-meta">{a.motif}</div>}
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
    </div>
  );
}

interface Props {
  eleveId: string;
  readOnly: boolean;
}

export function FicheAssiduité({ eleveId, readOnly }: Props) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [retards, setRetards] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ra, rr] = await Promise.all([
      fetch(`${API_BASE_URL}/suivi/${eleveId}/absences`),
      fetch(`${API_BASE_URL}/suivi/${eleveId}/retards`),
    ]);
    if (ra.ok) setAbsences(await ra.json());
    if (rr.ok) setRetards(await rr.json());
    setLoading(false);
  }, [eleveId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader title="Assiduité" />
      {loading ? (
        <p className="suivi-empty">Chargement…</p>
      ) : (
        <div className="assiduite-container">
          <AssiduiteSection title="Absences" type="absence" items={absences} eleveId={eleveId} readOnly={readOnly} onRefresh={load} />
          <AssiduiteSection title="Retards" type="retard" items={retards} eleveId={eleveId} readOnly={readOnly} onRefresh={load} />
        </div>
      )}
    </Card>
  );
}
