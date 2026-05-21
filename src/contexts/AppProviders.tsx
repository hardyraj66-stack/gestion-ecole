import { ReactNode } from 'react';
import { ClasseProvider } from './ClasseContext';
import { EleveProvider } from './EleveContext';
import { MatiereProvider } from './MatiereContext';
import { NoteProvider } from './NoteContext';
import { PlanningProvider } from './PlanningContext';
import { SalleProvider } from './SalleContext';
import { AnneeProvider } from './AnneeContext';
import { ViewingProvider } from './ViewingContext';
import { NiveauProvider } from './NiveauContext';
import { ProfesseurProvider } from './ProfesseurContext';
import { TeacherAssignmentProvider } from './TeacherAssignmentContext';
import { ConfirmProvider } from '../components/shared/ConfirmDialog';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      <AnneeProvider>
        <ViewingProvider>
          <SalleProvider>
            <ClasseProvider>
              <EleveProvider>
                <MatiereProvider>
                  <NiveauProvider>
                    <NoteProvider>
                      <ProfesseurProvider>
                        <TeacherAssignmentProvider>
                          <PlanningProvider>
                            {children}
                          </PlanningProvider>
                        </TeacherAssignmentProvider>
                      </ProfesseurProvider>
                    </NoteProvider>
                  </NiveauProvider>
                </MatiereProvider>
              </EleveProvider>
            </ClasseProvider>
          </SalleProvider>
        </ViewingProvider>
      </AnneeProvider>
    </ConfirmProvider>
  );
}
