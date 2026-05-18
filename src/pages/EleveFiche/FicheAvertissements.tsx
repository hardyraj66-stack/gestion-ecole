import { useState, useEffect, useCallback } from 'react';
import { Avertissement, Convocation } from '../../types';
import { API_BASE_URL } from '../../config/api';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Textarea } from '../../components/shared/Textarea';
import { formatDate } from '../../utils/helpers';

const SEUIL_ESCALADE = 3;

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
  onCountChange?: (count: number) => void;
}

export function FicheAvertissements({ eleveId, anneeActive, readOnly, onCountChange }: Props) {
  const [items, setItems] = useState<Avertissement[]>([]);
  const [convocations, setConvocations] = useState<Convocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showConvForm, setShowConvForm] = useState(false);
  const [form, setForm] = useState({ motif: '', type: 'comportement', commentaire: '', date: new Date().toISOString().slice(0, 10), annee_scolaire: anneeActive || '' });
  const [convForm, setConvForm] = useState({ raison: '', commentaire: '', date: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [ra, rc] = await Promise.all([
      fetch(`${API_BASE_URL}/suivi/${eleveId}/avertissements`),
      fetch(`${API_BASE_URL}/suivi/${eleveId}/convocations`),
    ]);
    if (ra.ok) {
      const avertList = await ra.json();
      setItems(avertList);
      onCountChange?.(avertList.length);
    }
    if (rc.ok) setConvocations(await rc.json());
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
    if (res.ok) {
      const data = await res.json();
      const newList = [data.avertissement, ...items];
      setItems(newList);
      onCountChange?.(newList.length);
      setShowForm(false);
      setForm(f => ({ ...f, motif: '', commentaire: '' }));
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_BASE_URL}/suivi/avertissements/${id}`, { method: 'DELETE' });
    setItems(prev => {
      const newList = prev.filter(a => a.id !== id);
      onCountChange?.(newList.length);
      return newList;
    });
  };

  const handleAddConvocation = async () => {
    if (!convForm.raison.trim()) return;
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/suivi/${eleveId}/convocations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convForm),
    });
    if (res.ok) {
      const conv = await res.json();
      setConvocations(prev => [conv, ...prev]);
      setShowConvForm(false);
      setConvForm(f => ({ ...f, raison: '', commentaire: '' }));
    }
    setSubmitting(false);
  };

  const handleToggleConvocation = async (conv: Convocation) => {
    const res = await fetch(`${API_BASE_URL}/suivi/convocations/${conv.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effectuee: !conv.effectuee }),
    });
    if (res.ok) {
      const updated = await res.json();
      setConvocations(prev => prev.map(c => c.id === conv.id ? updated : c));
    }
  };

  const handleDeleteConvocation = async (id: string) => {
    await fetch(`${API_BASE_URL}/suivi/convocations/${id}`, { method: 'DELETE' });
    setConvocations(prev => prev.filter(c => c.id !== id));
  };

  const escalade = items.length >= SEUIL_ESCALADE;

  if (loading) return <Card><CardHeader title="Avertissements" /><p className="suivi-empty">Chargement…</p></Card>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Carte avertissements */}
      <Card>
        <CardHeader
          title={`Avertissements (${items.length})`}
          action={!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(s => !s)}>
              {showForm ? 'Annuler' : '+ Ajouter'}
            </Button>
          )}
        />

        {/* Bannière d'escalade */}
        {escalade && (
          <div className="escalade-banner">
            <div className="escalade-banner-left">
              <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={20} />
              <div>
                <div className="escalade-banner-title">{items.length} avertissements — Action requise</div>
                <div className="escalade-banner-sub">Le seuil d'escalade est atteint. Envisagez une convocation des parents ou une mesure disciplinaire.</div>
              </div>
            </div>
            {!readOnly && (
              <Button size="sm" variant="danger" onClick={() => { setShowConvForm(true); }}>
                Convoquer les parents
              </Button>
            )}
          </div>
        )}

        {showForm && (
          <div className="suivi-form">
            <div className="suivi-form-grid">
              <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TYPE_OPTIONS} />
              <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <Input label="Année scolaire" value={form.annee_scolaire} onChange={e => setForm(f => ({ ...f, annee_scolaire: e.target.value }))} placeholder={anneeActive || '2025-2026'} />
            </div>
            <Input label="Motif *" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} placeholder="Décrire le motif" fullWidth />
            <Textarea label="Commentaire" value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Détails supplémentaires…" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button size="sm" variant="primary" onClick={handleAdd} disabled={submitting || !form.motif.trim()} loading={submitting}>Enregistrer</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
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

      {/* Carte convocations parents */}
      <Card>
        <CardHeader
          title={`Convocations parents (${convocations.length})`}
          action={!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setShowConvForm(s => !s)}>
              {showConvForm ? 'Annuler' : '+ Ajouter'}
            </Button>
          )}
        />

        {showConvForm && (
          <div className="suivi-form">
            <div className="suivi-form-grid">
              <Input label="Date *" type="date" value={convForm.date} onChange={e => setConvForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <Input label="Raison *" value={convForm.raison} onChange={e => setConvForm(f => ({ ...f, raison: e.target.value }))} placeholder="Raison de la convocation" fullWidth />
            <Textarea label="Commentaire" value={convForm.commentaire} onChange={e => setConvForm(f => ({ ...f, commentaire: e.target.value }))} placeholder="Détails…" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button size="sm" variant="primary" onClick={handleAddConvocation} disabled={submitting || !convForm.raison.trim()} loading={submitting}>Enregistrer</Button>
            </div>
          </div>
        )}

        {convocations.length === 0 ? (
          <p className="suivi-empty">Aucune convocation enregistrée</p>
        ) : (
          <ul className="suivi-list">
            {convocations.map(c => (
              <li key={c.id} className="suivi-item">
                <div className="suivi-item-left">
                  <div className={`suivi-item-icon ${c.effectuee ? 'suivi-item-icon-success' : 'suivi-item-icon-warning'}`}>
                    <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={15} />
                  </div>
                  <div>
                    <div className="suivi-item-title">
                      {c.raison}
                      <Badge label={c.effectuee ? 'Effectuée' : 'En attente'} variant={c.effectuee ? 'success' : 'warning'} />
                      {c.nb_avertissements > 0 && <Badge label={`${c.nb_avertissements} avert.`} variant="danger" />}
                    </div>
                    <div className="suivi-item-meta">
                      {formatDate(c.date)}{c.commentaire && ` · ${c.commentaire}`}
                    </div>
                  </div>
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button className="suivi-toggle-btn" onClick={() => handleToggleConvocation(c)} title={c.effectuee ? 'Marquer non effectuée' : 'Marquer effectuée'}>
                      <Icon path={c.effectuee ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'} size={14} />
                    </button>
                    <button className="suivi-delete-btn" onClick={() => handleDeleteConvocation(c.id)} title="Supprimer">
                      <Icon path="M6 18L18 6M6 6l12 12" size={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
