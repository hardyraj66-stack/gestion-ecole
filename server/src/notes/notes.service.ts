import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './note.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Classe } from '../classes/classe.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';
import { MatieresService } from '../matieres/matieres.service';
import { PeriodesService } from '../periodes/periodes.service';
import { AuthCtx } from '../read/read.service';

export interface BulletinMatiere {
  matiere_id: string;
  matiere_nom: string;
  code: string;
  coefficient: number;
  ds: number | null;
  evaluation: number | null;
  moyenne: number;
}

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
    private readonly periodesService: PeriodesService,
  ) {}

  findAll() { return this.noteModel.find({ annulee: { $ne: true } }).exec(); }
  findById(id: string) { return this.noteModel.findById(id).exec(); }
  findByEleveId(eleveId: string) { return this.noteModel.find({ eleve_id: eleveId, annulee: { $ne: true } }).exec(); }

  /**
   * Pour un professeur : vérifie que le couple (classe active de l'élève, matière)
   * fait partie de ses affectations. Admin/secrétaire : aucune restriction.
   */
  private async assertNoteScope(user: AuthCtx | undefined, eleveId: string, matiereId: string) {
    if (!user || user.role !== 'professeur') return;
    if (!user.professeur_id) throw new ForbiddenException('Compte professeur non lié à une fiche.');
    if (!eleveId || !matiereId || !/^[a-f0-9]{24}$/i.test(eleveId)) {
      throw new BadRequestException('Élève ou matière invalide.');
    }
    const eleve = await this.eleveModel.findById(eleveId).lean().exec() as any;
    const classeId = eleve?.inscriptions?.find((i: any) => i.status === 'active')?.classeId;
    if (!classeId) throw new ForbiddenException('Élève hors de votre périmètre.');
    const ok = await this.assignmentModel.exists({
      professeur_id: user.professeur_id,
      classe_id: classeId,
      matiere_id: matiereId,
    });
    if (!ok) throw new ForbiddenException('Couple (classe, matière) hors de votre périmètre.');
  }

  async create(data: any, user?: AuthCtx) {
    if (data.valeur !== undefined && (data.valeur < 0 || data.valeur > 20))
      throw new BadRequestException('La note doit être comprise entre 0 et 20.');

    await this.assertNoteScope(user, data.eleve_id, data.matiere_id);

    // Vérifier qu'une période est active et auto-tagger type + trimestre
    const periode = await this.periodesService.getActivePeriode();
    if (!periode) {
      throw new ForbiddenException('Aucune période de saisie active. La saisie est bloquée hors période.');
    }

    // Écraser type et trimestre avec les valeurs de la période active
    const noteData = {
      ...data,
      type: periode.type,
      trimestre: periode.trimestre,
    };

    return new this.noteModel(noteData).save();
  }

  async update(id: string, data: any, user?: AuthCtx) {
    if (data.valeur !== undefined && (data.valeur < 0 || data.valeur > 20))
      throw new BadRequestException('La note doit être comprise entre 0 et 20.');
    if (user?.role === 'professeur') {
      const note = await this.noteModel.findById(id).lean().exec() as any;
      if (!note) return null;
      await this.assertNoteScope(user, note.eleve_id, data.matiere_id ?? note.matiere_id);
    }
    return this.noteModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async annuler(id: string, user?: AuthCtx) {
    if (user?.role === 'professeur') {
      const note = await this.noteModel.findById(id).lean().exec() as any;
      if (!note) return false;
      await this.assertNoteScope(user, note.eleve_id, note.matiere_id);
    }
    const result = await this.noteModel.findByIdAndUpdate(id, { annulee: true }, { new: true }).exec();
    return !!result;
  }

  async getBulletin(eleveId: string, trimestre: number): Promise<BulletinMatiere[]> {
    const [eleveNotes, eleve] = await Promise.all([
      this.noteModel.find({ eleve_id: eleveId, trimestre, annulee: { $ne: true } }).lean().exec(),
      this.eleveModel.findById(eleveId).lean().exec() as any,
    ]);

    const matiereIds = [...new Set(eleveNotes.map((n: any) => n.matiere_id))];
    const [classe, matieres] = await Promise.all([
      eleve?.classe_id ? this.classeModel.findById(eleve.classe_id).lean().exec() : Promise.resolve(null),
      matiereIds.length > 0
        ? this.matiereModel.find({ _id: { $in: matiereIds } }).lean().exec()
        : Promise.resolve([]),
    ]);

    const niveauClasse: string | undefined = (classe as any)?.niveau;
    const matiereMap = new Map((matieres as any[]).map((m: any) => [m._id.toString(), m]));

    const map = new Map<string, { ds: number | null; evaluation: number | null }>();
    for (const n of eleveNotes as any[]) {
      const mid = n.matiere_id;
      if (!map.has(mid)) map.set(mid, { ds: null, evaluation: null });
      const entry = map.get(mid)!;
      if (n.type === 'ds') entry.ds = n.valeur;
      else if (n.type === 'evaluation') entry.evaluation = n.valeur;
    }

    const result: BulletinMatiere[] = [];
    for (const [matiereId, vals] of map) {
      const mat = matiereMap.get(matiereId);
      if (!mat) continue;
      const coefficient = MatieresService.resolveCoefficient(mat, niveauClasse);
      const rawVals = [vals.ds, vals.evaluation].filter(v => v !== null) as number[];
      const moyenne = rawVals.length > 0 ? Math.round((rawVals.reduce((a, b) => a + b, 0) / rawVals.length) * 10) / 10 : 0;
      result.push({ matiere_id: matiereId, matiere_nom: mat.nom, code: mat.code, coefficient, ds: vals.ds, evaluation: vals.evaluation, moyenne });
    }

    return result;
  }
}
