const mongoose = require('mongoose');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const timetableSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    day: { type: String, enum: DAYS, required: true },
    period: { type: Number, min: 1, max: 10, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true }
);

timetableSchema.index({ class: 1, day: 1, period: 1 }, { unique: true });
timetableSchema.index({ teacher: 1, day: 1, period: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
module.exports.DAYS = DAYS;
