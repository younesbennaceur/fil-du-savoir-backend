import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const PAYMENT_URL = 'https://fil-du-savoir.s2.yapla.com/fr/event-118814';

const BLUE = '#073da5';
const LIGHT_BLUE = '#eef5ff';
const BORDER = '#cbdcf7';
const TEXT = '#17345f';
const MUTED = '#62748f';
const GREEN = '#087f5b';
const AMBER = '#9a5b00';
const RED = '#b42318';

const COURSE_LABELS = {
  arabe_enfant_samedi_matin: 'Langue arabe enfants - samedi 9h30 à 12h (niveau 1 et CP)',
  arabe_enfant_dimanche_matin: 'Langue arabe enfants - dimanche 9h30 à 12h (maternelle et CP)',
  arabe_enfant_samedi_apres_midi: 'Langue arabe enfants - samedi 14h à 16h30 (niveaux 1 à 3)',
  arabe_enfant_dimanche_apres_midi: 'Langue arabe enfants - dimanche 14h à 16h30 (niveaux 1 à 3)',
  arabe_enfant_mercredi: 'Langue arabe enfants - mercredi 14h30 à 17h (maternelle et CP)',
  soutien_scolaire_samedi: 'Soutien scolaire - samedi 16h30 à 18h30',
  arabe_femme_vendredi: 'Langue arabe femmes adultes - vendredi 19h à 21h (niveau 2)',
  arabe_femme_dimanche: 'Langue arabe femmes adultes - dimanche 18h à 20h (niveau 1)',
  sciences_islamiques_mardi: 'Sciences islamiques jeunes adolescentes - mardi 18h à 20h'
};

export const PAYMENT_LABELS = {
  non_paye: 'Pas encore payé',
  especes: 'Payé en espèces',
  cheque: 'Payé par chèque',
  virement: 'Payé par virement',
  carte_en_ligne: 'Payé par carte en ligne'
};

const STATUS_LABELS = {
  en_attente: 'En attente',
  valide: 'Validé',
  refuse: 'Refusé'
};

const value = (input, fallback = 'Non renseigné') => {
  const normalized = String(input ?? '').trim();
  return normalized || fallback;
};

const formatDate = (input) => {
  if (!input) return 'Non renseignée';
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? value(input) : date.toLocaleDateString('fr-FR');
};

const fullName = (inscription) => value(
  inscription.childFirstName
    ? `${inscription.childFirstName} ${inscription.childLastName || ''}`
    : inscription.studentName,
  'Sans nom'
);

const section = (doc, title, y, height) => {
  const upperTitle = title.toUpperCase();
  doc.font('Helvetica-Bold').fontSize(9.5);
  const titleWidth = Math.min(360, doc.widthOfString(upperTitle) + 32);
  doc.roundedRect(32, y, 531, height, 9).fillAndStroke('#ffffff', BORDER);
  doc.roundedRect(42, y - 10, titleWidth, 22, 6).fill(BLUE);
  doc.fillColor('#ffffff').text(upperTitle, 52, y - 4, { width: titleWidth - 20, lineBreak: false });
};

const field = (doc, label, content, x, y, width, options = {}) => {
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(7.5).text(label.toUpperCase(), x, y, { width, lineBreak: false });
  doc.fillColor(TEXT).font('Helvetica').fontSize(options.size || 9.5).text(value(content), x, y + 11, {
    width,
    height: options.height || 25,
    ellipsis: true,
    lineGap: 1
  });
};

const badge = (doc, label, x, y, width, color) => {
  doc.roundedRect(x, y, width, 32, 7).fill(color);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), x + 9, y + 6, { width: width - 18, align: 'center' });
};

