import Inscription from '../models/inscription.js';
import { sendInscriptionEmails, sendStatusEmail, sendTestEmail } from '../utils/sendEmail.js';

const ALLOWED_STATUSES = ['en_attente', 'valide', 'refuse'];

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

export const cleanupKeepRandomInscriptions = async (req, res) => {
  const { expectedTotal, keepCount, confirmation } = req.body;
  if (expectedTotal !== 52 || keepCount !== 4 || confirmation !== 'SUPPRIMER_48') {
    return res.status(400).json({ message: 'Confirmation de nettoyage invalide' });
  }

  try {
    const total = await Inscription.countDocuments();
    if (total !== expectedTotal) {
      return res.status(409).json({
        message: 'Le nombre de dossiers a changé. Nettoyage annulé.',
        expectedTotal,
        actualTotal: total
      });
    }

    const kept = await Inscription.aggregate([
      { $sample: { size: keepCount } },
      { $project: { _id: 1 } }
    ]);
    const keptIds = kept.map((item) => item._id);
    const result = await Inscription.deleteMany({ _id: { $nin: keptIds } });
    const remaining = await Inscription.countDocuments();

    res.status(200).json({ deleted: result.deletedCount, remaining });
  } catch (error) {
    console.error('Erreur nettoyage aléatoire:', error);
    res.status(500).json({ message: 'Erreur pendant le nettoyage' });
  }
};
