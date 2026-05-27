import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <Input label={t('fiche.assiduite.date')} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        {type === 'retard' && (
          <Input label={t('fiche.assiduite.duree')} value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} placeholder={t('fiche.assiduite.dureePlaceholder')} />
        )}
        <Input label={t('fiche.assiduite.motif')} value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} placeholder={t('fiche.assiduite.motifPlaceholder')} />
        <div className="suivi-form-check">
          <label className="suivi-check-label">
            <input type="checkbox" checked={form.justifiee} onChange={e => setForm(f => ({ ...f, justifiee: e.target.checked }))} />
            {t('fiche.assiduite.justifiee')}
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Button size="sm" variant="secondary" onClick={onCancel}>{t('common.annuler')}</Button>
        <Button size="sm" variant="primary" onClick={handleSubmit} loading={submitting}>{t('common.enregistrer')}</Button>
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
  const { t } = useTranslation();
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
            {showForm ? t('common.annuler') : t('fiche.assiduite.ajouter')}
          </button>
        )}
      </div>

      {showForm && (
        <AddForm type={type} eleveId={eleveId} onAdded={() => { onRefresh(); setShowForm(false); }} onCancel={() => setShowForm(false)} />
      )}

      {items.length === 0 ? (
        <p className="suivi-empty">{type === 'absence' ? t('fiche.assiduite.aucuneAbsence') : t('fiche.assiduite.aucunRetard')}</p>
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
                    <Badge label={a.justifiee ? t('fiche.assiduite.justifiee') : t('fiche.assiduite.nonJustifiee')} variant={a.justifiee ? 'success' : 'danger'} />
                  </div>
                  {a.motif && <div className="suivi-item-meta">{a.motif}</div>}
                </div>
              </div>
              {!readOnly && (
                <button className="suivi-delete-btn" onClick={() => handleDelete(a.id)} title={t('common.supprimer')}>
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
  anneeId?: string;
  readOnly: boolean;
}

export function FicheAssiduité({ eleveId, anneeId, readOnly }: Props) {
  const { t } = useTranslation();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [retards, setRetards] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const qs = anneeId ? `?anneeId=${encodeURIComponent(anneeId)}` : '';
    const [ra, rr] = await Promise.all([
      fetch(`${API_BASE_URL}/suivi/${eleveId}/absences${qs}`),
      fetch(`${API_BASE_URL}/suivi/${eleveId}/retards${qs}`),
    ]);
    if (ra.ok) setAbsences(await ra.json());
    if (rr.ok) setRetards(await rr.json());
    setLoading(false);
  }, [eleveId, anneeId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader title={t('fiche.assiduite.titre')} />
      {loading ? (
        <p className="suivi-empty">{t('common.chargement')}</p>
      ) : (
        <div className="assiduite-container">
          <AssiduiteSection title={t('fiche.assiduite.absences')} type="absence" items={absences} eleveId={eleveId} readOnly={readOnly} onRefresh={load} />
          <AssiduiteSection title={t('fiche.assiduite.retards')} type="retard" items={retards} eleveId={eleveId} readOnly={readOnly} onRefresh={load} />
        </div>
      )}
    </Card>
  );
}
