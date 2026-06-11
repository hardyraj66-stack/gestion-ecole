import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evaluation, NoteEvaluation } from './evaluation.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Classe } from '../classes/classe.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';
import { AuthCtx } from '../read/read.service';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name) private evaluationModel: Model<Evaluation>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
  ) {}

  /**
   * Pour un professeur : vérifie que le couple (classe, matière) fait partie
   * de ses affectations. Admin/secrétaire : aucune restriction.
   */
  private async assertCoupleScope(user: AuthCtx | undefined, classeId: string, matiereId: string) {
    if (!user || user.role !== 'professeur') return;
    if (!user.professeur_id) throw new ForbiddenException('Compte professeur non lié à une fiche.');
    if (!classeId || !matiereId) {
      throw new BadRequestException('Classe ou matière invalide.');
    }
    const ok = await this.assignmentModel.exists({
      professeur_id: user.professeur_id,
      classe_id: classeId,
      matiere_id: matiereId,
    });
    if (!ok) throw new ForbiddenException('Couple (classe, matière) hors de votre périmètre.');
  }

  async create(data: {
    type: 'ds' | 'evaluation';
    classe_id: string;
    matiere_id: string;
    trimestre: 1 | 2 | 3;
    /** Référence ID vers la collection AnneeScolaire (nouveau champ normalisé) */
    anneeScolaireId: string;
    date: string;
  }, user?: AuthCtx) {
    await this.assertCoupleScope(user, data.classe_id, data.matiere_id);
    if (data.type === 'evaluation') {
      const dsPublie = await this.evaluationModel.findOne({
        type: 'ds',
        classe_id: data.classe_id,
        matiere_id: data.matiere_id,
        trimestre: data.trimestre,
        statut: 'publie',
      }).exec();
      if (!dsPublie) {
        throw new BadRequestException('Le DS doit être publié avant de créer une évaluation.');
      }
    }

    const classe = await this.classeModel.findById(data.classe_id).exec();
    if (!classe) throw new NotFoundException('Classe introuvable.');

    const eleves = await this.eleveModel.find({ classe_id: data.classe_id, statut: 'actif' }).exec();
    const notes: NoteEvaluation[] = eleves.map(e => ({
      eleve_id: e._id.toString(),
      valeur: null,
      absent: false,
    }));

    try {
      const evaluation = await new this.evaluationModel({ ...data, notes, statut: 'brouillon' }).save();
      return evaluation;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException(
          `Un ${data.type === 'ds' ? 'DS' : 'une évaluation'} existe déjà pour cette classe, matière et trimestre.`,
        );
      }
      throw err;
    }
  }

  async saisirNotes(id: string, notes: Array<{ eleve_id: string; valeur: number | null; absent: boolean }>, user?: AuthCtx) {
    const evaluation = await this.evaluationModel.findById(id).exec();
    if (!evaluation) throw new NotFoundException('Évaluation introuvable.');
    await this.assertCoupleScope(user, (evaluation as any).classe_id, (evaluation as any).matiere_id);
    if (evaluation.statut === 'publie') throw new ForbiddenException('Impossible de modifier une évaluation publiée.');

    for (const n of notes) {
      if (!n.absent && n.valeur !== null && (n.valeur < 0 || n.valeur > 20)) {
        throw new BadRequestException('La note doit être comprise entre 0 et 20.');
      }
    }

    // Merge par eleve_id : ne remplace que les élèves présents dans le payload
    const notesMap = new Map(evaluation.notes.map(n => [n.eleve_id, { ...n }]));
    for (const n of notes) {
      notesMap.set(n.eleve_id, {
        eleve_id: n.eleve_id,
        valeur: n.absent ? null : n.valeur,
        absent: n.absent,
      });
    }
    evaluation.notes = Array.from(notesMap.values());
    return evaluation.save();
  }

  async publier(id: string, user?: AuthCtx) {
    const evaluation = await this.evaluationModel.findById(id).exec();
    if (!evaluation) throw new NotFoundException('Évaluation introuvable.');
    await this.assertCoupleScope(user, (evaluation as any).classe_id, (evaluation as any).matiere_id);
    if (evaluation.statut === 'publie') throw new ForbiddenException('Évaluation déjà publiée.');
    evaluation.statut = 'publie';
    return evaluation.save();
  }

  async delete(id: string, user?: AuthCtx) {
    const evaluation = await this.evaluationModel.findById(id).exec();
    if (!evaluation) throw new NotFoundException('Évaluation introuvable.');
    await this.assertCoupleScope(user, (evaluation as any).classe_id, (evaluation as any).matiere_id);
    if (evaluation.statut === 'publie') throw new ForbiddenException('Impossible de supprimer une évaluation publiée.');
    await this.evaluationModel.findByIdAndDelete(id).exec();
    return { id };
  }

  findAll() {
    return this.evaluationModel.find().exec();
  }

  findById(id: string) {
    return this.evaluationModel.findById(id).exec();
  }
}
