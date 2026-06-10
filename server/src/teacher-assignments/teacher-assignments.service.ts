import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeacherAssignment } from './teacher-assignment.schema';
import { Professeur } from '../professeurs/professeur.schema';
import { Classe } from '../classes/classe.schema';
import { NiveauxService } from '../niveaux/niveaux.service';

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    @InjectModel(TeacherAssignment.name) private model: Model<TeacherAssignment>,
    @InjectModel(Professeur.name) private professeurModel: Model<Professeur>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    private readonly niveauxService: NiveauxService,
  ) {}

  findAll() { return this.model.find().exec(); }
  findByClasse(classeId: string) { return this.model.find({ classe_id: classeId }).exec(); }
  findByProfesseur(professeurId: string) { return this.model.find({ professeur_id: professeurId }).exec(); }
  findByClasseAndMatiere(classeId: string, matiereId: string) {
    return this.model.findOne({ classe_id: classeId, matiere_id: matiereId }).exec();
  }

  /**
   * Périmètre d'un professeur dérivé de ses affectations.
   * Le classe_id encode déjà l'année (Classe.anneeScolaireId unique).
   * @returns classeIds (lecture) + couples "classeId|matiereId" (écriture)
   */
  async scopeFor(professeurId: string): Promise<{ classeIds: string[]; couples: Set<string> }> {
    const assignments = await this.model.find({ professeur_id: professeurId }).lean().exec();
    return {
      classeIds: [...new Set(assignments.map((a: any) => a.classe_id))],
      couples: new Set(assignments.map((a: any) => `${a.classe_id}|${a.matiere_id}`)),
    };
  }

  async resolve(classeId: string, matiereId: string) {
    const assignment = await this.model.findOne({ classe_id: classeId, matiere_id: matiereId }).lean().exec();
    if (!assignment) return null;
    const prof = await this.professeurModel.findById(assignment.professeur_id).lean().exec();
    return prof ? { professeur: prof } : null;
  }

  async create(data: any) {
    const classe = await this.classeModel.findById(data.classe_id).lean().exec();
    if (classe?.niveau) {
      const ok = await this.niveauxService.isMatiereAutorisee(classe.niveau, data.matiere_id, (classe as any).anneeScolaireId);
      if (!ok) throw new BadRequestException('Cette matière n\'est pas enseignée dans ce niveau.');
    }
    const existing = await this.model.findOne({ classe_id: data.classe_id, matiere_id: data.matiere_id }).exec();
    if (existing) {
      return this.model.findByIdAndUpdate(existing._id, { professeur_id: data.professeur_id }, { new: true }).exec();
    }
    return new this.model(data).save();
  }

  update(id: string, data: any) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}