export const buildInscriptionPdf = async (inscription) => {
  const qrCode = await QRCode.toBuffer(PAYMENT_URL, { width: 180, margin: 1, color: { dark: BLUE, light: '#ffffff' } });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Récapitulatif d'inscription - ${fullName(inscription)}`,
        Author: 'Association Fil du Savoir',
        Subject: 'Inscription 2026-2027'
      }
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, 595.28, 841.89).fill('#f7faff');
    doc.roundedRect(32, 28, 531, 88, 14).fill(BLUE);
    doc.fillColor('#bfe1ff').font('Helvetica-Bold').fontSize(9).text('ASSOCIATION FIL DU SAVOIR', 52, 45, { characterSpacing: 1.5 });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text("RÉCAPITULATIF D'INSCRIPTION", 52, 62);
    doc.fillColor('#dcecff').font('Helvetica').fontSize(10).text('Année 2026-2027 - document administratif', 52, 91);
    doc.fillColor('#dcecff').fontSize(7.5).text(`Dossier ${value(inscription._id, 'nouveau')} - édité le ${formatDate(new Date())}`, 330, 48, { width: 210, align: 'right' });

    const dossierStatus = STATUS_LABELS[inscription.status] || 'En attente';
    const paymentStatus = PAYMENT_LABELS[inscription.paymentStatus] || PAYMENT_LABELS.non_paye;
    const dossierColor = inscription.status === 'valide' ? GREEN : inscription.status === 'refuse' ? RED : AMBER;
    const paymentColor = inscription.paymentStatus && inscription.paymentStatus !== 'non_paye' ? GREEN : AMBER;
    badge(doc, `Dossier : ${dossierStatus}`, 32, 128, 255, dossierColor);
    badge(doc, `Paiement : ${paymentStatus}`, 308, 128, 255, paymentColor);

    section(doc, 'Informations civiles', 181, 139);
    field(doc, 'Type de dossier', inscription.registrationType === 'renouvellement' ? 'Renouvellement' : 'Nouvelle inscription', 48, 199, 150);
    field(doc, 'Sexe', inscription.childGender === 'F' ? 'Fille' : inscription.childGender === 'M' ? 'Garçon' : inscription.childGender, 214, 199, 95);
    field(doc, 'Date de dépôt', formatDate(inscription.createdAt), 325, 199, 205);
    field(doc, "Nom de l'enfant", inscription.childLastName || inscription.studentName, 48, 239, 230);
    field(doc, "Prénom de l'enfant", inscription.childFirstName, 300, 239, 230);
    field(doc, 'Date de naissance', formatDate(inscription.childBirthDate), 48, 279, 150);
    field(doc, 'Lieu de naissance', inscription.childBirthPlace, 214, 279, 150);
    const address = `${inscription.addressStreetNumber || ''} ${inscription.addressStreet || inscription.parentAddress || ''}, ${inscription.addressPostalCode || ''} ${inscription.addressCity || ''}`.replace(/\s+/g, ' ').trim();
    field(doc, 'Domicile', address, 380, 279, 150, { size: 8.5 });

    section(doc, 'Contacts responsables', 343, 107);
    field(doc, 'Père - nom et prénom', inscription.fatherName || inscription.parentName, 48, 361, 230);
    field(doc, 'Téléphone', inscription.fatherPhone || inscription.parentPhone, 300, 361, 100);
    field(doc, 'E-mail', inscription.fatherEmail || inscription.parentEmail, 416, 361, 115, { size: 8 });
    field(doc, 'Mère - nom et prénom', inscription.motherName, 48, 404, 230);
    field(doc, 'Téléphone', inscription.motherPhone, 300, 404, 100);
    field(doc, 'E-mail', inscription.motherEmail || inscription.contactEmail, 416, 404, 115, { size: 8 });

    section(doc, 'Cours, jours et horaires souhaités', 473, 119);
    const selectedCourses = inscription.courseChoices?.length
      ? inscription.courseChoices.map((course) => COURSE_LABELS[course] || course)
      : inscription.schedules || [inscription.courseType || 'Non précisé'];
    const midpoint = Math.ceil(selectedCourses.length / 2);
    [selectedCourses.slice(0, midpoint), selectedCourses.slice(midpoint)].forEach((list, column) => {
      list.forEach((course, index) => {
        const x = column === 0 ? 48 : 306;
        const y = 493 + index * 18;
        doc.circle(x + 3, y + 4, 2.5).fill(BLUE);
        doc.fillColor(TEXT).font('Helvetica').fontSize(8.2).text(course, x + 11, y, { width: 235, height: 17, ellipsis: true });
      });
    });

    section(doc, "Autorisations et signature", 615, 77);
    field(doc, 'Publication interne', inscription.imageRightsInternal === true ? 'Oui' : inscription.imageRightsInternal === false ? 'Non' : '', 48, 633, 130);
    field(doc, 'Publication extérieure', inscription.imageRightsExternal === true ? 'Oui' : inscription.imageRightsExternal === false ? 'Non' : '', 194, 633, 140);
    field(doc, 'Signataire', inscription.signerName || inscription.signature, 350, 633, 115, { size: 8.5 });
    field(doc, 'Date', formatDate(inscription.signatureDate), 479, 633, 55, { size: 8.5 });

    section(doc, 'Tarif et paiement', 715, 84);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(paymentStatus, 48, 733, { width: 255 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(
      `Mise à jour : ${formatDate(inscription.paymentUpdatedAt)}${inscription.paymentNote ? ` - ${inscription.paymentNote}` : ''}`,
      48, 750, { width: 340, height: 28, ellipsis: true }
    );
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(8.5).text('Paiement en ligne Yapla', 345, 733, { width: 125, align: 'right', link: PAYMENT_URL, underline: true });
    doc.image(qrCode, 480, 724, { fit: [62, 62] });

    doc.rect(0, 817, 595.28, 25).fill(BLUE);
    doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text('06 16 23 90 58  |  assofildusavoir@gmail.com  |  www.fildusavoir.com', 32, 825, { width: 531, align: 'center' });
    doc.end();
  });
};

export const pdfFileName = (inscription) => {
  const slug = fullName(inscription)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `recapitulatif-inscription-${slug || 'dossier'}.pdf`;
};
