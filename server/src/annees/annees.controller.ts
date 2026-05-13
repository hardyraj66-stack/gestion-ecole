import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { AnneesService } from './annees.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('annees')
export class AnneesController {
  constructor(private readonly service: AnneesService, private readonly events: EventsGateway) {}

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
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('annee:created', item);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('annee:updated', item);
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('annee:deleted', { id });
    return { id };
  }

  @Post(':id/demarrer')
  async demarrer(@Param('id') id: string) {
    const annee = await this.service.demarrer(id);
    this.events.emit('annee:updated', annee);
    return annee;
  }

  @Post(':id/terminer')
  async terminer(@Param('id') id: string) {
    const result = await this.service.terminer(id);
    this.events.emit('annee:updated', result.terminee);
    this.events.emit('annee:created', result.nouvelle);
    return result;
  }
}
