const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    warden: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hostel', hostelSchema);