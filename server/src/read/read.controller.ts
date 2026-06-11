import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ReadService, AuthCtx } from './read.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('read')
export class ReadController {
  constructor(private readonly service: ReadService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser() user: AuthCtx,
    @Query('classesPage') cp?: string,
    @Query('classesLimit') cl?: string,
    /** ID de l'AnneeScolaire (remplace anneeLabel) */
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getDashboard(parseInt(cp!) || 1, parseInt(cl!) || 5, anneeId || undefined, user);
  }

  @Get('classes')
  getClassesList(
    @CurrentUser() user: AuthCtx,
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('niveau') n?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getClassesList(parseInt(p!) || 1, parseInt(l!) || 8, s || '', n || '', anneeId || undefined, user);
  }

  @Get('classes/:id/eleves')
  async getClasseEleves(
    @CurrentUser() user: AuthCtx,
    @Param('id') id: string,
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('eleveId') eleveId?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const data = await this.service.getClasseEleves(id, parseInt(p!) || 1, parseInt(l!) || 10, s || '', eleveId || '', anneeId || undefined, user);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('eleves/:id/suggestion-reinscription')
  async getSuggestionReinscription(@Param('id') id: string) {
    const data = await this.service.getSuggestionReinscription(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('eleves/sans-classe')
  getElevesSansClasse(
    @Query('page') p?: string,
    @Query('limit') l?: string,
    @Query('search') s?: string,
  ) {
    return this.service.elevesSansClasse(parseInt(p!) || 1, parseInt(l!) || 12, s || '');
  }

  @Get('eleves/non-reinscrits')
  getElevesNonReinscrits() {
    return this.service.elevesNonReinscrits();
  }

  @Get('eleves')
  getElevesList(
    @CurrentUser() user: AuthCtx,
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('classeId') cid?: string,
    @Query('eleveId') eid?: string, @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getElevesList(parseInt(p!) || 1, parseInt(l!) || 12, s || '', cid || '', eid || '', anneeId || undefined, user);
  }

  @Get('matieres')
  getMatieresList(@Query('page') p?: string, @Query('limit') l?: string, @Query('niveau') niveau?: string, @Query('anneeId') anneeId?: string) {
    return this.service.getMatieresList(parseInt(p!) || 1, parseInt(l!) || 8, niveau || '', anneeId || undefined);
  }

  @Get('salles')
  getSallesList(
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('type') type?: string, @Query('search') search?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getSallesList(parseInt(p!) || 1, parseInt(l!) || 8, type || '', search || '', anneeId || undefined);
  }

  @Get('salles/:id')
  async getSalleDetail(@Param('id') id: string) {
    const data = await this.service.getSalleDetail(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('planning/classes')
  getPlanningClasses(@CurrentUser() user: AuthCtx, @Query('anneeId') anneeId?: string) {
    return this.service.getPlanningClasses(anneeId || undefined, user);
  }

  @Get('planning/classe/:id')
  async getPlanningClasse(@CurrentUser() user: AuthCtx, @Param('id') id: string) {
    const data = await this.service.getPlanningClasse(id, user);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('notes/filters')
  getNotesFilters(@CurrentUser() user: AuthCtx, @Query('anneeId') anneeId?: string) {
    return this.service.getNotesFilters(anneeId || undefined, user);
  }

  @Get('notes/eleves')
  getNotesEleves(
    @CurrentUser() user: AuthCtx,
    @Query('classeId') classeId: string,
    @Query('matiereId') matiereId: string,
    @Query('trimestre') trimestre: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getNotesEleves(classeId, matiereId, parseInt(trimestre) || 1, anneeId || undefined, user);
  }

  @Get('notes')
  getNotesPage() { return this.service.getNotesPage(); }

  @Get('bulletin/:eleveId')
  async getBulletin(
    @CurrentUser() user: AuthCtx,
    @Param('eleveId') id: string,
    @Query('trimestre') t: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const data = await this.service.getBulletin(id, parseInt(t) || 1, anneeId || undefined, user);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('evaluations')
  getEvaluationsList(
    @CurrentUser() user: AuthCtx,
    @Query('classeId') classeId?: string,
    @Query('matiereId') matiereId?: string,
    @Query('trimestre') trimestre?: string,
    @Query('statut') statut?: string,
    @Query('page') p?: string,
    @Query('limit') l?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getEvaluationsList(
      classeId, matiereId,
      trimestre ? parseInt(trimestre) : undefined,
      statut,
      parseInt(p!) || 1,
      parseInt(l!) || 10,
      anneeId || undefined,
      user,
    );
  }

  @Get('evaluations/:id')
  async getEvaluationDetail(@CurrentUser() user: AuthCtx, @Param('id') id: string) {
    const data = await this.service.getEvaluationDetail(id, user);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('periodes/active')
  getActivePeriode() { return this.service.getActivePeriode(); }

  @Get('periodes')
  getPeriodes(@Query('anneeScolaireId') anneeScolaireId: string) {
    return this.service.getPeriodes(anneeScolaireId || '');
  }

  @Get('annees/:id/snapshot')
  async getAnneeSnapshot(@Param('id') id: string) {
    const data = await this.service.getAnneeSnapshot(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('create-classe')
  getCreateClasseData() { return this.service.getCreateClasseData(); }

  @Get('create-eleve')
  getCreateEleveData() { return this.service.getCreateEleveData(); }

  @Get('eleves/:id/fiche')
  async getEleveFiche(@CurrentUser() user: AuthCtx, @Param('id') id: string, @Query('anneeId') anneeId?: string) {
    const data = await this.service.getEleveFiche(id, anneeId || undefined, user);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('niveaux')
  getNiveaux(@Query('anneeId') anneeId?: string) {
    return this.service.getNiveaux(anneeId || undefined);
  }

  @Get('niveaux/:niveau/classes')
  getClassesParNiveau(
    @Param('niveau') niveau: string,
    @Query('dateNaissance') dn?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getClassesParNiveau(decodeURIComponent(niveau), dn, anneeId || undefined);
  }

  @Get('professeurs/actifs')
  getProfesseursActifs() { return this.service.getProfesseursActifs(); }

  @Get('professeurs/:id')
  async getProfesseurDetail(@Param('id') id: string, @Query('anneeId') anneeId?: string) {
    const data = await this.service.getProfesseurDetail(id, anneeId || undefined);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('professeurs')
  getProfesseursList(
    @Query('page') p?: string,
    @Query('limit') l?: string,
    @Query('search') s?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.service.getProfesseursList(parseInt(p!) || 1, parseInt(l!) || 20, s || '', anneeId || undefined);
  }
}
