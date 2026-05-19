import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { NiveauxService } from './niveaux.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('niveaux')
export class NiveauxController {
  constructor(
    private readonly service: NiveauxService,
    private readonly events: EventsGateway,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.service.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Post('recompact')
  async recompact() {
    const items = await this.service.recompactPublic();
    this.events.emit('niveau:updated', {});
    return items;
  }

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('niveau:created', item);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('niveau:updated', item);
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('niveau:deleted', { id });
    return { id };
  }
}
