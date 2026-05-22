import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './note.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Classe } from '../classes/classe.schema';
import { MatieresService } from '../matieres/matieres.service';

export interface BulletinMatiere {
  matiere_id: string;
  matiere_nom: string;
  code: string;
  coefficient: number;
  notes: number[];
  moyenne: number;
}

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
  ) {}

  findAll() { return this.noteModel.find({ annulee: { $ne: true } }).exec(); }
  findById(id: string) { return this.noteModel.findById(id).exec(); }
  findByEleveId(eleveId: string) { return this.noteModel.find({ eleve_id: eleveId, annulee: { $ne: true } }).exec(); }
  create(data: any) {
    if (data.valeur !== undefined && (data.valeur < 0 || data.valeur > 20))
      throw new BadRequestException('La note doit être comprise entre 0 et 20.');
    return new this.noteModel(data).save();
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
    const eleveNotes = await this.noteModel.find({ eleve_id: eleveId, trimestre, annulee: { $ne: true } }).exec();
    const matieres = await this.matiereModel.find().exec();

    // Récupérer le niveau de la classe de l'élève pour choisir le bon coefficient
    let niveauClasse: string | undefined;
    const eleve = await this.eleveModel.findById(eleveId).lean().exec() as any;
    if (eleve?.classe_id) {
      const classe = await this.classeModel.findById(eleve.classe_id).lean().exec() as any;
      niveauClasse = classe?.niveau;
    }

    const map = new Map<string, number[]>();
    for (const n of eleveNotes) {
      const mid = n.matiere_id;
      if (!map.has(mid)) map.set(mid, []);
      map.get(mid)!.push(n.valeur);
    }

    const result: BulletinMatiere[] = [];
    for (const [matiereId, vals] of map) {
      const mat = matieres.find(m => m._id.toString() === matiereId || (m as any).id === matiereId);
      if (!mat) continue;
      const moy = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      const coefficient = MatieresService.resolveCoefficient(mat, niveauClasse);
      result.push({
        matiere_id: matiereId,
        matiere_nom: mat.nom,
        code: mat.code,
        coefficient,
        notes: vals,
        moyenne: moy,
      });
    }

    return result;
  }
}
