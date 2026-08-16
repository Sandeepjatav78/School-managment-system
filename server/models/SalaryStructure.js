const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, unique: true },
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    allowances: [{ name: { type: String }, amount: { type: Number, default: 0 } }],
    deductions: [{ name: { type: String }, amount: { type: Number, default: 0 } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);