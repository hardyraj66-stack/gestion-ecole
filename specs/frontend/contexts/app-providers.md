# AppProviders

**Fichier source :** `src/contexts/AppProviders.tsx`

Composant racine qui empile tous les contextes de l'application dans le bon ordre.

---

## Rôle

Fournir tous les contextes de domaine à l'arbre React sans que `App.tsx` ait à les gérer.

---

## Ordre d'imbrication (extérieur → intérieur)

```tsx
<SettingsContext>        // thème, couleur, langue
  <AnneeContext>         // année scolaire active
    <ViewingContext>     // mode archive
      <NiveauContext>
        <SalleContext>
          <MatiereContext>
            <ClasseContext>
              <EleveContext>
                <NoteContext>
                  <PlanningContext>
                    <ProfesseurContext>
                      <TeacherAssignmentContext>
                        <PeriodeContext>
                          <EvaluationContext>
                            {children}
                          </EvaluationContext>
                        </PeriodeContext>
                      </TeacherAssignmentContext>
                    </ProfesseurContext>
                  </PlanningContext>
                </NoteContext>
              </EleveContext>
            </ClasseContext>
          </MatiereContext>
        </SalleContext>
      </NiveauContext>
    </ViewingContext>
  </AnneeContext>
</SettingsContext>
```

---

## Remarques

- L'ordre d'imbrication est important : les contextes internes peuvent utiliser les contextes externes (ex: `ClasseContext` peut accéder à `SalleContext`)
- `SettingsContext` est le plus externe car il initialise le thème via classes CSS sur `<html>`
- `ViewingContext` dépend de `AnneeContext` pour accéder à la liste des années
