import Inscription from '../models/inscription.js';
import { sendInscriptionEmails, sendStatusEmail } from '../utils/sendEmail.js';

const ALLOWED_STATUSES = ['en_attente', 'valide', 'refuse'];

export const createInscription = async (req, res) => {
  try {
    const savedInscription = await Inscription.create(req.body);
    const emailResult = await sendInscriptionEmails(savedInscription);
    savedInscription.emailStatus = emailResult.status;
    savedInscription.emailError = emailResult.error || '';
    await savedInscription.save();

    res.status(201).json({
      success: true,
      message: emailResult.status === 'envoye'
        ? 'Votre dossier a bien été reçu. Un e-mail de confirmation vous a été envoyé.'
        : 'Votre dossier a bien été reçu. La confirmation par e-mail est momentanément indisponible.',
      id: savedInscription._id,
      emailStatus: emailResult.status
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
