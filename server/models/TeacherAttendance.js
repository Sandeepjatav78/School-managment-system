const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
