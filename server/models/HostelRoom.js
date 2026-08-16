const mongoose = require('mongoose');

const hostelRoomSchema = new mongoose.Schema(
  {
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    roomNo: { type: String, required: true },
    floor: { type: String, default: 'Ground' },
    type: { type: String, enum: ['Dormitory', 'Shared', 'Private'], default: 'Shared' },
    capacity: { type: Number, default: 4 },
  },
  { timestamps: true }
);

hostelRoomSchema.index({ hostel: 1, roomNo: 1 }, { unique: true });

module.exports = mongoose.model('HostelRoom', hostelRoomSchema);