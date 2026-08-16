const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['teacher', 'student', 'parent'], required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, default: 1 },
    reason: { type: String, required: true },
    type: {
      type: String,
      enum: ['Casual', 'Sick', 'Earned', 'Medical', 'Emergency', 'Other'],
      default: 'Casual',
    },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedOn: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

leaveSchema.index({ status: 1, startDate: -1 });
leaveSchema.index({ user: 1, startDate: -1 });

module.exports = mongoose.model('Leave', leaveSchema);