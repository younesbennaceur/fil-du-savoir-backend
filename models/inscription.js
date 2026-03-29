import mongoose from 'mongoose';

const inscriptionSchema = new mongoose.Schema({
  // ── Informations Parents ──
  parentName: { type: String, required: true },
  parentAddress: { type: String, required: true },
  parentPhone: { type: String, required: true },
  parentEmail: { type: String, required: true },


  studentName: { type: String, required: true },
  studentAge: { type: Number, required: true },
  studentPhone: { type: String },
  level: { type: String, required: true }, 
  soutienClass: { type: String }, 


  courseType: { type: String, required: true }, 
  schedules: [{ type: String }], 


  signature: { type: String, required: true }, // Le nom tapé à la fin

  
  status: {
    type: String,
    enum: ['en_attente', 'validé', 'refusé'],
    default: 'en_attente' // Par défaut, toute nouvelle inscription est en attente
  }
}, { 
  timestamps: true // Garde une trace de la date d'inscription exacte
});

export default mongoose.model('Inscription', inscriptionSchema);