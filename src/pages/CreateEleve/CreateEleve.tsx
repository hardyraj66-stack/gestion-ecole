import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useClasses } from '../../contexts/ClasseContext';
import { useEleves } from '../../contexts/EleveContext';
import { useViewing } from '../../contexts/ViewingContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/shared/Card';
import { Input } from '../../components/shared/Input';
import { Select, SelectOption } from '../../components/shared/Select';
import { Button } from '../../components/shared/Button';
import { Alert } from '../../components/shared/Alert';
import { FormGrid, FormSection, FormActions } from '../../components/shared/FormGrid';

const GENRE_OPTIONS: SelectOption[] = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
];

export function CreateEleve() {
  const { isViewingArchive } = useViewing();
  const { classes } = useClasses();
  const { create } = useEleves();

  if (isViewingArchive) return <Navigate to="/eleves" replace />;

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [genre, setGenre] = useState<'M' | 'F'>('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [classeId, setClasseId] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const classeOptions: SelectOption[] = classes.map(c => ({
    value: c.id,
    label: `${c.nom} (${c.niveau})`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prenom.trim() || !nom.trim() || !dateNaissance || !classeId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await create({
      prenom: prenom.trim(),
      nom: nom.trim(),
      genre,
      date_naissance: dateNaissance,
      classe_id: classeId,
      email: email.trim() || undefined,
      telephone: telephone.trim() || undefined,
      adresse: adresse.trim() || undefined,
    });

    if (result) {
      setSuccess(true);
      // Reset form
      setPrenom('');
      setNom('');
      setGenre('M');
      setDateNaissance('');
      setClasseId('');
      setEmail('');
      setTelephone('');
      setAdresse('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Erreur lors de la création de l\'élève');
    }

    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Nouvel élève"
        subtitle="Inscrire un nouvel élève"
      >
        <Button as="link" to="/eleves" variant="secondary">
          ← Retour
        </Button>
      </PageHeader>

      <Card className="" style={{ maxWidth: '700px' }}>
        {success && (
          <Alert variant="success">
            Élève inscrit avec succès !
          </Alert>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormSection title="Informations personnelles">
            <FormGrid columns={3}>
              <Input
                label="Prénom *"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex : Jean"
                required
              />

              <Input
                label="Nom *"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : Dupont"
                required
              />

              <Select
                label="Genre *"
                value={genre}
                onChange={(e) => setGenre(e.target.value as 'M' | 'F')}
                options={GENRE_OPTIONS}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Scolarité">
            <FormGrid>
              <Input
                label="Date de naissance *"
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                required
              />

              <Select
                label="Classe *"
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                options={classeOptions}
                placeholder="Sélectionner une classe"
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Contact (optionnel)">
            <FormGrid>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@email.com"
              />

              <Input
                label="Téléphone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </FormGrid>

            <Input
              label="Adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="123 Rue de l'École, 75001 Paris"
              fullWidth
            />
          </FormSection>

          <FormActions>
            <Button as="link" to="/eleves" variant="secondary">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              loading={submitting}
            >
              Inscrire l'élève
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
