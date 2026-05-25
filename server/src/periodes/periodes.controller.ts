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
  getAll(@Query('annee_scolaire') annee_scolaire: string) {
    return this.service.findAll(annee_scolaire);
  }

  @Post('init')
  async init(@Body() body: { annee_scolaire: string }) {
    await this.service.initForAnnee(body.annee_scolaire);
    const periodes = await this.service.findAll(body.annee_scolaire);
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
