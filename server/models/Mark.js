const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    marksObtained: { type: Number, min: 0 },
    maxMarks: { type: Number, default: 100 },
    grade: { type: String, default: '' },
    remarks: { type: String, default: '' },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

markSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);