import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { AnneesService } from './annees.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { Roles } from '../auth/roles.decorator';

// Les GET restent ouverts (l'AnneeProvider charge /annees au démarrage pour
// la logique d'archive/lecture seule de TOUS les rôles). Seules les mutations
// (cycle de vie de l'année scolaire) sont réservées admin + secrétariat.
@Controller('annees')
export class AnneesController {
  constructor(
    private readonly service: AnneesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('active')
  async findActive() {
    return (await this.service.findActive()) || null;
  }

  @Get(':id/snapshot')
  async getSnapshot(@Param('id') id: string) {
    const snap = await this.service.getSnapshot(id);
    if (!snap) throw new NotFoundException();
    return snap;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const item = await this.service.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Post()
  @Roles('admin', 'secretaire')
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('annee:created', item);
    return item;
  }

  @Patch(':id')
  @Roles('admin', 'secretaire')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('annee:updated', item);
    return item;
  }

  @Delete(':id')
  @Roles('admin', 'secretaire')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('annee:deleted', { id });
    return { id };
  }

  @Post(':id/demarrer')
  @Roles('admin', 'secretaire')
  async demarrer(@Param('id') id: string) {
    const annee = await this.service.demarrer(id);
    await this.viewBuilder.rebuildAll();
    this.events.emit('annee:updated', annee);
    return annee;
  }

  @Post(':id/terminer')
  @Roles('admin', 'secretaire')
  async terminer(@Param('id') id: string) {
    const terminee = await this.service.terminer(id);
    this.events.emit('annee:updated', terminee);
    return terminee;
  }

  @Post(':id/migrer-eleves')
  @Roles('admin', 'secretaire')
  async migrerEleves(@Param('id') id: string) {
    const result = await this.service.migrerEleves(id);
    this.events.emit('annee:migration', { id, ...result });
    return result;
  }
}
