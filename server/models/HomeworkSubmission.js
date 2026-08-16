const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Submitted', 'Checked', 'Late'], default: 'Submitted' },
    grade: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

submissionSchema.index({ homework: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('HomeworkSubmission', submissionSchema);