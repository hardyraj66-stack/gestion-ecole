import { Controller, Get, Post, Patch, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { SallesService } from './salles.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('salles')
export class SallesController {
  constructor(
    private readonly service: SallesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Get('disponibles')
  getDisponibles(
    @Query('jour') jour: string,
    @Query('heure_debut') heureDebut: string,
    @Query('heure_fin') heureFin: string,
    @Query('excludeCreneauId') excludeCreneauId?: string,
  ) {
    return this.service.getDisponibles(jour, heureDebut, heureFin, excludeCreneauId);
  }

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('salle:created', item);
    this.viewBuilder.onSalleWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('salle:updated', item);
    this.viewBuilder.onSalleWrite();
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('salle:deleted', { id });
    this.viewBuilder.onSalleWrite();
    return { id };
  }
}
