import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './note.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Classe } from '../classes/classe.schema';
import { MatieresService } from '../matieres/matieres.service';
import { PeriodesService } from '../periodes/periodes.service';

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
    private readonly periodesService: PeriodesService,
  ) {}

  findAll() { return this.noteModel.find({ annulee: { $ne: true } }).exec(); }
  findById(id: string) { return this.noteModel.findById(id).exec(); }
  findByEleveId(eleveId: string) { return this.noteModel.find({ eleve_id: eleveId, annulee: { $ne: true } }).exec(); }

  async create(data: any) {
    if (data.valeur !== undefined && (data.valeur < 0 || data.valeur > 20))
      throw new BadRequestException('La note doit être comprise entre 0 et 20.');

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

  async update(id: string, data: any) {
    if (data.valeur !== undefined && (data.valeur < 0 || data.valeur > 20))
      throw new BadRequestException('La note doit être comprise entre 0 et 20.');
    return this.noteModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async annuler(id: string) {
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
