import { Controller, Post, Patch, Param, Body, NotFoundException, HttpCode, BadRequestException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { AnneesService } from '../annees/annees.service';

@Controller('classes')
export class ClassesController {
  constructor(
    private readonly service: ClassesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
    private readonly anneesService: AnneesService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const annee = await this.anneesService.findActive()
      ?? (await this.anneesService.findByStatut('preparation'))[0];
    if (!annee) throw new BadRequestException('Aucune année scolaire active ou en préparation');
    const payload = { ...body, annee_scolaire: annee.label, anneeScolaireId: (annee as any)._id.toString() };
    const item = await this.service.create(payload);
    this.events.emit('classe:created', item);
    this.viewBuilder.onClasseWrite(item.id);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('classe:updated', item);
    this.viewBuilder.onClasseWrite(id);
    return item;
  }

  @Patch(':id/desactiver')
  @HttpCode(200)
  async desactiver(@Param('id') id: string) {
    const ok = await this.service.desactiver(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('classe:updated', { id });
    this.viewBuilder.onClasseWrite(id);
    return { id };
  }
}
