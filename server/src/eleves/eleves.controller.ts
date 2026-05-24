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
    await this.viewBuilder.onEleveWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite();
    return item;
  }
}
