const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'Unit Test',
        'Periodic Test 1',
        'Periodic Test 2',
        'Quarterly',
        'Half Yearly',
        'Pre-Board',
        'Annual',
        'Other',
      ],
      default: 'Periodic Test 1',
    },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjects: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        maxMarks: { type: Number, default: 100 },
        date: { type: String },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],
    startDate: { type: String },
    endDate: { type: String },
    session: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Result Published'],
      default: 'Scheduled',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

examSchema.index({ class: 1, name: 1 });

module.exports = mongoose.model('Exam', examSchema);