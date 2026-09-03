import mongoose from 'mongoose';

export const COURSE_OPTIONS = [
  'arabe_enfant_samedi_matin',
  'arabe_enfant_dimanche_matin',
  'arabe_enfant_samedi_apres_midi',
  'arabe_enfant_dimanche_apres_midi',
  'arabe_enfant_mercredi',
  'soutien_scolaire_samedi',
  'arabe_femme_vendredi',
  'arabe_femme_dimanche',
  'sciences_islamiques_mardi'
];

const inscriptionSchema = new mongoose.Schema({
  registrationType: { type: String, enum: ['inscription', 'renouvellement'], required: true },
  childLastName: { type: String, required: true, trim: true },
  childFirstName: { type: String, required: true, trim: true },
  childGender: { type: String, enum: ['F', 'M'], required: true },
  childBirthDate: { type: Date, required: true },
  childBirthPlace: { type: String, required: true, trim: true },
  addressStreetNumber: { type: String, trim: true, default: '' },
  addressStreet: { type: String, required: true, trim: true },
  addressCity: { type: String, required: true, trim: true },
  addressPostalCode: { type: String, required: true, trim: true },
  fatherName: { type: String, trim: true, default: '' },
  fatherPhone: { type: String, trim: true, default: '' },
  fatherEmail: { type: String, trim: true, lowercase: true, default: '' },
  motherName: { type: String, trim: true, default: '' },
  motherPhone: { type: String, trim: true, default: '' },
  motherEmail: { type: String, trim: true, lowercase: true, default: '' },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  courseChoices: [{ type: String, enum: COURSE_OPTIONS }],
  imageRightsInternal: { type: Boolean, required: true },
  imageRightsExternal: { type: Boolean, required: true },
  signerName: { type: String, required: true, trim: true },
  signatureDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['en_attente', 'valide', 'refuse'],
    default: 'en_attente'
  },
  paymentStatus: {
    type: String,
    enum: ['non_paye', 'especes', 'cheque', 'virement', 'carte_en_ligne'],
    default: 'non_paye'
  },
  paymentUpdatedAt: { type: Date, default: null },
  paymentNote: { type: String, trim: true, maxlength: 200, default: '' },
  emailStatus: {
    type: String,
    enum: ['en_cours', 'envoye', 'partiel', 'echec'],
    default: 'en_cours'
  },
  emailError: { type: String, default: '' }
}, { timestamps: true });

inscriptionSchema.path('courseChoices').validate(
  (choices) => Array.isArray(choices) && choices.length > 0,
  'Choisissez au moins un cours.'
);

inscriptionSchema.pre('validate', function validateParentContact() {
  const hasFather = this.fatherName && this.fatherPhone;
  const hasMother = this.motherName && this.motherPhone;
  if (!hasFather && !hasMother) {
    throw new Error('Renseignez le nom et le téléphone d’au moins un parent.');
  }
});

export default mongoose.model('Inscription', inscriptionSchema);
