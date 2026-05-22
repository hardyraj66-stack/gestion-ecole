import { Controller, Post, Patch, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
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

  @Patch(':id/annuler')
  @HttpCode(200)
  async annuler(@Param('id') id: string) {
    const ok = await this.service.annuler(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('note:updated', { id });
    this.viewBuilder.onNoteWrite();
    return { id };
  }
}
