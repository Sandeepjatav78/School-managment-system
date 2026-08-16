const mongoose = require('mongoose');

const hostelAllotmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelRoom', required: true },
    bedNo: { type: String },
    startDate: { type: String, default: '' },
    endDate: { type: String },
    fee: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Vacated'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HostelAllotment', hostelAllotmentSchema);