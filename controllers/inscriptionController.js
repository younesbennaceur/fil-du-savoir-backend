import inscription from "../models/inscription.js";
import { sendInscriptionEmails } from "../utils/sendEmail.js";

export const createInscription = async (req, res) => {
    try {
        const newInscription = new inscription(req.body);
        const savedInscription = await newInscription.save();
        sendInscriptionEmails(savedInscription);
        res.status(201).json({ 
      success: true, 
      message: "Merci ! Votre inscription a bien été reçue." 
    });
    console.log("Nouvelle inscription créée:", savedInscription);
    } catch (error) {
    console.error("Erreur création inscription:", error);
    res.status(400).json({ success: false, message: "Erreur lors de l'inscription", error: error.message });
    }
    }

export const getAllInscriptions = async (req, res) => {
    try {
        const inscriptions = await inscription.find().sort({ createdAt: -1 }); // Les plus récentes en premier
        res.status(200).json(inscriptions);
    } catch (error) {
        console.error("Erreur récupération inscriptions:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }}

export const upddateInscptionStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'validé' ou 'refusé'
    try {
        const updatedInscription = await inscription.findByIdAndUpdate(
            id, 
            { status },
            { new: true } // Pour retourner l'inscription mise à jour
        );
        if (!updatedInscription) {
            return res.status(404).json({ message: "Inscription non trouvée" });
        }
        res.status(200).json(updatedInscription);
    } catch (error) {
        console.error("Erreur mise à jour statut inscription:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }}

