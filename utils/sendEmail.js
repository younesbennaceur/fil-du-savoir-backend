import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configurer le "Transporteur" (Celui qui livre le mail)
// 1. Configurer le "Transporteur" (Celui qui livre le mail)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Remplace service: 'gmail' par ceci
  port: 465,              // Ajoute le port sécurisé
  secure: true,           // Active la sécurité SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInscriptionEmails = async (inscription) => {
  try {
    // 2. Préparer l'email pour le PARENT
    const mailOptionsParent = {
      from: `"Fil du Savoir" <${process.env.EMAIL_USER}>`,
      to: inscription.parentEmail,
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
    };

    // 3. Préparer l'email pour L'ADMINISTRATEUR (Toi)
    const mailOptionsAdmin = {
      from: `"Système Fil du Savoir" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Tu te l'envoies à toi-même
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
          <a href="http://localhost:5173/admin" style="background-color: #0D47A1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir le tableau de bord</a>
        </div>
      `
    };

    // 4. Envoyer les deux emails
    await transporter.sendMail(mailOptionsParent);
    await transporter.sendMail(mailOptionsAdmin);
    
    console.log("✅ Emails de confirmation envoyés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des emails :", error);
      console.error("❌ Code:", error.code);
  console.error("❌ Message:", error.message);
  console.error("❌ Détail:", JSON.stringify(error, null, 2));
  }
};