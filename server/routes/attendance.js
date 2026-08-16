const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const populate = [
  { path: 'student', select: 'name' },
  { path: 'subject', select: 'name code color' },
  { path: 'class', select: 'name' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.classId) filter.class = req.query.classId;
    const records = await Attendance.find(filter).populate(populate).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/mark', authorize('teacher'), async (req, res) => {
  const { date, classId, subjectId, records } = req.body;
  if (!date || !classId || !subjectId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Date, class, subject and at least one record are required' });
  }
  try {
    const ops = records.map((r) => ({
      updateOne: {
        filter: { student: r.student, class: classId, subject: subjectId, date },
        update: {
          $set: {
            student: r.student,
            class: classId,
            subject: subjectId,
            date,
            status: r.status,
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    const saved = await Attendance.find({ class: classId, subject: subjectId, date }).populate(populate);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/for-class', async (req, res) => {
  const { date, classId, subjectId } = req.query;
  if (!date || !classId || !subjectId) return res.status(400).json({ message: 'date, classId and subjectId required' });
  try {
    const records = await Attendance.find({ class: classId, subject: subjectId, date }).populate(populate);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/teacher/history', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.json([]);
    const records = await Attendance.find({ markedBy: req.user._id })
      .populate(populate)
      .sort({ date: -1 })
      .limit(200);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/summary', authorize('principal'), async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const total = await Attendance.countDocuments({ date });
    const present = await Attendance.countDocuments({ date, status: 'Present' });
    const late = await Attendance.countDocuments({ date, status: 'Late' });
    const absent = await Attendance.countDocuments({ date, status: 'Absent' });
    res.json({ date, total, present, late, absent, rate: total ? Math.round(((present + late) / total) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
