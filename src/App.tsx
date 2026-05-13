import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './contexts/AppProviders';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { ClassesList } from './pages/ClassesList/ClassesList';
import { CreateClasse } from './pages/CreateClasse/CreateClasse';
import { ClasseEleves } from './pages/ClasseEleves/ClasseEleves';
import { ElevesList } from './pages/ElevesList/ElevesList';
import { CreateEleve } from './pages/CreateEleve/CreateEleve';
import { Bulletin } from './pages/Bulletin/Bulletin';
import { MatieresList } from './pages/MatieresList/MatieresList';
import { CreateMatiere } from './pages/CreateMatiere/CreateMatiere';
import { AjouterNotes } from './pages/AjouterNotes/AjouterNotes';
import { Planning } from './pages/Planning/Planning';
import { SallesList } from './pages/SallesList/SallesList';
import { AnneeScolairePage } from './pages/AnneeScolaire/AnneeScolaire';

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="classes" element={<ClassesList />} />
            <Route path="classes/nouvelle" element={<CreateClasse />} />
            <Route path="classes/:id/eleves" element={<ClasseEleves />} />
            <Route path="classes/:id/planning" element={<Planning />} />

            <Route path="eleves" element={<ElevesList />} />
            <Route path="eleves/nouveau" element={<CreateEleve />} />
            <Route path="eleves/:id/bulletin" element={<Bulletin />} />

            <Route path="matieres" element={<MatieresList />} />
            <Route path="matieres/nouvelle" element={<CreateMatiere />} />

            <Route path="notes" element={<AjouterNotes />} />
            <Route path="planning" element={<Planning />} />
            <Route path="salles" element={<SallesList />} />

            <Route path="annee-scolaire" element={<AnneeScolairePage />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
