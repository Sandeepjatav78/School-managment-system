const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    mode: { type: String, enum: ['', 'Cash', 'UPI', 'Cheque', 'Net Banking', 'Card', 'DD'], default: '' },
    receiptNo: { type: String },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    paidDate: { type: Date },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, month: 1 }, { unique: true });
feeSchema.index({ month: 1, status: 1 });

module.exports = mongoose.model('Fee', feeSchema);