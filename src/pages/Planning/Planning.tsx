import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePlanningClasses, usePlanningClasse } from '../../hooks/usePageData';
import { readApi } from '../../services/readApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/shared/Alert';
import { Icon, Icons } from '../../components/shared/Icon';
import { Popover } from '../../components/shared/Popover';
import { StatItem } from '../../components/shared/StatItem';
import { ListItem } from '../../components/shared/ListItem';
import { SelectOption } from '../../components/shared/Select';
import { calculateDuration } from '../../utils/helpers';
import { NIVEAUX_ORDRE } from './planning.helpers';
import { usePlanningState } from './usePlanningState';
import { PlanningGrid } from './PlanningGrid';
import { CreateModal, EditModal, MoveModal } from './PlanningModals';
import { PlanningContextMenu, PlanningTooltip } from './PlanningOverlays';

export function Planning() {
  const { id } = useParams<{ id: string }>();
  const [selectedClasseId, setSelectedClasseId] = useState<string>(id || '');
  const [openNiveau, setOpenNiveau] = useState<string | null>(null);

  useEffect(() => { if (id) setSelectedClasseId(id); }, [id]);

  const [niveauxOrdre, setNiveauxOrdre] = useState<string[]>(NIVEAUX_ORDRE);
  const [niveauxConfig, setNiveauxConfig] = useState<any[]>([]);
  useEffect(() => {
    readApi.niveaux().then((res: any) => {
      if (res && Array.isArray(res)) {
        const configured = res.filter((n: any) => n.id);
        if (configured.length > 0) {
          setNiveauxOrdre(configured.map((n: any) => n.nom ?? n.niveau));
          setNiveauxConfig(configured);
        }
      }
    });
  }, []);

  const { data: classesData, loading: classesLoading, readOnly } = usePlanningClasses();
  const { data: classeData, loading: classeLoading, refreshing: classeRefreshing } = usePlanningClasse(selectedClasseId);

  const allClasses = classesData?.classes || [];
  const selectedClasse = classeData?.classe || allClasses.find((c: any) => c.id === selectedClasseId) || null;
  const classeCreneaux: any[] = classeData?.creneaux || [];
  const allMatieres: any[] = classeData?.matieres || [];
  const totalHeures = classeCreneaux.reduce((t: number, c: any) => t + calculateDuration(c.heure_debut, c.heure_fin), 0);
  const matiereOptions: SelectOption[] = useMemo(() => {
    const niveauConfig = niveauxConfig.find((n: any) => (n.nom ?? n.niveau) === selectedClasse?.niveau);
    const allowedIds: string[] | null = niveauConfig?.matiere_ids?.length > 0 ? niveauConfig.matiere_ids : null;
    return allMatieres
      .filter((m: any) => !allowedIds || allowedIds.includes(m.id))
      .map((m: any) => ({ value: m.id, label: m.nom }));
  }, [allMatieres, niveauxConfig, selectedClasse?.niveau]);

  const niveaux = useMemo(() => {
    if (!classesData?.classes) return [];
    const map = new Map<string, any[]>();
    for (const c of classesData.classes) {
      const n = c.niveau || 'Autre';
      if (!map.has(n)) map.set(n, []);
      map.get(n)!.push(c);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ia = niveauxOrdre.indexOf(a), ib = niveauxOrdre.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
      })
      .map(([niveau, classes]) => ({ niveau, classes }));
  }, [classesData]);

  const s = usePlanningState(classeCreneaux, allMatieres, selectedClasse, readOnly);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); s.handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); s.handleRedo(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const handleSelectClasse = (cid: string) => {
    setSelectedClasseId(cid);
    setOpenNiveau(null);
    s.notification.clear();
  };

  if (classesLoading) return <PageLoader />;
  if (!classesData) return <Alert variant="error">Problème de chargement.</Alert>;

  const selectedNiveau = selectedClasse?.niveau || null;

  return (
    <div
      className="planning-root"
      onMouseUp={() => { if (s.resizing) s.handleResizeEnd(); }}
      onClick={() => s.setContextMenu(null)}
    >
      <PageHeader title="Planning" subtitle={selectedClasse ? selectedClasse.nom : 'Sélectionnez une classe'} />

      {s.notification.msg && (
        <div className="planning-notification">
          <span>{s.notification.msg}</span>
          <button type="button" onClick={s.notification.clear} className="planning-notification-close">✕</button>
        </div>
      )}

      {!readOnly && (
        <div className="planning-toolbar">
          <button
            type="button"
            className={`planning-toolbar-btn${s.undoStack.length === 0 ? ' disabled' : ''}`}
            onClick={s.handleUndo}
            disabled={s.undoStack.length === 0}
            title="Annuler (Ctrl+Z)"
          >↩ Annuler</button>
          <button
            type="button"
            className={`planning-toolbar-btn${s.redoStack.length === 0 ? ' disabled' : ''}`}
            onClick={s.handleRedo}
            disabled={s.redoStack.length === 0}
            title="Rétablir (Ctrl+Y)"
          >↪ Rétablir</button>
          <span className="planning-toolbar-hint">Clic → créer · Glisser → déplacer · Clic droit → options</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem' }}>
        {/* ── Sidebar ── */}
        <div>
          <Card>
            <h3 className="planning-sidebar-title">Niveaux</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {niveaux.map(({ niveau, classes: nc }) => (
                <Popover
                  key={niveau}
                  open={openNiveau === niveau}
                  onClose={() => setOpenNiveau(null)}
                  trigger={
                    <div
                      className={`niveau-item ${selectedNiveau === niveau ? 'niveau-item-selected' : openNiveau === niveau ? 'niveau-item-active' : ''}`}
                      onClick={() => setOpenNiveau(openNiveau === niveau ? null : niveau)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{niveau}</span>
                        <Badge label={`${nc.length}`} variant={selectedNiveau === niveau ? 'primary' : 'default'} />
                      </div>
                      <span className="niveau-item-arrow">▾</span>
                    </div>
                  }
                >
                  <div style={{ padding: '0.35rem 0' }}>
                    {nc.map((c: any) => (
                      <ListItem
                        key={c.id}
                        title={c.nom}
                        subtitle={c.salle}
                        selected={c.id === selectedClasseId}
                        onClick={() => handleSelectClasse(c.id)}
                        trailing={<Badge label={`${c._creneauxCount || 0}`} variant={c.id === selectedClasseId ? 'primary' : 'default'} />}
                      />
                    ))}
                  </div>
                </Popover>
              ))}
            </div>
            {selectedClasse && (
              <div className="planning-sidebar-selection">
                <div className="planning-sidebar-selection-label">Sélection</div>
                <div className="planning-sidebar-selection-name">{selectedClasse.nom}</div>
                <div className="planning-sidebar-selection-sub">{selectedClasse.niveau} · {selectedClasse.salle}</div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Grid area ── */}
        <div>
          {!selectedClasseId ? (
            <Card><EmptyState icon={<Icon path={Icons.calendar} size={28} />} message="Sélectionnez une classe" /></Card>
          ) : !selectedClasse ? (
            <Card><EmptyState icon={<Icon path={Icons.warning} size={28} />} message="Classe introuvable" /></Card>
          ) : (
            <>
              <Card style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <StatItem label="Classe" value={selectedClasse.nom} />
                  <StatItem label="Créneaux" value={classeLoading && !classeData ? '…' : classeCreneaux.length} />
                  <StatItem label="Heures/sem" value={classeLoading && !classeData ? '…' : `${totalHeures}h`} />
                  <StatItem label="Mode" value={<Badge label={selectedClasse.salle_type === 'fixe' ? 'Fixe' : 'Variable'} variant={selectedClasse.salle_type === 'fixe' ? 'info' : 'warning'} />} />
                  {!readOnly && <StatItem label="Historique" value={`${s.undoStack.length} action${s.undoStack.length !== 1 ? 's' : ''}`} />}
                </div>
              </Card>

              <Card padding="none">
                <PlanningGrid
                  readOnly={readOnly}
                  classeLoading={classeLoading}
                  classeData={classeData}
                  classeRefreshing={classeRefreshing}
                  cellCreneauMap={s.cellCreneauMap}
                  ghostCells={s.ghostCells}
                  ghostConflict={s.ghostConflict}
                  dragging={s.dragging}
                  selecting={s.selecting}
                  resizing={s.resizing}
                  resizeHeure={s.resizeHeure}
                  isInSelection={s.isInSelection}
                  onCellMouseDown={s.handleCellMouseDown}
                  onCellMouseEnter={s.handleCellMouseEnter}
                  onCellMouseUp={s.handleCellMouseUp}
                  onMouseLeave={s.handleGridMouseLeave}
                  onDragOver={s.handleDragOver}
                  onDragLeave={s.handleDragLeave}
                  onDrop={s.handleDrop}
                  onDragStart={s.handleDragStart}
                  onDragEnd={s.handleDragEnd}
                  onResizeStart={s.handleResizeStart}
                  onResizeEnter={s.handleResizeEnter}
                  onResizeEnd={s.handleResizeEnd}
                  onOpenEdit={s.handleOpenEdit}
                  onDelete={s.handleDeleteCreneau}
                  onContextMenu={s.handleContextMenu}
                  onCreneauMouseEnter={s.handleCreneauMouseEnter}
                  onCreneauMouseLeave={s.handleCreneauMouseLeave}
                />
              </Card>
            </>
          )}
        </div>
      </div>

      <CreateModal
        show={s.showCreatePopup}
        formJour={s.formJour} formDebut={s.formDebut} formFin={s.formFin}
        formMatiereId={s.formMatiereId} formSalle={s.formSalle} formEnseignant={s.formEnseignant}
        formSubmitting={s.formSubmitting} formError={s.formError}
        matiereOptions={matiereOptions}
        salleFixe={selectedClasse?.salle_type === 'fixe' ? (selectedClasse.salle || '') : undefined}
        initialConflict={s.formSalleConflict}
        onClose={() => s.setShowCreatePopup(false)}
        onSubmit={e => { e.preventDefault(); s.doCreate(); }}
        setFormJour={s.setFormJour} setFormDebut={s.setFormDebut} setFormFin={s.setFormFin}
        setFormMatiereId={s.setFormMatiereId} setFormSalle={s.setFormSalle} setFormEnseignant={s.setFormEnseignant}
      />

      <EditModal
        show={s.showEditPopup} editCreneau={s.editCreneau}
        editMatiereId={s.editMatiereId} editJour={s.editJour} editDebut={s.editDebut} editFin={s.editFin}
        editSalle={s.editSalle} editEnseignant={s.editEnseignant}
        editSubmitting={s.editSubmitting} editError={s.editError}
        matiereOptions={matiereOptions}
        salleFixe={selectedClasse?.salle_type === 'fixe' ? (selectedClasse.salle || '') : undefined}
        initialConflict={s.editSalleConflict}
        onClose={() => s.setShowEditPopup(false)}
        onSubmit={e => { e.preventDefault(); s.doEdit(); }}
        setEditMatiereId={s.setEditMatiereId} setEditJour={s.setEditJour}
        setEditDebut={s.setEditDebut} setEditFin={s.setEditFin}
        setEditSalle={s.setEditSalle} setEditEnseignant={s.setEditEnseignant}
      />

      <MoveModal
        show={s.showMovePopover}
        moveCreneau={s.moveCreneau}
        moveTarget={s.moveTarget}
        moveDragSlot={s.moveDragSlot}
        onConfirm={s.handleMoveConfirm}
        onCancel={() => { s.setShowMovePopover(false); s.setMoveCreneau(null); }}
      />

      <PlanningContextMenu
        contextMenu={s.contextMenu} 
        onEdit={s.handleOpenEdit}
        onDuplicate={s.handleDuplicate}
        onDelete={s.handleDeleteCreneau}
      />

      <PlanningTooltip
        hoverCr={s.hoverCr}
        visible={!s.contextMenu && !s.dragging}
      />
    </div>
  );
}
