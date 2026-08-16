const express = require('express');
const TeacherAttendance = require('../models/TeacherAttendance');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const populate = [{ path: 'teacher', populate: { path: 'user', select: 'name email' } }];

/* Principal: full list for a date (merged with all teachers) */
router.get('/', authorize('principal'), async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const [teachers, marked] = await Promise.all([
      Teacher.find().populate('user', 'name email').sort({ 'user.name': 1 }),
      TeacherAttendance.find({ date }).populate(populate),
    ]);
    const byId = new Map(marked.map((m) => [m.teacher._id.toString(), m]));

    const records = teachers.map((t) => ({
      _id: t._id,
      teacher: { _id: t._id, user: t.user },
      date,
      status: byId.get(t._id.toString())?.status || 'Present',
    }));

    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    res.json({
      records,
      summary: { date, total, present, late, absent, rate: total ? Math.round(((present + late) / total) * 100) : 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/mark', authorize('principal'), async (req, res) => {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Date and at least one record are required' });
  }
  try {
    const ops = records.map((r) => ({
      updateOne: {
        filter: { teacher: r.teacher, date },
        update: { $set: { teacher: r.teacher, date, status: r.status, markedBy: req.user._id } },
        upsert: true,
      },
    }));
    await TeacherAttendance.bulkWrite(ops);
    const saved = await TeacherAttendance.find({ date }).populate(populate);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/summary', authorize('principal'), async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const total = await TeacherAttendance.countDocuments({ date });
    const present = await TeacherAttendance.countDocuments({ date, status: 'Present' });
    const late = await TeacherAttendance.countDocuments({ date, status: 'Late' });
    const absent = await TeacherAttendance.countDocuments({ date, status: 'Absent' });
    const teachers = await Teacher.countDocuments();
    res.json({
      date,
      total: total || teachers,
      present,
      late,
      absent,
      rate: total ? Math.round(((present + late) / total) * 100) : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Teacher: own record */
router.get('/mine', authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.json({ records: [], summary: null });
    const records = await TeacherAttendance.find({ teacher: teacher._id })
      .populate('teacher', 'employeeId')
      .sort({ date: -1 });
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    res.json({
      records,
      summary: { total, present, late, absent, rate: total ? Math.round(((present + late) / total) * 100) : 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
