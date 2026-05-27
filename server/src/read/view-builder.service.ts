import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Classe } from '../classes/classe.schema';
import { Eleve } from '../eleves/eleve.schema';
import { Matiere } from '../matieres/matiere.schema';
import { Note } from '../notes/note.schema';
import { Creneau } from '../planning/creneau.schema';
import { Salle } from '../salles/salle.schema';
import { Professeur } from '../professeurs/professeur.schema';
import { TeacherAssignment } from '../teacher-assignments/teacher-assignment.schema';
import { Evaluation } from '../evaluations/evaluation.schema';
import { ReadClasse } from './schemas/read-classe.schema';
import { ReadEleve } from './schemas/read-eleve.schema';
import { ReadMatiere } from './schemas/read-matiere.schema';
import { ReadNote } from './schemas/read-note.schema';
import { ReadCreneau } from './schemas/read-creneau.schema';
import { ReadSalle } from './schemas/read-salle.schema';
import { ReadEvaluation } from './schemas/read-evaluation.schema';

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
    @InjectModel(Professeur.name) private professeurModel: Model<Professeur>,
    @InjectModel(TeacherAssignment.name) private assignmentModel: Model<TeacherAssignment>,
    @InjectModel(ReadClasse.name) private readClasseModel: Model<ReadClasse>,
    @InjectModel(ReadEleve.name) private readEleveModel: Model<ReadEleve>,
    @InjectModel(ReadMatiere.name) private readMatiereModel: Model<ReadMatiere>,
    @InjectModel(ReadNote.name) private readNoteModel: Model<ReadNote>,
    @InjectModel(ReadCreneau.name) private readCreneauModel: Model<ReadCreneau>,
    @InjectModel(ReadSalle.name) private readSalleModel: Model<ReadSalle>,
    @InjectModel(Evaluation.name) private evaluationModel: Model<Evaluation>,
    @InjectModel(ReadEvaluation.name) private readEvaluationModel: Model<ReadEvaluation>,
  ) {}

  async onModuleInit() {
    await this.rebuildAll();
    this.tryChangeStreams();
  }

  private tryChangeStreams() {
    const collections = ['classes', 'eleves', 'matieres', 'notes', 'creneaux', 'salles', 'evaluations'];
    let ok = 0;
    for (const name of collections) {
      try {
        const stream = this.connection.collection(name).watch([], { fullDocument: 'updateLookup' });
        stream.on('change', (event: any) => {
          const docId = event.documentKey?._id?.toString();
          this.onWriteChange(name, docId);
        });
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

  async onClasseWrite(classeId?: string) {
    if (classeId) {
      const creneaux = await this.creneauModel.find({ classe_id: classeId }).lean().exec();
      await Promise.all([
        this.rebuildClasses(),
        ...creneaux.map((c: any) => this.rebuildSingleCreneau(c._id.toString())),
      ]);
    } else {
      await Promise.all([this.rebuildClasses(), this.rebuildEleves(), this.rebuildCreneaux()]);
    }
    this.logger.log(`Read sync: classe${classeId ? ` ${classeId}` : 's (full)'}`);
  }

  async onEleveWrite(eleveId?: string) {
    if (eleveId) {
      const eleve = await this.eleveModel.findById(eleveId).lean().exec();
      await this.rebuildSingleEleve(eleveId);
      if (eleve?.classe_id) await this.rebuildSingleClasseCount(eleve.classe_id);
    } else {
      await Promise.all([this.rebuildEleves(), this.rebuildClasses()]);
    }
    this.logger.log(`Read sync: eleve${eleveId ? ` ${eleveId}` : 's (full)'}`);
  }

  async onMatiereWrite() {
    await Promise.all([this.rebuildMatieres(), this.rebuildNotes()]);
    this.logger.log('Read sync: matieres + notes');
  }

  async onNoteWrite(noteId?: string) {
    if (noteId) {
      await this.rebuildSingleNote(noteId);
    } else {
      await this.rebuildNotes();
    }
    this.logger.log(`Read sync: note${noteId ? ` ${noteId}` : 's (full)'}`);
  }

  async onCreneauWrite(creneauId?: string) {
    if (creneauId) {
      await this.rebuildSingleCreneau(creneauId);
    } else {
      await this.rebuildCreneaux();
    }
    this.logger.log(`Read sync: creneau${creneauId ? ` ${creneauId}` : 'x (full)'}`);
  }

  async onSalleWrite() {
    await this.rebuildSalles();
    this.logger.log('Read sync: salles');
  }

  async onProfesseurWrite() {
    await this.rebuildCreneaux();
    this.logger.log('Read sync: creneaux (prof updated)');
  }

  async onAssignmentWrite() {
    await this.rebuildCreneaux();
    this.logger.log('Read sync: creneaux (assignment updated)');
  }

  async onNiveauWrite() {
    await this.rebuildMatieres();
    this.logger.log('Read sync: matieres (niveau updated)');
  }

  async onEvaluationWrite(evaluationId?: string) {
    if (evaluationId) {
      await this.rebuildSingleEvaluation(evaluationId);
    } else {
      await this.rebuildEvaluations();
    }
    this.logger.log(`Read sync: evaluation${evaluationId ? ` ${evaluationId}` : 's (full)'}`);
  }

  // ============ CHANGE STREAM HANDLER ============
  private pendingRebuild = new Map<string, NodeJS.Timeout>();

  private async onWriteChange(collection: string, docId?: string) {
    const key = `${collection}:${docId || 'full'}`;
    if (this.pendingRebuild.has(key)) clearTimeout(this.pendingRebuild.get(key)!);
    this.pendingRebuild.set(key, setTimeout(async () => {
      this.pendingRebuild.delete(key);
      try {
        switch (collection) {
          case 'classes': await this.onClasseWrite(docId); break;
          case 'eleves': await this.onEleveWrite(docId); break;
          case 'matieres': await this.onMatiereWrite(); break;
          case 'notes': await this.onNoteWrite(docId); break;
          case 'creneaux': await this.onCreneauWrite(docId); break;
          case 'salles': await this.onSalleWrite(); break;
          case 'evaluations': await this.onEvaluationWrite(docId); break;
        }
      } catch (e: any) {
        this.logger.error(`ChangeStream rebuild error: ${e.message}`);
      }
    }, 150));
  }

  // ============ REBUILD CIBLÉ ============

  private async rebuildSingleEleve(eleveId: string) {
    const eleve = await this.eleveModel.findById(eleveId).lean().exec();
    if (!eleve) {
      await this.readEleveModel.deleteMany({ source_id: eleveId }).exec();
      return;
    }
    const classe = eleve.classe_id
      ? await this.classeModel.findById(eleve.classe_id).lean().exec()
      : null;

    const base = {
      nom: eleve.nom, prenom: eleve.prenom,
      date_naissance: eleve.date_naissance, genre: eleve.genre,
      email: (eleve as any).email || '', telephone: (eleve as any).telephone || '',
      adresse: (eleve as any).adresse || '',
      pere: (eleve as any).pere || null, mere: (eleve as any).mere || null,
      tuteur: (eleve as any).tuteur || null,
      statut: (eleve as any).statut || 'actif',
    };

    const ops: any[] = [];
    const historique = (eleve as any).historique_classes as any[] || [];

    for (const h of historique) {
      const hAnneeId = h.anneeScolaireId || '';
      ops.push({ updateOne: {
        filter: { source_id: eleveId, annee_scolaire: h.annee_scolaire },
        update: { $set: { source_id: eleveId, annee_scolaire: h.annee_scolaire,
          anneeScolaireId: hAnneeId,
          classe_id: h.classe_id, classe_nom: h.classe_nom || '', classe_niveau: h.niveau || '',
          ...base }},
        upsert: true,
      }});
    }

    const anneeActuelle = classe ? (classe as any).annee_scolaire || '' : '';
    const anneeActuelleId = classe ? (classe as any).anneeScolaireId || '' : '';
    const dejaDansHistorique = historique.some((h: any) => h.annee_scolaire === anneeActuelle);
    if (!dejaDansHistorique) {
      ops.push({ updateOne: {
        filter: { source_id: eleveId, annee_scolaire: anneeActuelle },
        update: { $set: { source_id: eleveId, annee_scolaire: anneeActuelle,
          anneeScolaireId: anneeActuelleId,
          classe_id: eleve.classe_id, classe_nom: classe?.nom || '',
          classe_niveau: (classe as any)?.niveau || '',
          ...base }},
        upsert: true,
      }});
    }

    if (ops.length > 0) await this.readEleveModel.bulkWrite(ops);
  }

  private async rebuildSingleClasseCount(classeId: string) {
    const [classe, nbEleves] = await Promise.all([
      this.classeModel.findById(classeId).lean().exec(),
      this.eleveModel.countDocuments({ classe_id: classeId }).exec(),
    ]);
    if (!classe) return;
    await this.readClasseModel.updateOne(
      { source_id: classeId },
      { $set: { nb_eleves: nbEleves,
        taux: (classe as any).capacite > 0
          ? Math.min(Math.round((nbEleves / (classe as any).capacite) * 100), 100)
          : 0 }},
      { upsert: false },
    ).exec();
  }

  private async rebuildSingleNote(noteId: string) {
    const note = await this.noteModel.findById(noteId).lean().exec();
    if (!note) {
      await this.readNoteModel.deleteOne({ source_id: noteId }).exec();
      return;
    }
    if ((note as any).annulee) {
      await this.readNoteModel.deleteOne({ source_id: noteId }).exec();
      return;
    }
    const [eleve, mat] = await Promise.all([
      this.eleveModel.findById(note.eleve_id).lean().exec(),
      this.matiereModel.findById(note.matiere_id).lean().exec(),
    ]);
    await this.readNoteModel.updateOne(
      { source_id: noteId },
      { $set: {
        source_id: noteId,
        eleve_id: note.eleve_id, matiere_id: note.matiere_id,
        valeur: note.valeur, trimestre: note.trimestre,
        type: (note as any).type ?? null,
        date: note.date, commentaire: note.commentaire || '',
        eleve_nom: eleve?.nom || '', eleve_prenom: eleve?.prenom || '',
        matiere_nom: mat?.nom || '', matiere_code: mat?.code || '',
        annee_scolaire: (note as any).annee_scolaire || '',
        anneeScolaireId: (note as any).anneeScolaireId || '',
      }},
      { upsert: true },
    ).exec();
  }

  private async rebuildSingleCreneau(creneauId: string) {
    const creneau = await this.creneauModel.findById(creneauId).lean().exec();
    if (!creneau) {
      await this.readCreneauModel.deleteOne({ source_id: creneauId }).exec();
      return;
    }
    const [classe, assignment] = await Promise.all([
      this.classeModel.findById(creneau.classe_id).lean().exec(),
      this.assignmentModel.findOne({
        classe_id: creneau.classe_id,
        matiere_id: creneau.matiere_id,
      }).lean().exec(),
    ]);
    const profId = (assignment as any)?.professeur_id || '';
    const prof = profId
      ? await this.professeurModel.findById(profId).lean().exec()
      : null;

    await this.readCreneauModel.updateOne(
      { source_id: creneauId },
      { $set: {
        source_id: creneauId,
        classe_id: creneau.classe_id,
        matiere_id: creneau.matiere_id,
        matiere_nom: creneau.matiere_nom,
        matiere_couleur: creneau.matiere_couleur,
        jour: creneau.jour,
        heure_debut: creneau.heure_debut,
        heure_fin: creneau.heure_fin,
        salle: creneau.salle,
        professeur_id: profId,
        professeur_nom: prof ? `${(prof as any).prenom} ${(prof as any).nom}` : '',
        classe_nom: classe?.nom || '',
      }},
      { upsert: true },
    ).exec();
  }

  private async rebuildSingleEvaluation(evaluationId: string) {
    const evaluation = await this.evaluationModel.findById(evaluationId).lean().exec();
    if (!evaluation) {
      await this.readEvaluationModel.deleteOne({ source_id: evaluationId }).exec();
      return;
    }
    const ev = evaluation as any;
    const [classe, matiere] = await Promise.all([
      this.classeModel.findById(ev.classe_id).lean().exec(),
      this.matiereModel.findById(ev.matiere_id).lean().exec(),
    ]);

    const eleveIds = (ev.notes || []).map((n: any) => n.eleve_id);
    const eleves = eleveIds.length > 0
      ? await this.eleveModel.find({ _id: { $in: eleveIds } }).lean().exec()
      : [];
    const em = new Map(eleves.map((e: any) => [e._id.toString(), e]));

    const notesEnrichies = (ev.notes || []).map((n: any) => {
      const eleve = em.get(n.eleve_id);
      return { eleve_id: n.eleve_id, eleve_nom: eleve?.nom || '',
        eleve_prenom: eleve?.prenom || '', valeur: n.valeur ?? null, absent: n.absent ?? false };
    });
    const notesSaisies = notesEnrichies.filter((n: any) => !n.absent && n.valeur !== null);
    const moyenne_classe = notesSaisies.length > 0
      ? Math.round((notesSaisies.reduce((acc: number, n: any) => acc + n.valeur, 0) / notesSaisies.length) * 10) / 10
      : null;

    await this.readEvaluationModel.updateOne(
      { source_id: evaluationId },
      { $set: {
        source_id: evaluationId, type: ev.type,
        classe_id: ev.classe_id, classe_nom: classe?.nom || '',
        classe_niveau: (classe as any)?.niveau || '',
        matiere_id: ev.matiere_id, matiere_nom: matiere?.nom || '',
        matiere_code: matiere?.code || '',
        trimestre: ev.trimestre, annee_scolaire: ev.annee_scolaire,
        anneeScolaireId: ev.anneeScolaireId || '',
        date: ev.date, statut: ev.statut,
        notes: notesEnrichies,
        nb_notes_saisies: notesSaisies.length,
        nb_eleves: notesEnrichies.length,
        moyenne_classe,
      }},
      { upsert: true },
    ).exec();
  }

  // ============ FULL REBUILD ============
  async rebuildAll() {
    const t = Date.now();
    await Promise.all([
      this.rebuildClasses(), this.rebuildEleves(), this.rebuildMatieres(),
      this.rebuildNotes(), this.rebuildCreneaux(), this.rebuildSalles(),
      this.rebuildEvaluations(),
    ]);
    this.logger.log(`Read models reconstruits en ${Date.now() - t}ms`);
  }

  // ============ PROJECTIONS INDIVIDUELLES ============

  private async rebuildClasses() {
    const [classes, eleves] = await Promise.all([
      this.classeModel.find({ actif: { $ne: false } }).lean().exec(),
      this.eleveModel.find().lean().exec(),
    ]);
    const ops = classes.map(c => {
      const sid = c._id.toString();
      const nb = eleves.filter(e => e.classe_id === sid).length;
      return { updateOne: { filter: { source_id: sid }, update: { $set: {
        source_id: sid, nom: c.nom, niveau: c.niveau, annee_scolaire: (c as any).annee_scolaire,
        anneeScolaireId: (c as any).anneeScolaireId || '',
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

    const ops: any[] = [];

    for (const e of eleves) {
      const sid = e._id.toString();
      const base = {
        nom: e.nom, prenom: e.prenom, date_naissance: e.date_naissance,
        genre: e.genre, email: e.email || '', telephone: e.telephone || '', adresse: e.adresse || '',
        pere: (e as any).pere || null, mere: (e as any).mere || null, tuteur: (e as any).tuteur || null,
        statut: (e as any).statut || 'actif',
      };

      // Entrée pour chaque année via historique_classes
      const historique = (e as any).historique_classes as any[] || [];
      for (const h of historique) {
        const hAnneeId = h.anneeScolaireId || '';
        ops.push({ updateOne: {
          filter: { source_id: sid, annee_scolaire: h.annee_scolaire },
          update: { $set: {
            source_id: sid, annee_scolaire: h.annee_scolaire,
            anneeScolaireId: hAnneeId,
            classe_id: h.classe_id, classe_nom: h.classe_nom || '', classe_niveau: h.niveau || '',
            ...base,
          }},
          upsert: true,
        }});
      }

      // Entrée pour l'année courante (classe_id actuelle)
      const cl = cm.get(e.classe_id);
      const anneeActuelle = cl ? (cl as any).annee_scolaire || '' : '';
      const anneeActuelleId = cl ? (cl as any).anneeScolaireId || '' : '';
      const dejaDansHistorique = historique.some((h: any) => h.annee_scolaire === anneeActuelle);
      if (!dejaDansHistorique) {
        ops.push({ updateOne: {
          filter: { source_id: sid, annee_scolaire: anneeActuelle },
          update: { $set: {
            source_id: sid, annee_scolaire: anneeActuelle,
            anneeScolaireId: anneeActuelleId,
            classe_id: e.classe_id, classe_nom: cl?.nom || '', classe_niveau: (cl as any)?.niveau || '',
            ...base,
          }},
          upsert: true,
        }});
      }
    }

    // Supprimer les entrées pour des élèves supprimés
    const ids = eleves.map(e => e._id.toString());
    await this.readEleveModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readEleveModel.bulkWrite(ops);
  }

  private async rebuildMatieres() {
    const matieres = await this.matiereModel.find({ actif: { $ne: false } }).lean().exec();
    const ops = matieres.map(m => ({ updateOne: { filter: { source_id: m._id.toString() }, update: { $set: {
      source_id: m._id.toString(), nom: m.nom, code: m.code, coefficient: (m as any).coefficient ?? 1,
      coefficients: (m as any).coefficients || [],
      description: (m as any).description || '', couleur: (m as any).couleur || '',
    }}, upsert: true }}));
    const ids = matieres.map(m => m._id.toString());
    await this.readMatiereModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readMatiereModel.bulkWrite(ops);
  }

  private async rebuildNotes() {
    const [notes, eleves, matieres] = await Promise.all([
      this.noteModel.find({ annulee: { $ne: true } }).lean().exec(),
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
        valeur: n.valeur, trimestre: n.trimestre, type: (n as any).type ?? null,
        date: n.date, commentaire: n.commentaire || '',
        eleve_nom: el?.nom || '', eleve_prenom: el?.prenom || '',
        matiere_nom: mat?.nom || '', matiere_code: mat?.code || '',
        annee_scolaire: (n as any).annee_scolaire || '',
        anneeScolaireId: (n as any).anneeScolaireId || '',
      }}, upsert: true }};
    });
    const ids = notes.map(n => n._id.toString());
    await this.readNoteModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readNoteModel.bulkWrite(ops);
  }

  private async rebuildCreneaux() {
    const [creneaux, classes, assignments, professeurs] = await Promise.all([
      this.creneauModel.find().lean().exec(),
      this.classeModel.find().lean().exec(),
      this.assignmentModel.find().lean().exec(),
      this.professeurModel.find().lean().exec(),
    ]);

    const cm = new Map(classes.map(c => [c._id.toString(), c]));
    const pm = new Map(professeurs.map(p => [p._id.toString(), p]));
    const am = new Map((assignments as any[]).map(a => [`${a.classe_id}::${a.matiere_id}`, a.professeur_id]));

    const ops = creneaux.map(c => {
      const sid = c._id.toString();
      const cl = cm.get(c.classe_id);
      const profId = am.get(`${c.classe_id}::${c.matiere_id}`) || '';
      const prof = profId ? (pm.get(profId) as any) : null;
      const profNom = prof ? `${prof.prenom} ${prof.nom}` : '';

      return { updateOne: { filter: { source_id: sid }, update: { $set: {
        source_id: sid,
        classe_id: c.classe_id,
        matiere_id: c.matiere_id,
        matiere_nom: c.matiere_nom,
        matiere_couleur: c.matiere_couleur,
        jour: c.jour,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        salle: c.salle,
        professeur_id: profId,
        professeur_nom: profNom,
        classe_nom: cl?.nom || '',
      }}, upsert: true }};
    });

    const ids = creneaux.map(c => c._id.toString());
    await this.readCreneauModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readCreneauModel.bulkWrite(ops);
  }

  private async rebuildSalles() {
    const salles = await this.salleModel.find({ actif: { $ne: false } }).lean().exec();
    const ops = salles.map(s => ({ updateOne: { filter: { source_id: s._id.toString() }, update: { $set: {
      source_id: s._id.toString(),
      nom: s.nom,
      capacite: s.capacite,
      description: s.description || '',
      type: s.type,
      equipements: (s as any).equipements || [],
      accessible_pmr: (s as any).accessible_pmr || false,
      batiment: (s as any).batiment || '',
      etage: (s as any).etage || '',
    }}, upsert: true }}));
    const ids = salles.map(s => s._id.toString());
    await this.readSalleModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readSalleModel.bulkWrite(ops);
  }

  private async rebuildEvaluations() {
    const [evaluations, classes, matieres, eleves] = await Promise.all([
      this.evaluationModel.find().lean().exec(),
      this.classeModel.find().lean().exec(),
      this.matiereModel.find().lean().exec(),
      this.eleveModel.find().lean().exec(),
    ]);

    const cm = new Map(classes.map(c => [c._id.toString(), c]));
    const mm = new Map(matieres.map(m => [m._id.toString(), m]));
    const em = new Map(eleves.map(e => [e._id.toString(), e]));

    const ops = (evaluations as any[]).map(ev => {
      const sid = ev._id.toString();
      const classe = cm.get(ev.classe_id);
      const matiere = mm.get(ev.matiere_id);

      const notesEnrichies = (ev.notes || []).map((n: any) => {
        const eleve = em.get(n.eleve_id);
        return {
          eleve_id: n.eleve_id,
          eleve_nom: eleve?.nom || '',
          eleve_prenom: eleve?.prenom || '',
          valeur: n.valeur ?? null,
          absent: n.absent ?? false,
        };
      });

      const notesSaisies = notesEnrichies.filter((n: any) => !n.absent && n.valeur !== null);
      const nb_notes_saisies = notesSaisies.length;
      const nb_eleves = notesEnrichies.length;
      const moyenne_classe = nb_notes_saisies > 0
        ? Math.round((notesSaisies.reduce((acc: number, n: any) => acc + n.valeur, 0) / nb_notes_saisies) * 10) / 10
        : null;

      return {
        updateOne: {
          filter: { source_id: sid },
          update: {
            $set: {
              source_id: sid,
              type: ev.type,
              classe_id: ev.classe_id,
              classe_nom: classe?.nom || '',
              classe_niveau: (classe as any)?.niveau || '',
              matiere_id: ev.matiere_id,
              matiere_nom: matiere?.nom || '',
              matiere_code: matiere?.code || '',
              trimestre: ev.trimestre,
              annee_scolaire: ev.annee_scolaire,
              anneeScolaireId: ev.anneeScolaireId || '',
              date: ev.date,
              statut: ev.statut,
              notes: notesEnrichies,
              nb_notes_saisies,
              nb_eleves,
              moyenne_classe,
            },
          },
          upsert: true,
        },
      };
    });

    const ids = (evaluations as any[]).map(ev => ev._id.toString());
    await this.readEvaluationModel.deleteMany({ source_id: { $nin: ids } }).exec();
    if (ops.length > 0) await this.readEvaluationModel.bulkWrite(ops);
  }
}
