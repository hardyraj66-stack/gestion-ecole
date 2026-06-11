import { Controller, Get, Post, Patch, Delete, Param, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { SallesService } from './salles.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { Roles } from '../auth/roles.decorator';

// Configuration : réservé admin + secrétariat (le professeur lit via /read/salles).
@Controller('salles')
@Roles('admin', 'secretaire')
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

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    const result = await this.service.getSalleStats(id);
    if (!result) throw new NotFoundException();
    return result;
  }

  @Get(':id/usage')
  async checkUsage(@Param('id') id: string) {
    return this.service.checkUsage(id);
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
  async delete(
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    const usage = await this.service.checkUsage(id);
    if (usage.utilisee && force !== 'true') {
      throw new BadRequestException({
        message: `Cette salle est utilisée dans ${usage.creneaux_actifs} cours`,
        creneaux_actifs: usage.creneaux_actifs,
        code: 'SALLE_EN_USAGE',
      });
    }
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('salle:deleted', { id });
    this.viewBuilder.onSalleWrite();
    return { id };
  }
}
