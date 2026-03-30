import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// 1. Initialiser Resend avec ta clé API (qui est sur Render)
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInscriptionEmails = async (inscription) => {
  try {
    // ⚠️ Obligatoire avec Resend tant que tu n'as pas de nom de domaine (ex: fildusavoir.com)
    const senderEmail = 'onboarding@resend.dev'; 
    
    // L'adresse de l'association (que tu as configurée sur Render dans EMAIL_USER)
    const adminEmail = process.env.EMAIL_USER; 

    console.log(`Préparation de l'envoi des emails pour : ${inscription.studentName}`);

    // 2. Envoyer l'email de confirmation au PARENT
    const { data: parentData, error: parentError } = await resend.emails.send({
      from: `"Fil du Savoir" <${senderEmail}>`,
      to: [inscription.parentEmail], // ⚠️ Pour tes tests, tu dois saisir assofildusavoir@gmail.com sur ton site
      subject: "Confirmation de votre demande d'inscription 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E3F2FD; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #0D47A1; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Fil du Savoir</h1>
          </div>
          <div style="padding: 20px;">
            <p>Bonjour <strong>${inscription.parentName}</strong>,</p>
            <p>Nous vous confirmons la bonne réception de la demande d'inscription pour <strong>${inscription.studentName}</strong>.</p>
            <p><strong>Détails :</strong></p>
            <ul>
              <li><strong>Cours :</strong> ${inscription.courseType === 'arabe_enfant' ? 'Arabe Enfants' : inscription.courseType === 'arabe_femme' ? 'Arabe Femmes' : 'Soutien Scolaire'}</li>
              <li><strong>Niveau :</strong> ${inscription.level}</li>
              <li><strong>Créneau souhaité :</strong> ${inscription.schedules.join(', ')}</li>
            </ul>
            <p>Notre équipe va traiter votre dossier rapidement. Vous recevrez une notification dès que l'inscription sera validée.</p>
            <br>
            <p>Cordialement,<br>L'équipe du Fil du Savoir</p>
          </div>
        </div>
      `
    });

    if (parentError) {
      console.error("❌ Erreur Resend (Email Parent) :", parentError);
    } else {
      console.log("✅ Email parent envoyé avec succès ! ID:", parentData?.id);
    }

    // 3. Envoyer l'email d'alerte à L'ADMINISTRATEUR (L'association)
    const { data: adminData, error: adminError } = await resend.emails.send({
      from: `"Système Fil du Savoir" <${senderEmail}>`,
      to: [adminEmail], 
      subject: `🚨 Nouvelle inscription : ${inscription.studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Nouvelle demande reçue !</h2>
          <p><strong>Parent :</strong> ${inscription.parentName} (${inscription.parentPhone})</p>
          <p><strong>Email :</strong> ${inscription.parentEmail}</p>
          <p><strong>Élève :</strong> ${inscription.studentName} (${inscription.studentAge} ans)</p>
          <p><strong>Cours :</strong> ${inscription.courseType} - ${inscription.level}</p>
          <p><strong>Créneau :</strong> ${inscription.schedules.join(', ')}</p>
          <br>
          <a href="https://fil-du-savoir.vercel.app/admin" style="background-color: #0D47A1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir le tableau de bord</a>
        </div>
      `
    });

    if (adminError) {
      console.error("❌ Erreur Resend (Email Admin) :", adminError);
    } else {
      console.log("✅ Email admin envoyé avec succès ! ID:", adminData?.id);
    }

  } catch (error) {
    console.error("❌ Erreur critique du serveur lors de l'envoi :", error);
  }
};