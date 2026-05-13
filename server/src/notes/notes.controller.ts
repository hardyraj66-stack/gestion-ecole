import { Controller, Get, Post, Patch, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('notes')
export class NotesController {
  constructor(private readonly service: NotesService, private readonly events: EventsGateway) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('bulletin/:eleveId')
  getBulletin(@Param('eleveId') eleveId: string, @Query('trimestre') trimestre: string) {
    const t = parseInt(trimestre) || 1;
    return this.service.getBulletin(eleveId, t);
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
    this.events.emit('note:created', item);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('note:updated', item);
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('note:deleted', { id });
    return { id };
  }
}
