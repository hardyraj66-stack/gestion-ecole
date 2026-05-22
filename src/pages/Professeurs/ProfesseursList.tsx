import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewing } from '../../contexts/ViewingContext';
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

const GENRE_OPTIONS = [{ value: 'M', label: 'Masculin (M.)' }, { value: 'F', label: 'Féminin (Mme)' }];
const STATUT_OPTIONS = [{ value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' }];

const empty = { nom: '', prenom: '', email: '', telephone: '', genre: 'M', statut: 'actif' };

function getInitialsProf(p: Professeur) {
  return `${p.prenom[0] || ''}${p.nom[0] || ''}`.toUpperCase();
}

export function ProfesseursList() {
  const navigate = useNavigate();
  const { isViewingArchive: readOnly } = useViewing();
  const { create, update } = useProfesseurs();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [localItems, setLocalItems] = useState<Professeur[] | null>(null);

  const fetchSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    const data = await readApi.professeurs(1, 8, query);
    if (!data?.items) return [];
    return (data.items as any[]).map((p: any) => ({
      id: p.id,
      label: `${p.prenom} ${p.nom}`,
      sublabel: p.statut === 'actif' ? 'Actif' : 'Inactif',
    }));
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
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
    if (!form.nom.trim() || !form.prenom.trim()) { setFormError('Nom et prénom sont requis.'); return; }
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
  }, [form, editingId, create, update]);


  if (loading && !localItems) return <PageLoader />;
  if (error && !localItems) return <Alert variant="error">Problème de chargement des professeurs.</Alert>;

  const items = localItems ?? data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <PageHeader title="Professeurs" subtitle={`${total} professeur(s)`}>
        {!readOnly && <Button variant="primary" onClick={openCreate}>+ Ajouter un professeur</Button>}
      </PageHeader>

      <FilterBar count={total} countLabel="professeur(s)">
        <SearchInputSuggestions
          placeholder="Rechercher un professeur…"
          value={search}
          onChange={setSearch}
          onSelect={s => navigate(`/professeurs/${s.id}`)}
          fetchSuggestions={fetchSuggestions}
        />
      </FilterBar>

      {/* Modal formulaire */}
      {showForm && (
        <Modal
          title={editingId ? 'Modifier le professeur' : 'Nouveau professeur'}
          onClose={() => setShowForm(false)}
          maxWidth={520}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" form="prof-form" variant="primary" disabled={formSubmitting} loading={formSubmitting}>
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </>
          }
        >
          {formError && <Alert variant="error">{formError}</Alert>}
          <form id="prof-form" onSubmit={handleSubmit}>
            <FormGrid columns={2}>
              <Input label="Nom *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont" />
              <Input label="Prénom *" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Jean" />
            </FormGrid>
            <FormGrid columns={2}>
              <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@ecole.fr" />
              <Input label="Téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06 00 00 00 00" />
            </FormGrid>
            <FormGrid columns={2}>
              <Select label="Genre" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} options={GENRE_OPTIONS} />
              <Select label="Statut" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} options={STATUT_OPTIONS} />
            </FormGrid>
          </form>
        </Modal>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Icon path={Icons.user} size={28} />}
          message={search ? 'Aucun résultat' : 'Aucun professeur'}
          action={!search && !readOnly ? <Button variant="primary" onClick={openCreate}>Ajouter un professeur</Button> : undefined}
        />
      ) : (
        <>
          <Card padding="none">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Professeur</TableCell>
                  <TableCell header>Genre</TableCell>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Téléphone</TableCell>
                  <TableCell header>Statut</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p: Professeur) => (
                  <TableRow key={p.id} onClick={() => navigate(`/professeurs/${p.id}`)}>
                    <TableCell>
                      <div className="eleve-info">
                        <Avatar initiales={getInitialsProf(p)} genre={p.genre} />
                        <span className="eleve-name eleve-name-link">
                          {p.genre === 'F' ? 'Mme' : 'M.'} {p.prenom} {p.nom}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge label={p.genre === 'F' ? 'Féminin' : 'Masculin'} variant={p.genre === 'F' ? 'warning' : 'info'} />
                    </TableCell>
                    <TableCell>{p.email || '—'}</TableCell>
                    <TableCell>{p.telephone || '—'}</TableCell>
                    <TableCell>
                      <Badge label={p.statut === 'actif' ? 'Actif' : 'Inactif'} variant={p.statut === 'actif' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <div onClick={e => e.stopPropagation()}>
                        {!readOnly && (
                          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>Modifier</Button>
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
