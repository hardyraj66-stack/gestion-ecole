import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { PeriodesService } from './periodes.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('periodes')
export class PeriodesController {
  constructor(
    private readonly service: PeriodesService,
    private readonly events: EventsGateway,
  ) {}

  @Get()
  getAll(@Query('anneeScolaireId') anneeScolaireId: string) {
    return this.service.findAll(anneeScolaireId);
  }

  @Post('init')
  async init(@Body() body: { anneeScolaireId: string }) {
    await this.service.initForAnnee(body.anneeScolaireId);
    const periodes = await this.service.findAll(body.anneeScolaireId);
    this.events.emit('periode:updated', {});
    return periodes;
  }

  @Get('active')
  getActive() {
    return this.service.getActivePeriode();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { date_debut?: string | null; date_fin?: string | null }) {
    const item = await this.service.update(id, body);
    this.events.emit('periode:updated', item);
    return item;
  }

  @Patch(':id/terminer')
  async terminer(@Param('id') id: string) {
    const item = await this.service.terminer(id);
    this.events.emit('periode:updated', item);
    return item;
  }
}
