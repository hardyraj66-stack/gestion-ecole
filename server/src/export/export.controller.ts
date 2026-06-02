import { Controller, Get, Param, Query, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

const slug = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

@Controller('export')
export class ExportController {
  constructor(private readonly svc: ExportService) {}

  // ─── ÉLÈVES ───────────────────────────────────────────────────────────────

  @Get('eleves/csv')
  async elevesCsv(
    @Res() res: Response,
    @Query('classeId') classeId?: string,
    @Query('search') search?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const csv = await this.svc.elevesCsv(classeId, search, anneeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="eleves.csv"');
    res.send('﻿' + csv); // BOM pour Excel
  }

  @Get('eleves/xlsx')
  async elevesXlsx(
    @Res() res: Response,
    @Query('classeId') classeId?: string,
    @Query('search') search?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const buf = await this.svc.elevesXlsx(classeId, search, anneeId);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="eleves.xls"');
    res.send(buf);
  }

  // ─── CLASSES ──────────────────────────────────────────────────────────────

  @Get('classes/csv')
  async classesCsv(@Res() res: Response, @Query('niveau') niveau?: string, @Query('anneeId') anneeId?: string) {
    const csv = await this.svc.classesCsv(niveau, anneeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="classes.csv"');
    res.send('﻿' + csv);
  }

  @Get('classes/xlsx')
  async classesXlsx(@Res() res: Response, @Query('niveau') niveau?: string, @Query('anneeId') anneeId?: string) {
    const buf = await this.svc.classesXlsx(niveau, anneeId);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="classes.xls"');
    res.send(buf);
  }

  // ─── ÉLÈVES D'UNE CLASSE ──────────────────────────────────────────────────

  @Get('classes/:id/eleves/csv')
  async classeElevesCsv(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const csv = await this.svc.classeElevesCsv(id, search, anneeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="classe_${slug(id)}_eleves.csv"`);
    res.send('﻿' + csv);
  }

  @Get('classes/:id/eleves/xlsx')
  async classeElevesXlsx(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const buf = await this.svc.classeElevesXlsx(id, search, anneeId);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="classe_${slug(id)}_eleves.xls"`);
    res.send(buf);
  }

  // ─── MATIÈRES ─────────────────────────────────────────────────────────────

  @Get('matieres/csv')
  async matieresCsv(@Res() res: Response, @Query('niveau') niveau?: string, @Query('anneeId') anneeId?: string) {
    const csv = await this.svc.matieresCsv(niveau, anneeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="matieres.csv"');
    res.send('﻿' + csv);
  }

  @Get('matieres/xlsx')
  async matieresXlsx(@Res() res: Response, @Query('niveau') niveau?: string, @Query('anneeId') anneeId?: string) {
    const buf = await this.svc.matieresXlsx(niveau, anneeId);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="matieres.xls"');
    res.send(buf);
  }

  // ─── SALLES ───────────────────────────────────────────────────────────────

  @Get('salles/csv')
  async sallesCsv(@Res() res: Response, @Query('type') type?: string, @Query('anneeId') anneeId?: string) {
    const csv = await this.svc.sallesCsv(type, anneeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="salles.csv"');
    res.send('﻿' + csv);
  }

  @Get('salles/xlsx')
  async sallesXlsx(@Res() res: Response, @Query('type') type?: string, @Query('anneeId') anneeId?: string) {
    const buf = await this.svc.sallesXlsx(type, anneeId);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="salles.xls"');
    res.send(buf);
  }

  // ─── PROFESSEURS (globaux — non scopés par année) ─────────────────────────

  @Get('professeurs/csv')
  async professeursCsv(@Res() res: Response, @Query('search') search?: string) {
    const csv = await this.svc.professeursCsv(search);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="professeurs.csv"');
    res.send('﻿' + csv);
  }

  @Get('professeurs/xlsx')
  async professeursXlsx(@Res() res: Response, @Query('search') search?: string) {
    const buf = await this.svc.professeursXlsx(search);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="professeurs.xls"');
    res.send(buf);
  }

  // ─── ÉVALUATIONS ──────────────────────────────────────────────────────────

  @Get('evaluations/csv')
  async evaluationsCsv(
    @Res() res: Response,
    @Query('classeId') classeId?: string,
    @Query('matiereId') matiereId?: string,
    @Query('trimestre') trimestre?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const csv = await this.svc.evaluationsCsv(classeId, matiereId, trimestre ? parseInt(trimestre) : undefined, anneeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="evaluations.csv"');
    res.send('﻿' + csv);
  }

  @Get('evaluations/xlsx')
  async evaluationsXlsx(
    @Res() res: Response,
    @Query('classeId') classeId?: string,
    @Query('matiereId') matiereId?: string,
    @Query('trimestre') trimestre?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    const buf = await this.svc.evaluationsXlsx(classeId, matiereId, trimestre ? parseInt(trimestre) : undefined, anneeId);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="evaluations.xls"');
    res.send(buf);
  }

  // ─── BULLETIN PDF ─────────────────────────────────────────────────────────

  @Get('bulletin/:eleveId')
  async bulletinPdf(
    @Param('eleveId') eleveId: string,
    @Query('trimestre') trimestre: string,
    @Res() res: Response,
    @Query('anneeId') anneeId?: string,
  ) {
    const html = await this.svc.bulletinHtml(eleveId, parseInt(trimestre) || 1, anneeId);
    if (!html) throw new NotFoundException('Élève introuvable');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  // ─── CARTE SCOLAIRE ───────────────────────────────────────────────────────

  @Get('carte/:eleveId')
  async carteEleve(
    @Param('eleveId') eleveId: string,
    @Res() res: Response,
    @Query('anneeId') anneeId?: string,
  ) {
    const html = await this.svc.carteEleveHtml(eleveId, anneeId);
    if (!html) throw new NotFoundException('Élève introuvable');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
