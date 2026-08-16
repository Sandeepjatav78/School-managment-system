const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    room: { type: String, default: '' },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    capacity: { type: Number, default: 40 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
