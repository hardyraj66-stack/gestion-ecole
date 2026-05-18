import { Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { SuiviService } from './suivi.service';

@Controller('suivi')
export class SuiviController {
  constructor(private readonly service: SuiviService) {}

  // ===== AVERTISSEMENTS =====
  @Get(':eleveId/avertissements')
  getAvertissements(@Param('eleveId') id: string) {
    return this.service.findAvertissements(id);
  }

  @Post(':eleveId/avertissements')
  createAvertissement(@Param('eleveId') eleveId: string, @Body() body: any) {
    return this.service.createAvertissement({ ...body, eleve_id: eleveId });
  }

  @Delete('avertissements/:id')
  async deleteAvertissement(@Param('id') id: string) {
    const ok = await this.service.deleteAvertissement(id);
    if (!ok) throw new NotFoundException();
    return { id };
  }

  // ===== ABSENCES =====
  @Get(':eleveId/absences')
  getAbsences(@Param('eleveId') id: string) {
    return this.service.findAbsences(id);
  }

  @Post(':eleveId/absences')
  createAbsence(@Param('eleveId') eleveId: string, @Body() body: any) {
    return this.service.createAbsence({ ...body, eleve_id: eleveId, type: 'absence' });
  }

  // ===== RETARDS =====
  @Get(':eleveId/retards')
  getRetards(@Param('eleveId') id: string) {
    return this.service.findRetards(id);
  }

  @Post(':eleveId/retards')
  createRetard(@Param('eleveId') eleveId: string, @Body() body: any) {
    return this.service.createAbsence({ ...body, eleve_id: eleveId, type: 'retard' });
  }

  @Delete('absences/:id')
  async deleteAbsence(@Param('id') id: string) {
    const ok = await this.service.deleteAbsence(id);
    if (!ok) throw new NotFoundException();
    return { id };
  }

  // ===== CONVOCATIONS PARENTS =====
  @Get(':eleveId/convocations')
  getConvocations(@Param('eleveId') id: string) {
    return this.service.findConvocations(id);
  }

  @Post(':eleveId/convocations')
  createConvocation(@Param('eleveId') eleveId: string, @Body() body: any) {
    return this.service.createConvocation(eleveId, body);
  }

  @Patch('convocations/:id')
  async updateConvocation(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.updateConvocation(id, body);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Delete('convocations/:id')
  async deleteConvocation(@Param('id') id: string) {
    const ok = await this.service.deleteConvocation(id);
    if (!ok) throw new NotFoundException();
    return { id };
  }
}
