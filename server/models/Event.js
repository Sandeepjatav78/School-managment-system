const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: String, required: true },
    startTime: { type: String },
    endTime: { type: String },
    venue: { type: String, default: '' },
    type: {
      type: String,
      enum: ['Academic', 'Cultural', 'Sports', 'Holiday', 'Meeting', 'Exam', 'Other'],
      default: 'Academic',
    },
    audience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'parents'],
      default: 'all',
    },
    isHoliday: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ type: 1 });

module.exports = mongoose.model('Event', eventSchema);