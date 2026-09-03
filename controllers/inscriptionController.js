import Inscription from '../models/inscription.js';
import { sendInscriptionEmails, sendStatusEmail, sendTestEmail } from '../utils/sendEmail.js';
import { buildInscriptionPdf, pdfFileName } from '../utils/inscriptionPdf.js';

const ALLOWED_STATUSES = ['en_attente', 'valide', 'refuse'];
const ALLOWED_PAYMENT_STATUSES = ['non_paye', 'especes', 'cheque', 'virement', 'carte_en_ligne'];

export const createInscription = async (req, res) => {
  try {
    const savedInscription = await Inscription.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Votre dossier a bien été reçu. La confirmation et la notification à l’association sont en cours d’envoi.',
      id: savedInscription._id,
      emailStatus: 'en_cours'
    });

    sendInscriptionEmails(savedInscription)
      .then((emailResult) => {
        console.log(`E-mails inscription ${savedInscription._id}: ${emailResult.status} (parent=${emailResult.parentSent}, association=${emailResult.adminSent})${emailResult.error ? ` - ${emailResult.error}` : ''}`);
        return Inscription.findByIdAndUpdate(savedInscription._id, {
          emailStatus: emailResult.status,
          emailError: emailResult.error || ''
        });
      })
      .catch((emailError) => {
        console.error('Erreur e-mail en arrière-plan:', emailError);
        return Inscription.findByIdAndUpdate(savedInscription._id, {
          emailStatus: 'echec',
          emailError: emailError.message || String(emailError)
        });
      });
  } catch (error) {
    console.error('Erreur création inscription:', error);
    res.status(400).json({
      success: false,
      message: error.name === 'ValidationError'
        ? Object.values(error.errors).map((item) => item.message).join(' ')
        : error.message || "Erreur lors de l'inscription"
    });
  }
};

export const getAllInscriptions = async (_req, res) => {
  try {
    const inscriptions = await Inscription.find().sort({ createdAt: -1 });
    res.status(200).json(inscriptions);
  } catch (error) {
    console.error('Erreur récupération inscriptions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateInscriptionStatus = async (req, res) => {
  const { status } = req.body;
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  try {
    const updatedInscription = await Inscription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedInscription) return res.status(404).json({ message: 'Inscription non trouvée' });

    const emailResult = await sendStatusEmail(updatedInscription);
    res.status(200).json({ inscription: updatedInscription, emailStatus: emailResult });
  } catch (error) {
    console.error('Erreur mise à jour statut inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { paymentStatus, paymentNote = '' } = req.body;
  if (!ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Statut de paiement invalide' });
  }
  if (typeof paymentNote !== 'string' || paymentNote.length > 200) {
    return res.status(400).json({ message: 'La note de paiement est invalide' });
  }

  try {
    const inscription = await Inscription.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentNote: paymentNote.trim(), paymentUpdatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!inscription) return res.status(404).json({ message: 'Inscription non trouvée' });
    res.status(200).json({ inscription });
  } catch (error) {
    console.error('Erreur mise à jour paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const downloadInscriptionPdf = async (req, res) => {
  try {
    const inscription = await Inscription.findById(req.params.id);
    if (!inscription) return res.status(404).json({ message: 'Inscription non trouvée' });
    const pdf = await buildInscriptionPdf(inscription);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFileName(inscription)}"`,
      'Content-Length': pdf.length,
      'Cache-Control': 'private, no-store'
    });
    res.send(pdf);
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ message: 'Impossible de générer le PDF' });
  }
};

export const testEmailConfiguration = async (_req, res) => {
  try {
    const result = await sendTestEmail();
    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur test e-mail:', error);
    res.status(502).json({ sent: false, message: error.message || 'Échec du test e-mail' });
  }
};

export const getInscriptionStats = async (_req, res) => {
  try {
    const [total, pending, validated, refused] = await Promise.all([
      Inscription.countDocuments(),
      Inscription.countDocuments({ status: 'en_attente' }),
      Inscription.countDocuments({ status: 'valide' }),
      Inscription.countDocuments({ status: 'refuse' })
    ]);
    res.status(200).json({
      total,
      enAttente: pending,
      valides: validated,
      refuses: refused,
      autres: total - pending - validated - refused
    });
  } catch (error) {
    console.error('Erreur statistiques inscriptions:', error);
    res.status(500).json({ message: 'Erreur pendant le comptage' });
  }
};
