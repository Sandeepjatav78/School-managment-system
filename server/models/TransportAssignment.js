const mongoose = require('mongoose');

const transportAssignmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    stop: { type: String, required: true },
    pickupTime: { type: String },
    dropTime: { type: String },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    effectiveFrom: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportAssignment', transportAssignmentSchema);