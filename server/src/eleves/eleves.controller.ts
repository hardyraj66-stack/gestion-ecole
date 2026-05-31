import { Controller, Post, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ElevesService } from './eleves.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('eleves')
export class ElevesController {
  constructor(
    private readonly service: ElevesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('eleve:created', item);
    await this.viewBuilder.onEleveWrite(item.id);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }

  @Post(':id/inscrire')
  async inscrire(@Param('id') id: string, @Body() body: { anneeId: string }) {
    const item = await this.service.inscrire(id, body.anneeId);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }

  @Post(':id/desinscrire')
  async desinscrire(@Param('id') id: string) {
    const item = await this.service.desinscrire(id);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }
}
