const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const TeacherAttendance = require('../models/TeacherAttendance');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('principal'));

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.get('/dashboard', async (req, res) => {
  try {
    const [studentCount, teacherCount, classCount, subjectCount, attendance] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Subject.countDocuments(),
      Attendance.countDocuments({ date: todayStr() }),
    ]);
    const present = await Attendance.countDocuments({ date: todayStr(), status: { $in: ['Present', 'Late'] } });
    const absent = attendance - present;
    const [tTotal, tPresent, tLate, tAbsent] = await Promise.all([
      TeacherAttendance.countDocuments({ date: todayStr() }),
      TeacherAttendance.countDocuments({ date: todayStr(), status: 'Present' }),
      TeacherAttendance.countDocuments({ date: todayStr(), status: 'Late' }),
      TeacherAttendance.countDocuments({ date: todayStr(), status: 'Absent' }),
    ]);
    const marked = tPresent + tLate + tAbsent;
    res.json({
      studentCount,
      teacherCount,
      classCount,
      subjectCount,
      todayAttendance: {
        total: attendance,
        present,
        absent,
        rate: attendance ? Math.round((present / attendance) * 100) : 0,
      },
      teacherAttendance: {
        total: marked || teacherCount,
        present: tPresent,
        late: tLate,
        absent: tAbsent,
        rate: marked ? Math.round(((tPresent + tLate) / marked) * 100) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/today-classes', async (req, res) => {
  try {
    const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][(new Date().getDay() + 6) % 7];
    const entries = await Timetable.find({ day })
      .populate('class', 'name room')
      .populate('subject', 'name code color')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ period: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
