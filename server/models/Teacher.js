const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, default: '' },
    qualification: { type: String, default: '' },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    joinDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
