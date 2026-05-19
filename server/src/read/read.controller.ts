import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ReadService } from './read.service';

@Controller('read')
export class ReadController {
  constructor(private readonly service: ReadService) {}

  @Get('dashboard')
  getDashboard(@Query('classesPage') cp?: string, @Query('classesLimit') cl?: string) {
    return this.service.getDashboard(parseInt(cp!) || 1, parseInt(cl!) || 5);
  }

  @Get('classes')
  getClassesList(@Query('page') p?: string, @Query('limit') l?: string, @Query('search') s?: string, @Query('niveau') n?: string) {
    return this.service.getClassesList(parseInt(p!) || 1, parseInt(l!) || 8, s || '', n || '');
  }

  @Get('classes/:id/eleves')
  async getClasseEleves(
    @Param('id') id: string,
    @Query('page') p?: string, @Query('limit') l?: string, @Query('search') s?: string, @Query('eleveId') eleveId?: string,
  ) {
    const data = await this.service.getClasseEleves(id, parseInt(p!) || 1, parseInt(l!) || 10, s || '', eleveId || '');
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('eleves')
  getElevesList(
    @Query('page') p?: string, @Query('limit') l?: string,
    @Query('search') s?: string, @Query('classeId') cid?: string, @Query('eleveId') eid?: string,
  ) {
    return this.service.getElevesList(parseInt(p!) || 1, parseInt(l!) || 12, s || '', cid || '', eid || '');
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
  getPlanningClasses() { return this.service.getPlanningClasses(); }

  @Get('planning/classe/:id')
  async getPlanningClasse(@Param('id') id: string) {
    const data = await this.service.getPlanningClasse(id);
    if (!data) throw new NotFoundException();
    return data;
  }

  @Get('notes')
  getNotesPage() { return this.service.getNotesPage(); }

  @Get('bulletin/:eleveId')
  async getBulletin(@Param('eleveId') id: string, @Query('trimestre') t: string) {
    const data = await this.service.getBulletin(id, parseInt(t) || 1);
    if (!data) throw new NotFoundException();
    return data;
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
  getNiveaux() { return this.service.getNiveaux(); }

  @Get('niveaux/:niveau/classes')
  getClassesParNiveau(@Param('niveau') niveau: string, @Query('dateNaissance') dn?: string) {
    return this.service.getClassesParNiveau(decodeURIComponent(niveau), dn);
  }
}
