import { Controller, Get, Post, Patch, Delete, Param, Body, Query, NotFoundException, HttpCode } from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('teacher-assignments')
export class TeacherAssignmentsController {
  constructor(
    private readonly service: TeacherAssignmentsService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('resolve')
  async resolve(@Query('classe_id') classeId: string, @Query('matiere_id') matiereId: string) {
    if (!classeId || !matiereId) return { professeur_id: null };
    const result = await this.service.resolve(classeId, matiereId);
    if (!result) return { professeur_id: null };
    const p = result.professeur as any;
    return {
      professeur_id: p._id?.toString() || p.id,
      professeur_nom: p.nom,
      professeur_prenom: p.prenom,
    };
  }

  @Get('classe/:classeId')
  findByClasse(@Param('classeId') classeId: string) {
    return this.service.findByClasse(classeId);
  }

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('assignment:event', item);
    this.viewBuilder.onAssignmentWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('assignment:event', item);
    this.viewBuilder.onAssignmentWrite();
    return item;
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('assignment:event', { id });
    this.viewBuilder.onAssignmentWrite();
    return { id };
  }
}
