import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
import { ProfesseursService } from './professeurs.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';

@Controller('professeurs')
export class ProfesseursController {
  constructor(
    private readonly service: ProfesseursService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const item = await this.service.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Post()
  async create(@Body() body: any) {
    const item = await this.service.create(body);
    this.events.emit('professeur:event', item);
    this.viewBuilder.onProfesseurWrite();
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('professeur:event', item);
    this.viewBuilder.onProfesseurWrite();
    return item;
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('professeur:event', { id });
    this.viewBuilder.onProfesseurWrite();
    return { id };
  }
}
