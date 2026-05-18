import { Controller, Post, Patch, Delete, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
import { MatieresService } from './matieres.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('matieres')
export class MatieresController {
  constructor(
    private readonly service: MatieresService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('matiere:created', item);
    this.viewBuilder.onMatiereWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('matiere:updated', item);
    this.viewBuilder.onMatiereWrite();
    return item;
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('matiere:deleted', { id });
    this.viewBuilder.onMatiereWrite();
    return { id };
  }
}
