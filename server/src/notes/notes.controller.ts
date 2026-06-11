import { Controller, Post, Patch, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
import { NotesService } from './notes.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthCtx } from '../read/read.service';

@Controller('notes')
export class NotesController {
  constructor(
    private readonly service: NotesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthCtx, @Body() body: any) {
    const item = await this.service.create(body, user);
    this.events.emit('note:created', item);
    this.viewBuilder.onNoteWrite(item.id);
    return item;
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthCtx, @Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body, user);
    if (!item) throw new NotFoundException();
    this.events.emit('note:updated', item);
    this.viewBuilder.onNoteWrite(id);
    return item;
  }

  @Patch(':id/annuler')
  @HttpCode(200)
  async annuler(@CurrentUser() user: AuthCtx, @Param('id') id: string) {
    const ok = await this.service.annuler(id, user);
    if (!ok) throw new NotFoundException();
    this.events.emit('note:updated', { id });
    this.viewBuilder.onNoteWrite(id);
    return { id };
  }
}
