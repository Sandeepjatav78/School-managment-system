const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, unique: true },
    monthlyFee: { type: Number, required: true, min: 0 },
    heads: [
      {
        name: { type: String, required: true },
        amount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

feeStructureSchema.methods.totalMonthlyFee = function () {
  if (this.heads && this.heads.length > 0) {
    return this.heads.reduce((s, h) => s + (h.amount || 0), 0);
  }
  return this.monthlyFee || 0;
};

module.exports = mongoose.model('FeeStructure', feeStructureSchema);