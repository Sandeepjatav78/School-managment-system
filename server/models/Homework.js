const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    dueDate: { type: Date },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

homeworkSchema.index({ class: 1, dueDate: 1 });
homeworkSchema.index({ teacher: 1 });

module.exports = mongoose.model('Homework', homeworkSchema);