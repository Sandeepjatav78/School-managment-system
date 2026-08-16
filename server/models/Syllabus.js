const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    chapters: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        status: { type: String, enum: ['Planned', 'Ongoing', 'Completed'], default: 'Planned' },
        week: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

syllabusSchema.index({ class: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);