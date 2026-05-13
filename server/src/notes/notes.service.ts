import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './note.schema';
import { Matiere } from '../matieres/matiere.schema';

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
  ) {}

  findAll() { return this.noteModel.find().exec(); }
  findById(id: string) { return this.noteModel.findById(id).exec(); }
  findByEleveId(eleveId: string) { return this.noteModel.find({ eleve_id: eleveId }).exec(); }
  create(data: any) { return new this.noteModel(data).save(); }

  async update(id: string, data: any) {
    return this.noteModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    const result = await this.noteModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async getBulletin(eleveId: string, trimestre: number): Promise<BulletinMatiere[]> {
    const eleveNotes = await this.noteModel.find({ eleve_id: eleveId, trimestre }).exec();
    const matieres = await this.matiereModel.find().exec();

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
      result.push({
        matiere_id: matiereId,
        matiere_nom: mat.nom,
        code: mat.code,
        coefficient: mat.coefficient,
        notes: vals,
        moyenne: moy,
      });
    }

    return result;
  }
}
