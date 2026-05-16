import { Controller, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('notes')
export class NotesController {
  constructor(
    private readonly service: NotesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('note:created', item);
    this.viewBuilder.onNoteWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('note:updated', item);
    this.viewBuilder.onNoteWrite();
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('note:deleted', { id });
    this.viewBuilder.onNoteWrite();
    return { id };
  }
}
