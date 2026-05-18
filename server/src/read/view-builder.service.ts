import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Classe } from '../classes/classe.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { Salle } from '../salles/salle.schema';
import { ReadClasse } from './schemas/read-classe.schema';
import { ReadEleve } from './schemas/read-eleve.schema';
import { ReadMatiere } from './schemas/read-matiere.schema';
import { ReadNote } from './schemas/read-note.schema';
import { ReadCreneau } from './schemas/read-creneau.schema';
import { ReadSalle } from './schemas/read-salle.schema';

@Injectable()
export class ViewBuilderService implements OnModuleInit {
  private readonly logger = new Logger('ViewBuilder');
  private hasChangeStreams = false;

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Classe.name) private classeModel: Model<Classe>,
    @InjectModel(Eleve.name) private eleveModel: Model<Eleve>,
    @InjectModel(Matiere.name) private matiereModel: Model<Matiere>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Creneau.name) private creneauModel: Model<Creneau>,
    @InjectModel(Salle.name) private salleModel: Model<Salle>,
    @InjectModel(ReadClasse.name) private readClasseModel: Model<ReadClasse>,
    @InjectModel(ReadEleve.name) private readEleveModel: Model<ReadEleve>,
    @InjectModel(ReadMatiere.name) private readMatiereModel: Model<ReadMatiere>,
    @InjectModel(ReadNote.name) private readNoteModel: Model<ReadNote>,
    @InjectModel(ReadCreneau.name) private readCreneauModel: Model<ReadCreneau>,
    @InjectModel(ReadSalle.name) private readSalleModel: Model<ReadSalle>,
  ) {}

  async onModuleInit() {
    await this.rebuildAll();
    this.tryChangeStreams();
  }

  private tryChangeStreams() {
    const collections = ['classes', 'eleves', 'matieres', 'notes', 'creneaux', 'salles'];
    let ok = 0;
    for (const name of collections) {
      try {
        const stream = this.connection.collection(name).watch([], { fullDocument: 'updateLookup' });
        stream.on('change', () => this.onWriteChange(name));
        stream.on('error', () => {});
        ok++;
      } catch {
        // Standalone MongoDB — pas de Change Streams
      }
    }
    if (ok > 0) {
      this.hasChangeStreams = true;
      this.logger.log(`Change Streams actifs (${ok} collections)`);
    } else {
      this.logger.log('MongoDB standalone détecté — synchronisation via write controllers');
    }
  }

  // ============ API PUBLIQUE — appelée par les write controllers ============

  /** Appelé après POST/PATCH/DELETE sur la collection classes */
  async onClasseWrite() {
    await Promise.all([this.rebuildClasses(), this.rebuildEleves(), this.rebuildCreneaux()]);
    this.logger.log('Read sync: classes + eleves + creneaux');
  }

  /** Appelé après POST/PATCH/DELETE sur la collection eleves */
  async onEleveWrite() {
    await Promise.all([this.rebuildEleves(), this.rebuildClasses()]);
    this.logger.log('Read sync: eleves + classes');
  }

  /** Appelé après POST/PATCH/DELETE sur la collection matieres */
  async onMatiereWrite() {
    await Promise.all([this.rebuildMatieres(), this.rebuildNotes()]);
    this.logger.log('Read sync: matieres + notes');
  }

  /** Appelé après POST/PATCH/DELETE sur la collection notes */
  async onNoteWrite() {
    await this.rebuildNotes();
    this.logger.log('Read sync: notes');
  }

  /** Appelé après POST/PATCH/DELETE sur la collection creneaux */
  async onCreneauWrite() {
    await this.rebuildCreneaux();
    this.logger.log('Read sync: creneaux');
  }

  /** Appelé après POST/PATCH/DELETE sur la collection salles */
  async onSalleWrite() {
    await this.rebuildSalles();
    this.logger.log('Read sync: salles');
  }

  // ============ CHANGE STREAM HANDLER (bonus replica set) ============
  private async onWriteChange(collection: string) {
    // Si les Change Streams fonctionnent, on les utilise aussi
    // mais les write controllers appellent déjà la synchro — double safety
    try {
      switch (collection) {
        case 'classes': await this.onClasseWrite(); break;
        case 'eleves': await this.onEleveWrite(); break;
        case 'matieres': await this.onMatiereWrite(); break;
        case 'notes': await this.onNoteWrite(); break;
        case 'creneaux': await this.onCreneauWrite(); break;
        case 'salles': await this.onSalleWrite(); break;
      }
    } catch (e: any) {
      this.logger.error(`ChangeStream rebuild error: ${e.message}`);
    }
  }

  // ============ FULL REBUILD ============
  async rebuildAll() {
    const t = Date.now();
    await Promise.all([
      this.rebuildClasses(), this.rebuildEleves(), this.rebuildMatieres(),
      this.rebuildNotes(), this.rebuildCreneaux(), this.rebuildSalles(),
    ]);
    this.logger.log(`Read models reconstruits en ${Date.now() - t}ms`);
  }

  // ============ PROJECTIONS INDIVIDUELLES ============

  private async rebuildClasses() {
    const [classes, eleves] = await Promise.all([
      this.classeModel.find().lean().exec(),
      this.eleveModel.find().lean().exec(),
    ]);
    const ops = classes.map(c => {
      const sid = c._id.toString();
      const nb = eleves.filter(e => e.classe_id === sid).length;
      return { updateOne: { filter: { source_id: sid }, update: { $set: {
        source_id: sid, nom: c.nom, niveau: c.niveau, annee_scolaire: c.annee_scolaire,
        capacite: c.capacite, salle: c.salle, salle_type: c.salle_type,
        nb_eleves: nb, taux: c.capacite > 0 ? Math.min(Math.round((nb / c.capacite) * 100), 100) : 0,
      }}, upsert: true }};
    });
    const ids = classes.map(c => c._id.toString());
    await this.readClasseModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readClasseModel.bulkWrite(ops);
  }

  private async rebuildEleves() {
    const [eleves, classes] = await Promise.all([
      this.eleveModel.find().lean().exec(),
      this.classeModel.find().lean().exec(),
    ]);
    const cm = new Map(classes.map(c => [c._id.toString(), c]));
    const ops = eleves.map(e => {
      const sid = e._id.toString();
      const cl = cm.get(e.classe_id);
      return { updateOne: { filter: { source_id: sid }, update: { $set: {
        source_id: sid, nom: e.nom, prenom: e.prenom, date_naissance: e.date_naissance,
        genre: e.genre, classe_id: e.classe_id, email: e.email || '', telephone: e.telephone || '', adresse: e.adresse || '',
        classe_nom: cl?.nom || '', classe_niveau: cl?.niveau || '',
        pere: (e as any).pere || null, mere: (e as any).mere || null, tuteur: (e as any).tuteur || null,
      }}, upsert: true }};
    });
    const ids = eleves.map(e => e._id.toString());
    await this.readEleveModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readEleveModel.bulkWrite(ops);
  }

  private async rebuildMatieres() {
    const matieres = await this.matiereModel.find().lean().exec();
    const ops = matieres.map(m => ({ updateOne: { filter: { source_id: m._id.toString() }, update: { $set: {
      source_id: m._id.toString(), nom: m.nom, code: m.code, coefficient: m.coefficient,
      description: m.description || '', couleur: m.couleur || '',
    }}, upsert: true }}));
    const ids = matieres.map(m => m._id.toString());
    await this.readMatiereModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readMatiereModel.bulkWrite(ops);
  }

  private async rebuildNotes() {
    const [notes, eleves, matieres] = await Promise.all([
      this.noteModel.find().lean().exec(),
      this.eleveModel.find().lean().exec(),
      this.matiereModel.find().lean().exec(),
    ]);
    const em = new Map(eleves.map(e => [e._id.toString(), e]));
    const mm = new Map(matieres.map(m => [m._id.toString(), m]));
    const ops = notes.map(n => {
      const sid = n._id.toString();
      const el = em.get(n.eleve_id); const mat = mm.get(n.matiere_id);
      return { updateOne: { filter: { source_id: sid }, update: { $set: {
        source_id: sid, eleve_id: n.eleve_id, matiere_id: n.matiere_id,
        valeur: n.valeur, trimestre: n.trimestre, date: n.date, commentaire: n.commentaire || '',
        eleve_nom: el?.nom || '', eleve_prenom: el?.prenom || '',
        matiere_nom: mat?.nom || '', matiere_code: mat?.code || '',
      }}, upsert: true }};
    });
    const ids = notes.map(n => n._id.toString());
    await this.readNoteModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readNoteModel.bulkWrite(ops);
  }

  private async rebuildCreneaux() {
    const [creneaux, classes] = await Promise.all([
      this.creneauModel.find().lean().exec(),
      this.classeModel.find().lean().exec(),
    ]);
    const cm = new Map(classes.map(c => [c._id.toString(), c]));
    const ops = creneaux.map(c => {
      const sid = c._id.toString(); const cl = cm.get(c.classe_id);
      return { updateOne: { filter: { source_id: sid }, update: { $set: {
        source_id: sid, classe_id: c.classe_id, matiere_id: c.matiere_id,
        matiere_nom: c.matiere_nom, matiere_couleur: c.matiere_couleur,
        jour: c.jour, heure_debut: c.heure_debut, heure_fin: c.heure_fin,
        salle: c.salle, enseignant: c.enseignant || '', classe_nom: cl?.nom || '',
      }}, upsert: true }};
    });
    const ids = creneaux.map(c => c._id.toString());
    await this.readCreneauModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readCreneauModel.bulkWrite(ops);
  }

  private async rebuildSalles() {
    const salles = await this.salleModel.find().lean().exec();
    const ops = salles.map(s => ({ updateOne: { filter: { source_id: s._id.toString() }, update: { $set: {
      source_id: s._id.toString(), nom: s.nom, capacite: s.capacite, description: s.description || '', type: s.type,
    }}, upsert: true }}));
    const ids = salles.map(s => s._id.toString());
    await this.readSalleModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readSalleModel.bulkWrite(ops);
  }
}
