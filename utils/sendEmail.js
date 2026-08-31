import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

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

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const childName = (inscription) =>
  `${inscription.childFirstName || ''} ${inscription.childLastName || ''}`.trim();

const recipientEmail = (inscription) =>
  inscription.contactEmail
  || inscription.fatherEmail
  || inscription.motherEmail
  || inscription.parentEmail
  || '';

const courseList = (inscription) => (inscription.courseChoices || [])
  .map((choice) => `<li>${escapeHtml(COURSE_LABELS[choice] || choice)}</li>`)
  .join('');

let transporter;

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER ou EMAIL_PASS manquant');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      family: 4,
      secure: false,
      requireTLS: true,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
};

const send = async (payload) => {
  return getTransporter().sendMail(payload);
};

const emailShell = (title, content) => `
  <div style="background:#f4f8ff;padding:28px 12px;font-family:Arial,sans-serif;color:#17345f">
    <div style="max-width:640px;margin:auto;background:#fff;border:1px solid #d7e5fb;border-radius:18px;overflow:hidden">
      <div style="background:#073da5;color:#fff;padding:24px;text-align:center">
        <div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase">Association</div>
        <div style="font-size:30px;font-weight:700;margin-top:4px">Fil du Savoir</div>
      </div>
      <div style="padding:28px">
        <h1 style="font-size:22px;color:#073da5;margin:0 0 18px">${title}</h1>
        ${content}
      </div>
      <div style="background:#073da5;color:#fff;padding:16px;text-align:center;font-size:13px">
        06 16 23 90 58 · assofildusavoir@gmail.com
      </div>
    </div>
  </div>`;

export const sendInscriptionEmails = async (inscription) => {
  const from = `"Fil du Savoir" <${process.env.EMAIL_USER}>`;
  const adminEmail = process.env.EMAIL_ADMIN || 'assofildusavoir@gmail.com';
  const parentEmail = recipientEmail(inscription);
  const errors = [];

  if (!parentEmail) throw new Error('Aucune adresse e-mail parent disponible');

  const parentContent = `
    <p>Bonjour,</p>
    <p>Nous confirmons la réception du dossier de <strong>${escapeHtml(childName(inscription))}</strong>
    pour l'année 2026-2027.</p>
    <p><strong>Type :</strong> ${inscription.registrationType === 'renouvellement' ? 'Renouvellement' : 'Nouvelle inscription'}</p>
    <p><strong>Choix enregistrés :</strong></p><ul>${courseList(inscription)}</ul>
    <p>Les places étant limitées, ce message confirme la réception du dossier et non son acceptation définitive.</p>`;

  const adminContent = `
    <p>Un nouveau dossier vient d'être déposé.</p>
    <p><strong>Enfant :</strong> ${escapeHtml(childName(inscription))}</p>
    <p><strong>Contact :</strong> ${escapeHtml(parentEmail)}</p>
    <p><strong>Choix :</strong></p><ul>${courseList(inscription)}</ul>
    <p><a href="${escapeHtml(process.env.ADMIN_URL || 'https://www.fildusavoir.com/admin')}" style="display:inline-block;background:#073da5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Ouvrir le dashboard</a></p>`;

  const results = await Promise.allSettled([
    send({ from, to: parentEmail, replyTo: adminEmail, subject: 'Dossier d’inscription reçu - Fil du Savoir', html: emailShell('Votre dossier a bien été reçu', parentContent) }),
    send({ from, to: adminEmail, replyTo: parentEmail, subject: `Nouvelle inscription 2026-2027 - ${childName(inscription)}`, html: emailShell('Nouveau dossier reçu', adminContent) })
  ]);

  results.forEach((result) => {
    if (result.status === 'rejected') errors.push(result.reason?.message || String(result.reason));
  });

  return {
    status: errors.length === 0 ? 'envoye' : errors.length === results.length ? 'echec' : 'partiel',
    error: errors.join(' | '),
    parentSent: results[0].status === 'fulfilled',
    adminSent: results[1].status === 'fulfilled'
  };
};

export const sendStatusEmail = async (inscription) => {
  if (inscription.status === 'en_attente') return { sent: false, reason: 'Statut en attente' };
  try {
    const parentEmail = recipientEmail(inscription);
    if (!parentEmail) return { sent: false, reason: 'Aucune adresse e-mail sur ce dossier' };
    const accepted = inscription.status === 'valide';
    await send({
      from: `"Fil du Savoir" <${process.env.EMAIL_USER}>`,
      to: parentEmail,
      replyTo: process.env.EMAIL_ADMIN || 'assofildusavoir@gmail.com',
      subject: `${accepted ? 'Dossier accepté' : 'Mise à jour de votre dossier'} - Fil du Savoir`,
      html: emailShell(
        accepted ? 'Votre inscription est validée' : 'Votre demande ne peut pas être retenue',
        accepted
          ? `<p>Bonjour,</p><p>Le dossier de <strong>${escapeHtml(childName(inscription))}</strong> est validé. L’association vous contactera pour finaliser le paiement et l’organisation des cours.</p>`
          : `<p>Bonjour,</p><p>Nous sommes désolés, le dossier de <strong>${escapeHtml(childName(inscription))}</strong> ne peut pas être retenu actuellement. Vous pouvez nous contacter pour plus d’informations.</p>`
      )
    });
    return { sent: true };
  } catch (error) {
    console.error('Erreur e-mail de statut:', error);
    return { sent: false, reason: error.message };
  }
};
