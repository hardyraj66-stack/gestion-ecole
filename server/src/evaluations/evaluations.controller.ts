import { Controller, Post, Patch, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('evaluations')
export class EvaluationsController {
  constructor(
    private readonly service: EvaluationsService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('evaluation:created', item);
    this.viewBuilder.onEvaluationWrite();
    return item;
  }

  @Patch(':id/notes')
  async saisirNotes(@Param('id') id: string, @Body() body: { notes: any[] }) {
    const item = await this.service.saisirNotes(id, body.notes);
    this.events.emit('evaluation:updated', item);
    this.viewBuilder.onEvaluationWrite();
    return item;
  }

  @Patch(':id/publier')
  @HttpCode(200)
  async publier(@Param('id') id: string) {
    const item = await this.service.publier(id);
    this.events.emit('evaluation:publie', item);
    this.viewBuilder.onEvaluationWrite();
    return item;
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const result = await this.service.delete(id);
    this.events.emit('evaluation:deleted', result);
    this.viewBuilder.onEvaluationWrite();
    return result;
  }
}
