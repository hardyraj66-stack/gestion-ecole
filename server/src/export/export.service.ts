import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReadClasse } from '../read/schemas/read-classe.schema';
import { ReadEleve } from '../read/schemas/read-eleve.schema';
import { ReadMatiere } from '../read/schemas/read-matiere.schema';
import { ReadNote } from '../read/schemas/read-note.schema';
import { ReadSalle } from '../read/schemas/read-salle.schema';
import { ReadEvaluation } from '../read/schemas/read-evaluation.schema';
import { Professeur } from '../professeurs/professeur.schema';
import { AnneeScolaire } from '../annees/annee.schema';
import { Niveau } from '../niveaux/niveau.schema';

// ─── Helpers CSV / XLSX ───────────────────────────────────────────────────────

function esc(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(esc).join(',')).join('\r\n');
}

function toXlsx(rows: any[][], sheetName = 'Données'): Buffer {
  const xmlRows = rows.map((r, ri) =>
    `<Row ss:Index="${ri + 1}">${r.map((c) => {
      const s = c === null || c === undefined ? '' : String(c);
      const num = s !== '' && !isNaN(Number(s)) && s.trim() !== '';
      return `<Cell><Data ss:Type="${num ? 'Number' : 'String'}">${xmlEsc(s)}</Data></Cell>`;
    }).join('')}</Row>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#1e40af" ss:Pattern="Solid"/><Font ss:Color="#ffffff" ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="${xmlEsc(sheetName)}">
  <Table>
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;
  return Buffer.from(xml, 'utf-8');
}

function xmlEsc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(d: string | undefined | null): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ExportService {
  constructor(
    @InjectModel(ReadClasse.name) private classeModel: Model<ReadClasse>,
    @InjectModel(ReadEleve.name) private eleveModel: Model<ReadEleve>,
    @InjectModel(ReadMatiere.name) private matiereModel: Model<ReadMatiere>,
    @InjectModel(ReadNote.name) private noteModel: Model<ReadNote>,
    @InjectModel(ReadSalle.name) private salleModel: Model<ReadSalle>,
    @InjectModel(ReadEvaluation.name) private evaluationModel: Model<ReadEvaluation>,
    @InjectModel(Professeur.name) private professeurModel: Model<Professeur>,
    @InjectModel(AnneeScolaire.name) private anneeModel: Model<AnneeScolaire>,
    @InjectModel(Niveau.name) private niveauModel: Model<Niveau>,
  ) {}

  private async anneeLabel(): Promise<string | null> {
    const a = await this.anneeModel.findOne({ statut: 'active' }).exec();
    return a?.label ?? null;
  }

  private async anneeActiveId(): Promise<string | null> {
    const a = await this.anneeModel.findOne({ statut: 'active' }).exec();
    return a ? (a as any)._id.toString() : null;
  }

  // ─── ÉLÈVES ───────────────────────────────────────────────────────────────

  async elevesData(classeId?: string, search?: string) {
    const filter: any = {};
    if (classeId) filter.classe_id = classeId;
    if (search) {
      const tokens = search.trim().split(/\s+/);
      if (tokens.length >= 2) {
        filter.$and = tokens.map(t => ({ $or: [{ nom: { $regex: t, $options: 'i' } }, { prenom: { $regex: t, $options: 'i' } }] }));
      } else {
        filter.$or = [{ nom: { $regex: search, $options: 'i' } }, { prenom: { $regex: search, $options: 'i' } }];
      }
    }
    const eleves = await this.eleveModel.find(filter).sort({ nom: 1, prenom: 1 }).exec();

    const classeIds = [...new Set(eleves.map(e => (e as any).classe_id))];
    const classes = await this.classeModel.find({ source_id: { $in: classeIds } }).exec();
    const classeMap = new Map(classes.map(c => [c.source_id, c.nom]));

    return eleves.map(e => {
      const ej = e.toJSON() as any;
      return {
        Nom: ej.nom,
        Prénom: ej.prenom,
        Genre: ej.genre === 'M' ? 'Garçon' : 'Fille',
        'Date de naissance': fmt(ej.date_naissance),
        Classe: classeMap.get(ej.classe_id) || '—',
        Email: ej.email || '—',
        Téléphone: ej.telephone || '—',
        Adresse: ej.adresse || '—',
        Statut: ej.statut || 'actif',
      };
    });
  }

  async elevesCsv(classeId?: string, search?: string): Promise<string> {
    const rows = await this.elevesData(classeId, search);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async elevesXlsx(classeId?: string, search?: string): Promise<Buffer> {
    const rows = await this.elevesData(classeId, search);
    if (!rows.length) return toXlsx([['Aucun résultat']], 'Élèves');
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], 'Élèves');
  }

  // ─── CLASSES ──────────────────────────────────────────────────────────────

  async classesData(niveau?: string) {
    const anneeId = await this.anneeActiveId();
    const filter: any = anneeId ? { anneeScolaireId: anneeId } : {};
    if (niveau) filter.niveau = niveau;
    const items = await this.classeModel.find(filter).sort({ nom: 1 }).exec();
    return items.map(c => {
      const j = c.toJSON() as any;
      return {
        Nom: j.nom,
        Niveau: j.niveau || '—',
        'Année scolaire': j.annee_scolaire || '—',
        Capacité: j.capacite ?? '—',
        'Nb élèves': j.nb_eleves ?? '—',
        'Type de salle': j.salle_type === 'fixe' ? 'Fixe' : 'Variable',
        Salle: j.salle || '—',
      };
    });
  }

  async classesCsv(niveau?: string): Promise<string> {
    const rows = await this.classesData(niveau);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async classesXlsx(niveau?: string): Promise<Buffer> {
    const rows = await this.classesData(niveau);
    if (!rows.length) return toXlsx([['Aucun résultat']], 'Classes');
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], 'Classes');
  }

  // ─── MATIÈRES ─────────────────────────────────────────────────────────────

  async matieresData(niveau?: string) {
    const filter: any = {};
    if (niveau) filter['coefficients.niveau'] = niveau;
    const items = await this.matiereModel.find(filter).sort({ nom: 1 }).exec();
    return items.map(m => {
      const j = m.toJSON() as any;
      const coeffs: Array<{ niveau: string; coefficient: number }> = j.coefficients || [];
      return {
        Nom: j.nom,
        Code: j.code || '—',
        'Coefficients par niveau': coeffs.map((c: any) => `${c.niveau}: ${c.coefficient}`).join(' | ') || '—',
      };
    });
  }

  async matieresCsv(niveau?: string): Promise<string> {
    const rows = await this.matieresData(niveau);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async matieresXlsx(niveau?: string): Promise<Buffer> {
    const rows = await this.matieresData(niveau);
    if (!rows.length) return toXlsx([['Aucun résultat']], 'Matières');
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], 'Matières');
  }

  // ─── SALLES ───────────────────────────────────────────────────────────────

  async sallesData(type?: string) {
    const filter: any = {};
    if (type) filter.type = type;
    const items = await this.salleModel.find(filter).sort({ nom: 1 }).exec();
    return items.map(s => {
      const j = s.toJSON() as any;
      return {
        Nom: j.nom,
        Type: j.type === 'fixe' ? 'Fixe' : 'Variable',
        Capacité: j.capacite ?? '—',
        Équipements: (j.equipements || []).join(', ') || '—',
      };
    });
  }

  async sallesCsv(type?: string): Promise<string> {
    const rows = await this.sallesData(type);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async sallesXlsx(type?: string): Promise<Buffer> {
    const rows = await this.sallesData(type);
    if (!rows.length) return toXlsx([['Aucun résultat']], 'Salles');
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], 'Salles');
  }

  // ─── PROFESSEURS ──────────────────────────────────────────────────────────

  async professeursData(search?: string) {
    const filter: any = { statut: { $ne: 'inactif' } };
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await this.professeurModel.find(filter).sort({ nom: 1 }).exec();
    return items.map((p: any) => {
      const j = p.toJSON();
      return {
        Nom: j.nom,
        Prénom: j.prenom,
        Genre: j.genre === 'M' ? 'M.' : 'Mme',
        Email: j.email || '—',
        Téléphone: j.telephone || '—',
        Statut: j.statut || 'actif',
      };
    });
  }

  async professeursCsv(search?: string): Promise<string> {
    const rows = await this.professeursData(search);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async professeursXlsx(search?: string): Promise<Buffer> {
    const rows = await this.professeursData(search);
    if (!rows.length) return toXlsx([['Aucun résultat']], 'Professeurs');
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], 'Professeurs');
  }

  // ─── ÉVALUATIONS ──────────────────────────────────────────────────────────

  async evaluationsData(classeId?: string, matiereId?: string, trimestre?: number) {
    const filter: any = {};
    if (classeId) filter.classe_id = classeId;
    if (matiereId) filter.matiere_id = matiereId;
    if (trimestre) filter.trimestre = trimestre;
    const items = await this.evaluationModel.find(filter).sort({ date: -1 }).exec();
    return items.map(e => {
      const j = e.toJSON() as any;
      return {
        Titre: j.titre || '—',
        'Classe': j.classe_nom || j.classe_id || '—',
        'Matière': j.matiere_nom || j.matiere_id || '—',
        Trimestre: j.trimestre ?? '—',
        Date: fmt(j.date),
        Type: j.type || '—',
        Statut: j.statut || '—',
        'Nb participants': j.nb_participants ?? '—',
        'Moyenne classe': j.moyenne_classe != null ? Number(j.moyenne_classe).toFixed(2) : '—',
      };
    });
  }

  async evaluationsCsv(classeId?: string, matiereId?: string, trimestre?: number): Promise<string> {
    const rows = await this.evaluationsData(classeId, matiereId, trimestre);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async evaluationsXlsx(classeId?: string, matiereId?: string, trimestre?: number): Promise<Buffer> {
    const rows = await this.evaluationsData(classeId, matiereId, trimestre);
    if (!rows.length) return toXlsx([['Aucun résultat']], 'Évaluations');
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], 'Évaluations');
  }

  // ─── ÉLÈVES D'UNE CLASSE ──────────────────────────────────────────────────

  async classeElevesData(classeId: string, search?: string) {
    const filter: any = { classe_id: classeId };
    if (search) {
      const tokens = search.trim().split(/\s+/);
      if (tokens.length >= 2) {
        filter.$and = tokens.map(t => ({ $or: [{ nom: { $regex: t, $options: 'i' } }, { prenom: { $regex: t, $options: 'i' } }] }));
      } else {
        filter.$or = [{ nom: { $regex: search, $options: 'i' } }, { prenom: { $regex: search, $options: 'i' } }];
      }
    }
    const eleves = await this.eleveModel.find(filter).sort({ nom: 1, prenom: 1 }).exec();
    const classe = await this.classeModel.findOne({ source_id: classeId }).exec();
    const classeNom = (classe?.toJSON() as any)?.nom || classeId;

    return {
      classeNom,
      rows: eleves.map((e, i) => {
        const j = e.toJSON() as any;
        return {
          '#': i + 1,
          Nom: j.nom,
          Prénom: j.prenom,
          Genre: j.genre === 'M' ? 'Garçon' : 'Fille',
          'Date de naissance': fmt(j.date_naissance),
          Email: j.email || '—',
          Téléphone: j.telephone || '—',
          Statut: j.statut || 'actif',
        };
      }),
    };
  }

  async classeElevesCsv(classeId: string, search?: string): Promise<string> {
    const { rows } = await this.classeElevesData(classeId, search);
    if (!rows.length) return toCsv([['Aucun résultat']]);
    const headers = Object.keys(rows[0]);
    return toCsv([headers, ...rows.map(r => headers.map(h => (r as any)[h]))]);
  }

  async classeElevesXlsx(classeId: string, search?: string): Promise<Buffer> {
    const { classeNom, rows } = await this.classeElevesData(classeId, search);
    if (!rows.length) return toXlsx([['Aucun résultat']], classeNom);
    const headers = Object.keys(rows[0]);
    return toXlsx([headers, ...rows.map(r => headers.map(h => (r as any)[h]))], classeNom);
  }

  // ─── BULLETIN PDF (HTML imprimable) ───────────────────────────────────────

  async bulletinHtml(eleveId: string, trimestre: number): Promise<string | null> {
    const eleve = await this.eleveModel.findOne({ source_id: eleveId }).exec();
    if (!eleve) return null;
    const ej = eleve.toJSON() as any;

    const classe = await this.classeModel.findOne({ source_id: ej.classe_id }).exec();
    const cj = classe?.toJSON() as any;

    const notes = await this.noteModel.find({ eleve_id: eleveId, trimestre }).exec();
    const matieres = await this.matiereModel.find().exec();
    const matiereMap = new Map(matieres.map(m => [m.source_id, m.toJSON() as any]));

    const niveauNom = cj?.niveau;
    const matiereData = new Map<string, { nom: string; code: string; ds: number | null; evaluation: number | null }>();
    for (const n of notes) {
      const nj = n.toJSON() as any;
      if (!matiereData.has(nj.matiere_id)) {
        matiereData.set(nj.matiere_id, { nom: nj.matiere_nom, code: nj.matiere_code, ds: null, evaluation: null });
      }
      const entry = matiereData.get(nj.matiere_id)!;
      if (nj.type === 'ds') entry.ds = nj.valeur;
      else if (nj.type === 'evaluation') entry.evaluation = nj.valeur;
    }

    const bulletin = Array.from(matiereData.entries()).map(([mid, data]) => {
      const mat = matiereMap.get(mid);
      const coefficients: Array<{ niveau: string; coefficient: number }> = mat?.coefficients || [];
      let coeff = mat?.coefficient ?? 1;
      if (niveauNom && coefficients.length > 0) {
        const found = coefficients.find((c: any) => c.niveau === niveauNom);
        if (found) coeff = found.coefficient;
      } else if (coefficients.length === 1) {
        coeff = coefficients[0].coefficient;
      }
      const vals = [data.ds, data.evaluation].filter(v => v !== null) as number[];
      const moyenne = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
      const hasNote = data.ds !== null || data.evaluation !== null;
      return { mid, nom: data.nom, code: data.code, coeff, ds: data.ds, evaluation: data.evaluation, moyenne, hasNote };
    });

    let totalPondere = 0, totalCoeff = 0;
    for (const m of bulletin) {
      if (m.hasNote) { totalPondere += m.moyenne * m.coeff; totalCoeff += m.coeff; }
    }
    const moyenneGenerale = totalCoeff > 0 ? Math.round((totalPondere / totalCoeff) * 10) / 10 : null;

    const mention = (moy: number) => {
      if (moy >= 16) return { label: 'Très bien', color: '#15803d' };
      if (moy >= 14) return { label: 'Bien', color: '#0284c7' };
      if (moy >= 12) return { label: 'Assez bien', color: '#6d28d9' };
      if (moy >= 10) return { label: 'Passable', color: '#b45309' };
      return { label: 'Insuffisant', color: '#dc2626' };
    };

    const noteColor = (v: number) => {
      if (v >= 16) return '#15803d';
      if (v >= 12) return '#0284c7';
      if (v >= 10) return '#b45309';
      return '#dc2626';
    };

    const noteCell = (v: number | null) =>
      v === null ? '<span style="color:#94a3b8">—</span>' :
      `<span style="display:inline-block;min-width:38px;padding:2px 7px;border-radius:9999px;background:${noteColor(v)};color:#fff;font-weight:600;font-size:.9rem;text-align:center">${v}</span>`;

    const mentioneGenerale = moyenneGenerale !== null ? mention(moyenneGenerale) : null;

    const rows = bulletin.filter(m => m.hasNote).map(m => {
      const men = mention(m.moyenne);
      return `<tr>
        <td><strong>${xmlEsc(m.nom)}</strong></td>
        <td><span style="display:inline-block;padding:1px 8px;border-radius:4px;background:#f1f5f9;font-size:.8rem;font-weight:600">${xmlEsc(m.code)}</span></td>
        <td style="text-align:center">${m.coeff}</td>
        <td style="text-align:center">${noteCell(m.ds)}</td>
        <td style="text-align:center">${noteCell(m.evaluation)}</td>
        <td style="text-align:center;font-weight:700;color:${noteColor(m.moyenne)}">${m.moyenne.toFixed(1)}<span style="font-size:.75rem;color:#64748b">/20</span></td>
        <td><span style="display:inline-block;padding:2px 10px;border-radius:9999px;background:${men.color}22;color:${men.color};font-size:.8rem;font-weight:600">${men.label}</span></td>
      </tr>`;
    }).join('');

    const dateNaiss = ej.date_naissance ? fmt(ej.date_naissance) : '—';
    const annee = cj?.annee_scolaire || '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin scolaire</title>
  <style>
    @page { size: A4; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
    .page { max-width: 794px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 14px; margin-bottom: 18px; }
    .school-name { font-size: 1.3rem; font-weight: 800; color: #1e40af; }
    .school-sub { font-size: .85rem; color: #64748b; margin-top: 2px; }
    .bulletin-title { text-align: right; }
    .bulletin-title h1 { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .bulletin-title .annee { font-size: .85rem; color: #64748b; }
    .student-card { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; }
    .student-card .field { display: flex; flex-direction: column; gap: 2px; }
    .student-card .label { font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; font-weight: 600; }
    .student-card .value { font-size: .95rem; font-weight: 600; color: #1e293b; }
    .trimestre-badge { display: inline-block; padding: 4px 14px; border-radius: 9999px; background: #1e40af; color: #fff; font-weight: 700; font-size: .9rem; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    thead { background: #1e40af; color: #fff; }
    thead th { padding: 9px 10px; text-align: left; font-size: .82rem; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tfoot { background: #f1f5f9; border-top: 2px solid #1e40af; }
    tfoot td { padding: 10px; font-weight: 700; font-size: 1rem; }
    .moyenne-gen { font-size: 1.15rem; font-weight: 800; }
    .footer-note { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: .78rem; color: #94a3b8; display: flex; justify-content: space-between; }
    .signature-box { margin-top: 32px; display: flex; justify-content: space-between; }
    .sig { text-align: center; }
    .sig .line { border-top: 1px solid #334155; width: 160px; margin: 50px auto 6px; }
    .sig .sig-label { font-size: .78rem; color: #64748b; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
      <span style="font-size:.78rem;color:#64748b">💡 Dans les options d'impression, désactivez <strong>En-têtes et pieds de page</strong> pour un rendu propre.</span>
      <button onclick="window.print()" style="padding:8px 20px;background:#1e40af;color:#fff;border:none;border-radius:6px;font-size:.95rem;cursor:pointer;font-weight:600;flex-shrink:0;margin-left:16px">🖨 Imprimer / PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="school-name">GestionÉcole</div>
        <div class="school-sub">Bulletin scolaire officiel</div>
      </div>
      <div class="bulletin-title">
        <h1>Bulletin de notes</h1>
        <div class="annee">${xmlEsc(annee)}</div>
      </div>
    </div>

    <div class="student-card">
      <div class="field">
        <span class="label">Élève</span>
        <span class="value">${xmlEsc(ej.prenom)} ${xmlEsc(ej.nom)}</span>
      </div>
      <div class="field">
        <span class="label">Date de naissance</span>
        <span class="value">${dateNaiss}</span>
      </div>
      <div class="field">
        <span class="label">Classe</span>
        <span class="value">${xmlEsc(cj?.nom || '—')}</span>
      </div>
      <div class="field">
        <span class="label">Niveau</span>
        <span class="value">${xmlEsc(cj?.niveau || '—')}</span>
      </div>
    </div>

    <div class="trimestre-badge">Trimestre ${trimestre}</div>

    ${bulletin.filter(m => m.hasNote).length === 0
      ? `<p style="color:#64748b;text-align:center;padding:24px">Aucune note pour ce trimestre.</p>`
      : `<table>
      <thead>
        <tr>
          <th>Matière</th>
          <th>Code</th>
          <th style="text-align:center">Coef.</th>
          <th style="text-align:center">DS</th>
          <th style="text-align:center">Évaluation</th>
          <th style="text-align:center">Moyenne</th>
          <th>Mention</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      ${moyenneGenerale !== null ? `<tfoot>
        <tr>
          <td colspan="5"><strong>Moyenne générale (pondérée)</strong></td>
          <td style="text-align:center"><span class="moyenne-gen" style="color:${noteColor(moyenneGenerale)}">${moyenneGenerale.toFixed(1)}/20</span></td>
          <td><span style="display:inline-block;padding:2px 10px;border-radius:9999px;background:${mentioneGenerale!.color}22;color:${mentioneGenerale!.color};font-size:.85rem;font-weight:600">${mentioneGenerale!.label}</span></td>
        </tr>
      </tfoot>` : ''}
    </table>`}

    <div class="signature-box">
      <div class="sig">
        <div class="line"></div>
        <div class="sig-label">Signature du directeur</div>
      </div>
      <div class="sig">
        <div class="line"></div>
        <div class="sig-label">Signature du professeur principal</div>
      </div>
      <div class="sig">
        <div class="line"></div>
        <div class="sig-label">Signature du parent / tuteur</div>
      </div>
    </div>

    <div class="footer-note">
      <span>Document généré le ${new Date().toLocaleDateString('fr-FR')}</span>
      <span>Confidentiel — Usage interne</span>
    </div>
  </div>
</body>
</html>`;
  }

  // ─── CARTE D'IDENTITÉ SCOLAIRE (HTML imprimable) ──────────────────────────

  async carteEleveHtml(eleveId: string): Promise<string | null> {
    const eleve = await this.eleveModel.findOne({ source_id: eleveId }).exec();
    if (!eleve) return null;
    const ej = eleve.toJSON() as any;

    const classe = await this.classeModel.findOne({ source_id: ej.classe_id }).exec();
    const cj = classe?.toJSON() as any;

    const annee = await this.anneeModel.findOne({ statut: 'active' }).exec();
    const anneeLabel = (annee?.toJSON() as any)?.label || '';

    const dateNaiss = ej.date_naissance ? fmt(ej.date_naissance) : '—';
    const initiales = `${(ej.prenom || '')[0] || ''}${(ej.nom || '')[0] || ''}`.toUpperCase();
    const genre = ej.genre === 'M' ? 'Garçon' : 'Fille';
    const avatarBg = ej.genre === 'M' ? '#3b82f6' : '#ec4899';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Carte scolaire</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; display: flex; flex-direction: column; align-items: center; padding: 24px 0; }
    .no-print { margin-bottom: 18px; }
    .no-print button { padding: 8px 22px; background: #1e40af; color: #fff; border: none; border-radius: 6px; font-size: .95rem; cursor: pointer; font-weight: 600; }
    .cards-wrapper { display: flex; flex-direction: column; gap: 20px; align-items: center; }
    .card {
      width: 340px; height: 210px;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,.18);
      position: relative;
      display: flex;
      flex-direction: column;
    }
    /* ── RECTO ── */
    .recto { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%); color: #fff; }
    .recto .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px 0; }
    .school-name { font-size: .82rem; font-weight: 800; letter-spacing: .04em; opacity: .95; }
    .annee-badge { font-size: .68rem; background: rgba(255,255,255,.2); border-radius: 9999px; padding: 2px 9px; }
    .recto .body { display: flex; gap: 14px; padding: 10px 14px; flex: 1; align-items: center; }
    .avatar { width: 66px; height: 66px; border-radius: 50%; background: ${avatarBg}; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 800; color: #fff; border: 3px solid rgba(255,255,255,.5); flex-shrink: 0; }
    .identity { flex: 1; }
    .identity .nom { font-size: 1.1rem; font-weight: 800; line-height: 1.2; }
    .identity .prenom { font-size: .88rem; font-weight: 400; opacity: .9; }
    .identity .meta { margin-top: 6px; font-size: .75rem; opacity: .8; }
    .identity .classe-badge { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 9999px; background: rgba(255,255,255,.22); font-size: .78rem; font-weight: 700; }
    .recto .barcode-area { border-top: 1px solid rgba(255,255,255,.15); padding: 6px 14px; display: flex; justify-content: space-between; align-items: center; font-size: .7rem; opacity: .7; }

    /* ── VERSO ── */
    .verso { background: #fff; color: #1e293b; }
    .verso .top { background: #1e40af; color: #fff; padding: 8px 14px; font-size: .8rem; font-weight: 700; display: flex; justify-content: space-between; }
    .verso .content { padding: 10px 14px; flex: 1; display: flex; flex-direction: column; gap: 7px; }
    .field-row { display: flex; gap: 6px; align-items: baseline; }
    .field-row .lbl { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; font-weight: 600; width: 100px; flex-shrink: 0; }
    .field-row .val { font-size: .82rem; color: #1e293b; font-weight: 500; }
    .verso .bottom { border-top: 1px solid #e2e8f0; padding: 6px 14px; font-size: .68rem; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      .card { box-shadow: 0 0 0 1px #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:18px">
    <button onclick="window.print()">🖨 Imprimer la carte</button>
    <span style="font-size:.75rem;color:#64748b">💡 Dans les options d'impression, désactivez <strong>En-têtes et pieds de page</strong></span>
  </div>

  <div class="cards-wrapper">
    <!-- RECTO -->
    <div class="card recto">
      <div class="top-bar">
        <span class="school-name">GestionÉcole</span>
        <span class="annee-badge">${xmlEsc(anneeLabel)}</span>
      </div>
      <div class="body">
        <div class="avatar">${xmlEsc(initiales)}</div>
        <div class="identity">
          <div class="nom">${xmlEsc(ej.nom)}</div>
          <div class="prenom">${xmlEsc(ej.prenom)}</div>
          <div class="meta">${genre} · ${dateNaiss}</div>
          <div class="classe-badge">${xmlEsc(cj?.nom || '—')} — ${xmlEsc(cj?.niveau || '—')}</div>
        </div>
      </div>
      <div class="barcode-area">
        <span>ID : ${xmlEsc(eleveId.slice(-8).toUpperCase())}</span>
        <span>Carte valable pour l'année ${xmlEsc(anneeLabel)}</span>
      </div>
    </div>

    <!-- VERSO -->
    <div class="card verso">
      <div class="top">
        <span>Informations de contact</span>
        <span>GestionÉcole</span>
      </div>
      <div class="content">
        <div class="field-row">
          <span class="lbl">Classe</span>
          <span class="val">${xmlEsc(cj?.nom || '—')}</span>
        </div>
        <div class="field-row">
          <span class="lbl">Niveau</span>
          <span class="val">${xmlEsc(cj?.niveau || '—')}</span>
        </div>
        <div class="field-row">
          <span class="lbl">Email</span>
          <span class="val">${xmlEsc(ej.email || 'Non renseigné')}</span>
        </div>
        <div class="field-row">
          <span class="lbl">Téléphone</span>
          <span class="val">${xmlEsc(ej.telephone || 'Non renseigné')}</span>
        </div>
        <div class="field-row">
          <span class="lbl">Adresse</span>
          <span class="val">${xmlEsc(ej.adresse || 'Non renseignée')}</span>
        </div>
      </div>
      <div class="bottom">
        <span>Émise le ${new Date().toLocaleDateString('fr-FR')}</span>
        <span>À conserver — Usage scolaire uniquement</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}
