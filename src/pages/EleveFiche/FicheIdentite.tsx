import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eleve, Creneau } from '../../types';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/shared/Avatar';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { getInitials, getAge, formatDate } from '../../utils/helpers';
import { useEleves } from '../../contexts/EleveContext';
import { readApi } from '../../services/readApi';

interface Props {
  eleve: Eleve & { classe_nom?: string; classe_niveau?: string };
  classe: any;
  salleActuelle: string | null;
  creneaux: Creneau[];
  readOnly?: boolean;
  eleveId: string;
}

function getSalleVariable(creneaux: Creneau[]): string | null {
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const today = jours[new Date().getDay()];
  const now = new Date().toTimeString().slice(0, 5);
  const enCours = creneaux.find(c => c.jour === today && c.heure_debut <= now && c.heure_fin > now);
  if (enCours) return enCours.salle;
  const prochains = creneaux.filter(c => c.jour === today && c.heure_debut > now);
  if (prochains.length > 0) return prochains.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))[0].salle;
  return null;
}

export function FicheIdentite({ eleve, classe, salleActuelle, creneaux, readOnly, eleveId }: Props) {
  const { t } = useTranslation();
  const { update } = useEleves();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [local, setLocal] = useState(eleve);

  const GENRE_OPTIONS: SelectOption[] = [
    { value: 'M', label: t('eleves.genres.masculin') },
    { value: 'F', label: t('eleves.genres.feminin') },
  ];

  const [form, setForm] = useState({
    nom: eleve.nom,
    prenom: eleve.prenom,
    date_naissance: eleve.date_naissance,
    genre: eleve.genre,
    email: eleve.email || '',
    telephone: eleve.telephone || '',
    adresse: eleve.adresse || '',
    classe_id: eleve.classe_id,
  });

  useEffect(() => {
    if (editing && classes.length === 0) {
      readApi.classesList(1, 100).then((res: any) => {
        if (res) setClasses(res.items || []);
      });
    }
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await update(eleveId, form as any);
    if (ok) {
      setLocal(l => ({ ...l, ...form }));
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({
      nom: local.nom,
      prenom: local.prenom,
      date_naissance: local.date_naissance,
      genre: local.genre,
      email: local.email || '',
      telephone: local.telephone || '',
      adresse: local.adresse || '',
      classe_id: local.classe_id,
    });
    setEditing(false);
  };

  const salle = salleActuelle ?? (classe?.salle_type === 'variable' ? getSalleVariable(creneaux) : null);
  const age = local.date_naissance ? getAge(local.date_naissance) : null;
  const classeOptions: SelectOption[] = classes.map((c: any) => ({ value: c.id, label: `${c.nom} (${c.niveau})` }));

  return (
    <Card>
      <div className="fiche-identite-header">
        <div className="fiche-avatar-lg">
          <Avatar initiales={getInitials(local)} genre={local.genre} size="lg" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="fiche-nom">{local.prenom} {local.nom}</h2>
          <Badge label={local.genre === 'M' ? t('eleves.genres.masculin') : t('eleves.genres.feminin')} variant={local.genre === 'M' ? 'info' : 'warning'} />
        </div>
        {!readOnly && !editing && (
          <button
            className="famille-edit-btn"
            onClick={() => setEditing(true)}
            title={t('fiche.identite.modifierInfos')}
          >
            <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ marginTop: '1rem' }}>
          <div className="famille-form-grid">
            <Input label={t('fiche.identite.form.prenom')} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
            <Input label={t('fiche.identite.form.nom')} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            <Input label={t('fiche.identite.form.dateNaissance')} type="date" value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))} />
            <Select label={t('fiche.identite.form.genre')} value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value as 'M' | 'F' }))} options={GENRE_OPTIONS} />
            <Input label={t('fiche.identite.form.email')} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('fiche.identite.form.emailPlaceholder')} />
            <Input label={t('fiche.identite.form.telephone')} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder={t('fiche.identite.form.telephonePlaceholder')} />
          </div>
          <Input label={t('fiche.identite.form.adresse', { defaultValue: 'Adresse' })} value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder={t('fiche.identite.form.adressePlaceholder')} />
          {classeOptions.length > 0 && (
            <Select
              label={t('fiche.identite.form.classe')}
              value={form.classe_id}
              onChange={e => setForm(f => ({ ...f, classe_id: e.target.value }))}
              options={classeOptions}
            />
          )}
          <div className="famille-form-actions">
            <Button size="sm" variant="secondary" onClick={handleCancel}>{t('common.annuler')}</Button>
            <Button size="sm" variant="primary" onClick={handleSave} loading={saving}>{t('common.enregistrer')}</Button>
          </div>
        </div>
      ) : (
        <div className="fiche-info-grid">
          <div className="fiche-info-item">
            <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={16} />
            <div>
              <span className="fiche-info-label">{t('fiche.identite.dateNaissance')}</span>
              <span className="fiche-info-value">{formatDate(local.date_naissance)}{age !== null ? ` (${age} ${t('elevesTable.ans')})` : ''}</span>
            </div>
          </div>

          <div className="fiche-info-item">
            <Icon path="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" size={16} />
            <div>
              <span className="fiche-info-label">{t('fiche.identite.classe')}</span>
              <span className="fiche-info-value">{classe?.nom || '—'} {classe?.niveau ? `(${classe.niveau})` : ''}</span>
            </div>
          </div>

          <div className="fiche-info-item">
            <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" size={16} />
            <div>
              <span className="fiche-info-label">{classe?.salle_type === 'variable' ? t('fiche.identite.salleVariable') : t('fiche.identite.salle')}</span>
              <span className="fiche-info-value">
                {salle ?? <span className="text-muted">{t('fiche.identite.salleNonAssignee')}</span>}
                {classe?.salle_type === 'variable' && <Badge label={t('fiche.identite.salleVariableLabel')} variant="default" />}
              </span>
            </div>
          </div>

          <div className="fiche-info-item">
            <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={16} />
            <div>
              <span className="fiche-info-label">{t('fiche.identite.email')}</span>
              <span className="fiche-info-value">
                {local.email || <span className="famille-empty" style={{ fontSize: '0.85rem' }}>{t('fiche.identite.nonRenseigne')}</span>}
              </span>
            </div>
          </div>

          <div className="fiche-info-item">
            <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={16} />
            <div>
              <span className="fiche-info-label">{t('fiche.identite.telephone')}</span>
              <span className="fiche-info-value">
                {local.telephone || <span className="famille-empty" style={{ fontSize: '0.85rem' }}>{t('fiche.identite.nonRenseigne')}</span>}
              </span>
            </div>
          </div>

          <div className="fiche-info-item fiche-info-item-full">
            <Icon path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" size={16} />
            <div>
              <span className="fiche-info-label">{t('fiche.identite.adresse', { defaultValue: 'Adresse' })}</span>
              <span className="fiche-info-value">
                {local.adresse || <span className="famille-empty" style={{ fontSize: '0.85rem' }}>{t('fiche.identite.nonRenseignee')}</span>}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
