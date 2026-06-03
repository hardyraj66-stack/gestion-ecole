import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useViewing } from '../../contexts/ViewingContext';
import { useReadOnly } from '../../hooks/useReadOnly';
import { useProfesseurs } from '../../contexts/ProfesseurContext';
import { useProfesseursListData } from '../../hooks/usePageData';
import { Professeur } from '../../types';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/shared/Button';
import { FilterBar } from '../../components/shared/FilterBar';
import { SearchInputSuggestions, Suggestion } from '../../components/shared/SearchInputSuggestions';
import { Alert } from '../../components/shared/Alert';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Select';
import { FormGrid } from '../../components/shared/FormGrid';
import { Card } from '../../components/shared/Card';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/shared/Table';
import { Avatar } from '../../components/shared/Avatar';
import { Pagination } from '../../components/shared/Pagination';
import { Icon, Icons } from '../../components/shared/Icon';
import { Modal } from '../../components/shared/Modal';
import { ExportMenu } from '../../components/shared/ExportMenu';

const empty = { nom: '', prenom: '', email: '', telephone: '', genre: 'M', statut: 'actif' };

function getInitialsProf(p: Professeur) {
  return `${p.prenom[0] || ''}${p.nom[0] || ''}`.toUpperCase();
}

export function ProfesseursList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isViewingArchive, viewingId } = useViewing();
  const readOnly = useReadOnly();
  const { create, update } = useProfesseurs();

  const GENRE_OPTIONS = [
    { value: 'M', label: `${t('professeurs.genres.masculin')} (${t('professeurs.genres.prefixM')})` },
    { value: 'F', label: `${t('professeurs.genres.feminin')} (${t('professeurs.genres.prefixMme')})` },
  ];
  const STATUT_OPTIONS = [
    { value: 'actif', label: t('professeurs.statuts.actif') },
    { value: 'inactif', label: t('professeurs.statuts.inactif') },
  ];

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [localItems, setLocalItems] = useState<Professeur[] | null>(null);

  const fetchSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const data = await readApi.professeurs(1, 8, query, viewingId ?? undefined);
    if (!data?.items) return [];
    return (data.items as any[]).map((p: any) => ({
      id: p.id,
      label: `${p.prenom} ${p.nom}`,
      sublabel: p.statut === 'actif' ? t('professeurs.statuts.actif') : t('professeurs.statuts.inactif'),
    }));
  }, [t, viewingId]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error } = useProfesseursListData(page, debouncedSearch);

  useEffect(() => { if (data) setLocalItems(data.items); }, [data]);

  const openCreate = () => { setForm({ ...empty }); setEditingId(null); setFormError(''); setShowForm(true); };
  const openEdit = (p: Professeur) => {
    setForm({ nom: p.nom, prenom: p.prenom, email: p.email || '', telephone: p.telephone || '', genre: p.genre, statut: p.statut });
    setEditingId(p.id); setFormError(''); setShowForm(true);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) { setFormError(t('professeurs.erreurNomPrenom')); return; }
    setFormSubmitting(true); setFormError('');
    if (editingId) {
      await update(editingId, form,
        () => { setShowForm(false); setLocalItems(prev => prev ? prev.map(p => p.id === editingId ? { ...p, ...form } as Professeur : p) : prev); },
        (err) => setFormError(err),
      );
    } else {
      await create(form,
        () => { setShowForm(false); setLocalItems(null); },
        (err) => setFormError(err),
      );
    }
    setFormSubmitting(false);
  }, [form, editingId, create, update, t]);

  if (loading && !localItems) return <PageLoader />;
  if (error && !localItems) return <Alert variant="error">{t('professeurs.erreur')}</Alert>;

  const items = localItems ?? data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <PageHeader title={t('professeurs.titre')} subtitle={t('professeurs.nbProfesseurs', { count: total })}>
        <ExportMenu
          csvUrl={`/export/professeurs/csv${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`}
          xlsxUrl={`/export/professeurs/xlsx${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`}
        />
        {!readOnly && <Button variant="primary" onClick={openCreate}>{t('professeurs.ajouter')}</Button>}
      </PageHeader>

      <FilterBar count={total} countLabel={t('professeurs.nbProfesseurs', { count: total })}>
        <SearchInputSuggestions
          placeholder={t('professeurs.rechercher')}
          value={search}
          onChange={setSearch}
          onSelect={s => navigate(`/professeurs/${s.id}`)}
          fetchSuggestions={fetchSuggestions}
        />
      </FilterBar>

      {showForm && (
        <Modal
          title={editingId ? t('professeurs.actions.modifierTitre') : t('professeurs.actions.nouveauTitre')}
          onClose={() => setShowForm(false)}
          maxWidth={520}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>{t('common.annuler')}</Button>
              <Button type="submit" form="prof-form" variant="primary" disabled={formSubmitting} loading={formSubmitting}>
                {editingId ? t('common.enregistrer') : t('common.creer')}
              </Button>
            </>
          }
        >
          {formError && <Alert variant="error">{formError}</Alert>}
          <form id="prof-form" onSubmit={handleSubmit}>
            <FormGrid columns={2}>
              <Input label={t('professeurs.form.nom')} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder={t('professeurs.form.nomPlaceholder')} />
              <Input label={t('professeurs.form.prenom')} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder={t('professeurs.form.prenomPlaceholder')} />
            </FormGrid>
            <FormGrid columns={2}>
              <Input label={t('professeurs.form.email')} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('professeurs.form.emailPlaceholder')} />
              <Input label={t('professeurs.form.telephone')} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder={t('professeurs.form.telephonePlaceholder')} />
            </FormGrid>
            <FormGrid columns={2}>
              <Select label={t('professeurs.form.genre')} value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} options={GENRE_OPTIONS} />
              <Select label={t('professeurs.form.statut')} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} options={STATUT_OPTIONS} />
            </FormGrid>
          </form>
        </Modal>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.user} size={28} />}
          message={search ? t('professeurs.aucunResultat') : t('professeurs.aucunProfesseur')}
          action={!search && !readOnly ? <Button variant="primary" onClick={openCreate}>{t('professeurs.ajouterProfesseur')}</Button> : undefined}
        />
      ) : (
        <>
          <Card padding="none">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>{t('professeurs.colonnes.professeur')}</TableCell>
                  <TableCell header>{t('professeurs.colonnes.genre')}</TableCell>
                  <TableCell header>{t('professeurs.colonnes.email')}</TableCell>
                  <TableCell header>{t('professeurs.colonnes.telephone')}</TableCell>
                  <TableCell header>{t('professeurs.colonnes.statut')}</TableCell>
                  <TableCell header>{t('professeurs.colonnes.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p: Professeur) => (
                  <TableRow key={p.id} onClick={() => navigate(`/professeurs/${p.id}`)}>
                    <TableCell>
                      <div className="eleve-info">
                        <Avatar initiales={getInitialsProf(p)} genre={p.genre} />
                        <span className="eleve-name eleve-name-link">
                          {p.genre === 'F' ? t('professeurs.genres.prefixMme') : t('professeurs.genres.prefixM')} {p.prenom} {p.nom}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge label={p.genre === 'F' ? t('professeurs.genres.feminin') : t('professeurs.genres.masculin')} variant={p.genre === 'F' ? 'warning' : 'info'} />
                    </TableCell>
                    <TableCell>{p.email || '—'}</TableCell>
                    <TableCell>{p.telephone || '—'}</TableCell>
                    <TableCell>
                      <Badge label={p.statut === 'actif' ? t('professeurs.statuts.actif') : t('professeurs.statuts.inactif')} variant={p.statut === 'actif' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <div onClick={e => e.stopPropagation()}>
                        {!readOnly && (
                          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>{t('professeurs.actions.modifier')}</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination currentPage={page} totalItems={total} pageSize={20} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
