import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ReadService } from './read.service';

@Controller('read')
export class ReadController {
  constructor(private readonly service: ReadService) {}

  @Get('dashboard')
  getDashboard(
    @Query('classesPage') cp?: string,
    @Query('classesLimit') cl?: string,
    @Query('anneeLabel') anneeLabel?: string,
  ) {
    return this.service.getDashboard(parseInt(cp!) || 1, parseInt(cl!) || 5, anneeLabel || undefined);
  }

  @Get('classes')
  getClassesList(
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('niveau') n?: string,
    @Query('anneeLabel') anneeLabel?: string,
  ) {
    return this.service.getClassesList(parseInt(p!) || 1, parseInt(l!) || 8, s || '', n || '', anneeLabel || undefined);
  }

  @Get('classes/:id/eleves')
  async getClasseEleves(
    @Param('id') id: string,
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('eleveId') eleveId?: string,
  ) {
    const data = await this.service.getClasseEleves(id, parseInt(p!) || 1, parseInt(l!) || 10, s || '', eleveId || '');
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('eleves')
  getElevesList(
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('classeId') cid?: string,
    @Query('eleveId') eid?: string, @Query('anneeLabel') anneeLabel?: string,
  ) {
    return this.service.getElevesList(parseInt(p!) || 1, parseInt(l!) || 12, s || '', cid || '', eid || '', anneeLabel || undefined);
  }

  @Get('matieres')
  getMatieresList(@Query('page') p?: string, @Query('limit') l?: string, @Query('niveau') niveau?: string) {
    return this.service.getMatieresList(parseInt(p!) || 1, parseInt(l!) || 8, niveau || '');
  }

  @Get('salles')
  getSallesList(
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('type') type?: string, @Query('search') search?: string,
  ) {
    return this.service.getSallesList(parseInt(p!) || 1, parseInt(l!) || 8, type || '', search || '');
  }

  @Get('salles/:id')
  async getSalleDetail(@Param('id') id: string) {
    const data = await this.service.getSalleDetail(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('planning/classes')
  getPlanningClasses(@Query('anneeLabel') anneeLabel?: string) {
    return this.service.getPlanningClasses(anneeLabel || undefined);
  }

  @Get('planning/classe/:id')
  async getPlanningClasse(@Param('id') id: string) {
    const data = await this.service.getPlanningClasse(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('notes/filters')
  getNotesFilters(@Query('anneeLabel') anneeLabel?: string) {
    return this.service.getNotesFilters(anneeLabel || undefined);
  }

  @Get('notes/eleves')
  getNotesEleves(
    @Query('classeId') classeId: string,
    @Query('matiereId') matiereId: string,
    @Query('trimestre') trimestre: string,
    @Query('anneeLabel') anneeLabel?: string,
  ) {
    return this.service.getNotesEleves(classeId, matiereId, parseInt(trimestre) || 1, anneeLabel || undefined);
  }

  @Get('notes')
  getNotesPage() { return this.service.getNotesPage(); }

  @Get('bulletin/:eleveId')
  async getBulletin(@Param('eleveId') id: string, @Query('trimestre') t: string) {
    const data = await this.service.getBulletin(id, parseInt(t) || 1);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('evaluations')
  getEvaluationsList(
    @Query('classeId') classeId?: string,
    @Query('matiereId') matiereId?: string,
    @Query('trimestre') trimestre?: string,
    @Query('statut') statut?: string,
    @Query('page') p?: string,
    @Query('limit') l?: string,
    @Query('anneeLabel') anneeLabel?: string,
  ) {
    return this.service.getEvaluationsList(
      classeId, matiereId,
      trimestre ? parseInt(trimestre) : undefined,
      statut,
      parseInt(p!) || 1,
      parseInt(l!) || 10,
      anneeLabel || undefined,
    );
  }

  @Get('evaluations/:id')
  async getEvaluationDetail(@Param('id') id: string) {
    const data = await this.service.getEvaluationDetail(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('periodes/active')
  getActivePeriode() { return this.service.getActivePeriode(); }

  @Get('periodes')
  getPeriodes(@Query('annee_scolaire') annee_scolaire: string) {
    return this.service.getPeriodes(annee_scolaire || '');
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
  async getEleveFiche(@Param('id') id: string) {
    const data = await this.service.getEleveFiche(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('niveaux')
  getNiveaux(@Query('anneeLabel') anneeLabel?: string) {
    return this.service.getNiveaux(anneeLabel || undefined);
  }

  @Get('niveaux/:niveau/classes')
  getClassesParNiveau(@Param('niveau') niveau: string, @Query('dateNaissance') dn?: string) {
    return this.service.getClassesParNiveau(decodeURIComponent(niveau), dn);
  }

  @Get('professeurs/actifs')
  getProfesseursActifs() { return this.service.getProfesseursActifs(); }

  @Get('professeurs/:id')
  async getProfesseurDetail(@Param('id') id: string) {
    const data = await this.service.getProfesseurDetail(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('professeurs')
  getProfesseursList(
    @Query('page') p?: string,
    @Query('limit') l?: string,
    @Query('search') s?: string,
  ) {
    return this.service.getProfesseursList(parseInt(p!) || 1, parseInt(l!) || 20, s || '');
  }
}
