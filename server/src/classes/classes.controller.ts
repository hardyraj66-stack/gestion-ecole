import { Controller, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('classe:deleted', { id });
    this.viewBuilder.onClasseWrite();
    return { id };
  }
}
