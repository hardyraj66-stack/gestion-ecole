import { Controller, Post, Patch, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('classes')
export class ClassesController {
  constructor(
    private readonly service: ClassesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('classe:created', item);
    this.viewBuilder.onClasseWrite(); // sync read model
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('classe:updated', item);
    this.viewBuilder.onClasseWrite();
    return item;
  }

  @Patch(':id/desactiver')
  @HttpCode(200)
  async desactiver(@Param('id') id: string) {
    const ok = await this.service.desactiver(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('classe:updated', { id });
    this.viewBuilder.onClasseWrite();
    return { id };
  }
}
