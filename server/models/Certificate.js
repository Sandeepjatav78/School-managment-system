const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    template: {
      type: String,
      enum: ['Bonafide', 'Transfer Certificate', 'Character Certificate', 'Study Certificate', 'School Leaving'],
      required: true,
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, default: '' },
    serialNo: { type: String, required: true, unique: true },
    issuedDate: { type: Date, default: Date.now },
    validUntil: { type: Date },
    status: { type: String, enum: ['Draft', 'Issued', 'Revoked'], default: 'Issued' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, issuedDate: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);