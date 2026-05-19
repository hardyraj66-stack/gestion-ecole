import { Controller, Post, Patch, Delete, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('planning')
export class PlanningController {
  constructor(
    private readonly service: PlanningService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('creneau:created', item);
    this.viewBuilder.onCreneauWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('creneau:updated', item);
    this.viewBuilder.onCreneauWrite();
    return item;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('creneau:deleted', { id });
    this.viewBuilder.onCreneauWrite();
    return { id };
  }

  @Post('merge/:classeId')
  @HttpCode(200)
  async mergeAdjacent(@Param('classeId') classeId: string) {
    const count = await this.service.mergeAdjacent(classeId);
    if (count > 0) {
      this.events.emit('creneau:updated', { classe_id: classeId });
      this.viewBuilder.onCreneauWrite();
    }
    return { merged: count };
  }
}
