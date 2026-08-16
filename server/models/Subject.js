const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    color: { type: String, default: '#4f46e5' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
