import { Controller, Get, Post, Patch, Delete, Param, Body, Query, NotFoundException, HttpCode } from '@nestjs/common';
import { PlanningExecutionsService } from './planning-executions.service';

@Controller('planning-executions')
export class PlanningExecutionsController {
  constructor(private readonly service: PlanningExecutionsService) {}

  @Get()
  findAll(
    @Query('classeId') classeId?: string,
    @Query('professeurId') professeurId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('date') date?: string,
  ) {
    if (date) return this.service.findByDate(date);
    if (classeId) return this.service.findByClasse(classeId, dateDebut, dateFin);
    if (professeurId) return this.service.findByProfesseur(professeurId, dateDebut, dateFin);
    return [];
  }

  @Post()
  create(@Body() body: any) { return this.service.create(body); }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Delete('purge')
  @HttpCode(200)
  purge(@Query('before') before: string) {
    return this.service.purgeBeforeDate(before);
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const ok = await this.service.delete(id);
    if (!ok) throw new NotFoundException();
    return { id };
  }
}
