import { Controller, Post, Patch, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { ElevesService } from './eleves.service';
import { AnneesService } from '../annees/annees.service';
import { ClassesService } from '../classes/classes.service';
import { EventsGateway } from '../events/events.gateway';
import { ViewBuilderService } from '../read/view-builder.service';
import { Roles } from '../auth/roles.decorator';

// Écriture des élèves réservée admin + secrétariat. Le professeur lit via /read/eleves.
@Controller('eleves')
@Roles('admin', 'secretaire')
export class ElevesController {
  constructor(
    private readonly service: ElevesService,
    private readonly anneesService: AnneesService,
    private readonly classesService: ClassesService,
    private readonly events: EventsGateway,
    private readonly viewBuilder: ViewBuilderService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const annee = await this.anneesService.findActive()
      ?? (await this.anneesService.findByStatut('preparation'))[0];
    if (!annee) throw new BadRequestException('Aucune année scolaire active ou en préparation');
    body.anneeScolaireId = (annee as any)._id.toString();
    const item = await this.service.create(body);
    this.events.emit('eleve:created', item);
    await this.viewBuilder.onEleveWrite(item.id);
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.service.update(id, body);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }

  @Post(':id/inscrire')
  async inscrire(@Param('id') id: string, @Body() body: { anneeId: string }) {
    const item = await this.service.inscrire(id, body.anneeId);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }

  @Post(':id/desinscrire')
  async desinscrire(@Param('id') id: string) {
    const item = await this.service.desinscrire(id);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }

  @Post(':id/reinscire')
  async reinscire(@Param('id') id: string, @Body() body: { classeId: string; anneeScolaireId: string; forceCapacite?: boolean }) {
    if (!body.classeId || !body.anneeScolaireId) {
      throw new BadRequestException('classeId et anneeScolaireId sont requis');
    }

    // Validation 1 — la classe existe
    const classe = await this.classesService.findById(body.classeId);
    if (!classe) throw new BadRequestException('Classe introuvable');

    // Validation 2 — la classe appartient à l'année cible
    const classeAnneeId = (classe as any).anneeScolaireId || '';
    if (classeAnneeId !== body.anneeScolaireId) {
      throw new BadRequestException('Cette classe n\'appartient pas à l\'année scolaire indiquée');
    }

    // Validation 3 — l'année existe et est active ou preparation
    const annee = await this.anneesService.findById(body.anneeScolaireId);
    if (!annee) throw new BadRequestException('Année scolaire introuvable');
    if (annee.statut === 'terminee') {
      throw new BadRequestException('Impossible d\'inscrire dans une année scolaire terminée');
    }

    // Validation 4 — capacité de la classe (sauf si forceCapacite)
    if (!body.forceCapacite) {
      const nbEleves = await this.service.countByClasse(body.classeId);
      const capacite = (classe as any).capacite || 0;
      if (capacite > 0 && nbEleves >= capacite) {
        throw new BadRequestException(
          JSON.stringify({ code: 'CAPACITE_DEPASSEE', capacite, nbEleves, classeNom: (classe as any).nom })
        );
      }
    }

    // Validation 5 — l'élève n'est pas déjà actif dans cette classe
    const eleve = await this.service.findById(id);
    if (!eleve) throw new NotFoundException('Élève introuvable');
    const inscriptions: any[] = (eleve as any).inscriptions || [];
    const dejaInscrit = inscriptions.find(i => i.status === 'active' && i.classeId === body.classeId);
    if (dejaInscrit) {
      throw new BadRequestException('L\'élève est déjà inscrit dans cette classe');
    }

    const item = await this.service.reinscire(id, body.classeId, body.anneeScolaireId);
    if (!item) throw new NotFoundException();
    this.events.emit('eleve:updated', item);
    await this.viewBuilder.onEleveWrite(id);
    return item;
  }
}
