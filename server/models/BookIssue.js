const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    fine: { type: Number, default: 0 },
    status: { type: String, enum: ['Issued', 'Returned', 'Overdue'], default: 'Issued' },
  },
  { timestamps: true }
);

bookIssueSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('BookIssue', bookIssueSchema);