import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { DepartsService } from './departs.service';

@Controller('departs')
export class DepartsController {
  constructor(private readonly service: DepartsService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('eleve/:eleveId')
  findByEleve(@Param('eleveId') eleveId: string) {
    return this.service.findByEleve(eleveId);
  }

  @Post('eleve/:eleveId')
  enregistrer(@Param('eleveId') eleveId: string, @Body() body: any) {
    return this.service.enregistrerDepart(eleveId, body);
  }

  @Delete('eleve/:eleveId')
  annuler(@Param('eleveId') eleveId: string) {
    return this.service.annulerDepart(eleveId);
  }
}
