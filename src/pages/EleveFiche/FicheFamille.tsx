import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eleve, ParentInfo } from '../../types';
import { Card, CardHeader } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { useEleves } from '../../contexts/EleveContext';

interface ParentFormProps {
  label: string;
  data: ParentInfo | null;
  onSave: (p: ParentInfo | null) => void;
  readOnly: boolean;
}

function ParentForm({ label, data, onSave, readOnly }: ParentFormProps) {
  const { t } = useTranslation();
  const STATUT_OPTIONS: SelectOption[] = [
    { value: 'vivant', label: t('fiche.famille.statuts.vivant') },
    { value: 'decede', label: t('fiche.famille.statuts.decede') },
  ];

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ParentInfo>(
    data ?? { nom: '', prenom: '', telephone: '', email: '', statut: 'vivant' }
  );

  const handleSave = () => { onSave(form); setEditing(false); };
  const handleRemove = () => { onSave(null); setEditing(false); };

  if (!editing) {
    return (
      <div className="famille-block">
        <div className="famille-block-header">
          <span className="famille-block-title">{label}</span>
          {!readOnly && <button className="famille-edit-btn" onClick={() => setEditing(true)}>
            <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} />
          </button>}
        </div>
        {data ? (
          <div className="famille-info">
            <span className="famille-nom">{data.prenom} {data.nom}</span>
            <Badge
              label={data.statut === 'decede' ? t('fiche.famille.statuts.decede') : t('fiche.famille.statuts.vivant')}
              variant={data.statut === 'decede' ? 'danger' : 'success'}
            />
            {data.telephone && <span className="famille-contact">{data.telephone}</span>}
            {data.email && <span className="famille-contact">{data.email}</span>}
          </div>
        ) : (
          <span className="famille-empty">{t('fiche.famille.nonRenseigne')}</span>
        )}
      </div>
    );
  }

  return (
    <div className="famille-block famille-block-editing">
      <div className="famille-block-header">
        <span className="famille-block-title">{label}</span>
      </div>
      <div className="famille-form-grid">
        <Input label={t('eleves.creer.form.prenom')} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
        <Input label={t('eleves.creer.form.nom')} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
        <Input label={t('eleves.creer.form.telephone')} value={form.telephone || ''} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
        <Input label={t('eleves.creer.form.email')} value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <Select label={t('fiche.famille.statuts.vivant').replace('(e)', '')} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as any }))} options={STATUT_OPTIONS} />
      </div>
      <div className="famille-form-actions">
        <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>{t('common.annuler')}</Button>
        {data && <Button size="sm" variant="danger" onClick={handleRemove}>{t('common.supprimer')}</Button>}
        <Button size="sm" variant="primary" onClick={handleSave}>{t('common.enregistrer')}</Button>
      </div>
    </div>
  );
}

interface Props {
  eleve: Eleve;
  eleveId: string;
  readOnly: boolean;
}

export function FicheFamille({ eleve, eleveId, readOnly }: Props) {
  const { t } = useTranslation();
  const { update } = useEleves();
  const [localEleve, setLocalEleve] = useState(eleve);

  const handleSavePere = async (pere: ParentInfo | null) => {
    const updated = { ...localEleve, pere };
    setLocalEleve(updated as any);
    await update(eleveId, { pere } as any);
  };

  const handleSaveMere = async (mere: ParentInfo | null) => {
    const updated = { ...localEleve, mere };
    setLocalEleve(updated as any);
    await update(eleveId, { mere } as any);
  };

  return (
    <Card>
      <CardHeader title={t('fiche.famille.titre')} />
      <div className="famille-container">
        <ParentForm label={t('fiche.famille.pere')} data={(localEleve as any).pere ?? null} onSave={handleSavePere} readOnly={readOnly} />
        <ParentForm label={t('fiche.famille.mere')} data={(localEleve as any).mere ?? null} onSave={handleSaveMere} readOnly={readOnly} />

        <div className="famille-block">
          <div className="famille-block-header">
            <span className="famille-block-title">{t('fiche.famille.tuteur')}</span>
          </div>
          {(localEleve as any).tuteur ? (
            <div className="famille-info">
              <span className="famille-nom">{(localEleve as any).tuteur.prenom} {(localEleve as any).tuteur.nom}</span>
              {(localEleve as any).tuteur.lien && <Badge label={(localEleve as any).tuteur.lien} variant="default" />}
              {(localEleve as any).tuteur.telephone && <span className="famille-contact">{(localEleve as any).tuteur.telephone}</span>}
            </div>
          ) : (
            <span className="famille-empty">{t('fiche.famille.aucunTuteur')}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
