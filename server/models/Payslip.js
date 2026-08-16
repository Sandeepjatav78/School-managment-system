const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    month: { type: String, required: true },
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    allowances: [{ name: { type: String }, amount: { type: Number, default: 0 } }],
    deductions: [{ name: { type: String }, amount: { type: Number, default: 0 } }],
    gross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Generated', 'Paid'], default: 'Generated' },
    paidOn: { type: Date },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

payslipSchema.index({ teacher: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);