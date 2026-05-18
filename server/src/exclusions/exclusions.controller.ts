import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ExclusionsService } from './exclusions.service';

@Controller('exclusions')
export class ExclusionsController {
  constructor(private readonly service: ExclusionsService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('eleve/:eleveId')
  findByEleve(@Param('eleveId') eleveId: string) {
    return this.service.findByEleve(eleveId);
  }

  @Post('eleve/:eleveId')
  exclure(@Param('eleveId') eleveId: string, @Body() body: any) {
    return this.service.exclureEleve(eleveId, body);
  }

  @Delete('eleve/:eleveId')
  annuler(@Param('eleveId') eleveId: string) {
    return this.service.annulerExclusion(eleveId);
  }
}
