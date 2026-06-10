import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './contexts/AppProviders';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { ClassesList } from './pages/ClassesList/ClassesList';
import { CreateClasse } from './pages/CreateClasse/CreateClasse';
import { ClasseEleves } from './pages/ClasseEleves/ClasseEleves';
import { ElevesList } from './pages/ElevesList/ElevesList';
import { CreateEleve } from './pages/CreateEleve/CreateEleve';
import { EleveFiche } from './pages/EleveFiche/EleveFiche';
import { Bulletin } from './pages/Bulletin/Bulletin';
import { MatieresList } from './pages/MatieresList/MatieresList';
import { CreateMatiere } from './pages/CreateMatiere/CreateMatiere';
import { AjouterNotes } from './pages/AjouterNotes/AjouterNotes';
import { Planning } from './pages/Planning/Planning';
import { SallesList } from './pages/SallesList/SallesList';
import { CreateSalle } from './pages/CreateSalle/CreateSalle';
import { NiveauxList } from './pages/NiveauxList/NiveauxList';
import { CreateNiveau } from './pages/CreateNiveau/CreateNiveau';
import { AnneeScolairePage } from './pages/AnneeScolaire/AnneeScolaire';
import { ProfesseursList } from './pages/Professeurs/ProfesseursList';
import { ProfesseurDetail } from './pages/Professeurs/ProfesseurDetail';
import { ProfesseurAssignments } from './pages/Professeurs/ProfesseurAssignments';
import { PeriodesList } from './pages/evaluations/PeriodesList';
import { EvaluationsList } from './pages/evaluations/EvaluationsList';
import { EvaluationDetail } from './pages/evaluations/EvaluationDetail';
import { CreateEvaluation } from './pages/evaluations/CreateEvaluation';
import { Parametres } from './pages/Parametres/Parametres';
import { Profil } from './pages/Profil/Profil';
import { Login } from './pages/Login/Login';
import { ResetPassword } from './pages/Login/ResetPassword';
import { UsersList } from './pages/Users/UsersList';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { PasswordGate } from './components/auth/PasswordGate';

// Restreint une route aux rôles admin + secrétariat (le professeur est redirigé).
const adminSec = (el: ReactNode) => <RequireAuth roles={['admin', 'secretaire']}>{el}</RequireAuth>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <PasswordGate>
                  <AppProviders>
                    <Layout />
                  </AppProviders>
                </PasswordGate>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="classes" element={<ClassesList />} />
            <Route path="classes/nouvelle" element={adminSec(<CreateClasse />)} />
            <Route path="classes/:id/eleves" element={<ClasseEleves />} />
            <Route path="classes/:id/planning" element={<Planning />} />

            <Route path="eleves" element={<ElevesList />} />
            <Route path="eleves/nouveau" element={adminSec(<CreateEleve />)} />
            <Route path="eleves/:id" element={<EleveFiche />} />
            <Route path="eleves/:id/bulletin" element={<Bulletin />} />

            <Route path="matieres" element={adminSec(<MatieresList />)} />
            <Route path="matieres/nouvelle" element={adminSec(<CreateMatiere />)} />

            <Route path="notes" element={<AjouterNotes />} />
            <Route path="planning" element={<Planning />} />
            <Route path="salles" element={adminSec(<SallesList />)} />
            <Route path="salles/nouvelle" element={adminSec(<CreateSalle />)} />

            <Route path="niveaux" element={adminSec(<NiveauxList />)} />
            <Route path="niveaux/nouveau" element={adminSec(<CreateNiveau />)} />

            <Route path="professeurs" element={adminSec(<ProfesseursList />)} />
            <Route path="professeurs/affectations" element={adminSec(<ProfesseurAssignments />)} />
            <Route path="professeurs/:id" element={adminSec(<ProfesseurDetail />)} />

            <Route path="annee-scolaire" element={adminSec(<AnneeScolairePage />)} />

            <Route path="evaluations" element={<PeriodesList />} />
            <Route path="evaluations/liste" element={<EvaluationsList />} />
            <Route path="evaluations/nouvelle" element={<CreateEvaluation />} />
            <Route path="evaluations/:id" element={<EvaluationDetail />} />

            <Route path="parametres" element={<Parametres />} />
            <Route path="profil" element={<Profil />} />

            <Route
              path="utilisateurs"
              element={
                <RequireAuth roles={['admin']}>
                  <UsersList />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
