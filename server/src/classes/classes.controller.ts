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
    const anneeActive = await this.anneesService.findActive();
    if (!anneeActive) throw new BadRequestException('Aucune année scolaire active. Activez une année scolaire avant de créer une classe.');
    const payload = { ...body, annee_scolaire: anneeActive.label };
    const item = await this.service.create(payload);
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
