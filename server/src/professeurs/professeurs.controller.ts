import { Controller, Get, Post, Patch, Param, Body, NotFoundException, HttpCode } from '@nestjs/common';
import { ProfesseursService } from './professeurs.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { Roles } from '../auth/roles.decorator';

// Module de configuration : réservé à l'administration et au secrétariat.
// Le professeur est bloqué (403) ; il consulte ses données via /read/*.
@Controller('professeurs')
@Roles('admin', 'secretaire')
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
    const { professeur, account } = await this.service.create(body);
    this.events.emit('professeur:event', professeur);
    this.viewBuilder.onProfesseurWrite();
    return { ...professeur.toJSON(), account };
  }

  @Post(':id/compte')
  async createAccount(@Param('id') id: string) {
    const account = await this.service.createAccountForProfesseur(id);
    if (!account) throw new NotFoundException();
    this.viewBuilder.onProfesseurWrite();
    return { account };
  }

  @Post(':id/renvoyer-identifiants')
  @HttpCode(200)
  async resendCredentials(@Param('id') id: string) {
    const account = await this.service.resendCredentials(id);
    if (!account) throw new NotFoundException();
    return { account };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('professeur:event', item);
    this.viewBuilder.onProfesseurWrite();
    return item;
  }

  @Patch(':id/desactiver')
  @HttpCode(200)
  async desactiver(@Param('id') id: string) {
    const ok = await this.service.desactiver(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('professeur:event', { id });
    this.viewBuilder.onProfesseurWrite();
    return { id };
  }

  @Patch(':id/activer')
  @HttpCode(200)
  async activer(@Param('id') id: string) {
    const ok = await this.service.activer(id);
    if (!ok) throw new NotFoundException();
    this.events.emit('professeur:event', { id });
    this.viewBuilder.onProfesseurWrite();
    return { id };
  }
}
