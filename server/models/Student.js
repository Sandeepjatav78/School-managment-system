const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    admissionNo: { type: String, required: true, unique: true, trim: true },
    rollNo: { type: Number },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    photo: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['', 'Male', 'Female', 'Other'], default: '' },
    bloodGroup: { type: String, default: '' },
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    editAccessUntil: { type: Date },
  },
  { timestamps: true }
);

studentSchema.methods.isProfileComplete = function () {
  return Boolean(this.photo && this.dateOfBirth && this.gender && this.bloodGroup && this.address && this.guardianPhone);
};

studentSchema.methods.hasEditAccess = function () {
  return Boolean(this.editAccessUntil && new Date(this.editAccessUntil) > new Date());
};

module.exports = mongoose.model('Student', studentSchema);
