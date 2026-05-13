import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('planning')
export class PlanningController {
  constructor(private readonly service: PlanningService, private readonly events: EventsGateway) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const item = await this.service.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('creneau:created', item);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('creneau:updated', item);
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('creneau:deleted', { id });
    return { id };
  }
}
