import { Controller, Post, Patch, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthCtx } from '../read/read.service';

@Controller('evaluations')
export class EvaluationsController {
  constructor(
    private readonly service: EvaluationsService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthCtx, @Body() body: any) {
    const item = await this.service.create(body, user);
    this.events.emit('evaluation:created', item);
    this.viewBuilder.onEvaluationWrite(item.id);
    return item;
  }

  @Patch(':id/notes')
  async saisirNotes(@CurrentUser() user: AuthCtx, @Param('id') id: string, @Body() body: { notes: any[] }) {
    const item = await this.service.saisirNotes(id, body.notes, user);
    this.events.emit('evaluation:updated', item);
    this.viewBuilder.onEvaluationWrite(id);
    return item;
  }

  @Patch(':id/publier')
  @HttpCode(200)
  async publier(@CurrentUser() user: AuthCtx, @Param('id') id: string) {
    const item = await this.service.publier(id, user);
    this.events.emit('evaluation:publie', item);
    this.viewBuilder.onEvaluationWrite(id);
    return item;
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@CurrentUser() user: AuthCtx, @Param('id') id: string) {
    const result = await this.service.delete(id, user);
    this.events.emit('evaluation:deleted', result);
    this.viewBuilder.onEvaluationWrite(id);
    return result;
  }
}
