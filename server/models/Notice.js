const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'parents', 'class'],
      default: 'all',
    },
    targetClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
