const express = require('express');
const Leave = require('../models/Leave');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

function daysBetween(start, end) {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const d1 = new Date(sy, sm - 1, sd);
  const d2 = new Date(ey, em - 1, ed);
  return Math.max(1, Math.round((d2 - d1) / (24 * 60 * 60 * 1000)) + 1);
}

/* --------------------------------- List --------------------------------- */

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'principal') {
      const list = await Leave.find()
        .populate('user', 'name')
        .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
        .populate('student', 'name')
        .sort({ appliedOn: -1 });
      const pending = list.filter((l) => l.status === 'Pending');
      const counts = await Leave.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const summary = { Pending: 0, Approved: 0, Rejected: 0 };
      counts.forEach((c) => (summary[c._id] = c.count));
      return res.json({ list, pending, summary });
    }

    let student;
    if (req.user.role === 'parent') {
      const { studentId } = req.query;
      student = await Student.findOne({ _id: studentId, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
      const list = await Leave.find({ student: student.user })
        .populate('user', 'name')
        .sort({ appliedOn: -1 });
      return res.json({ list, pending: list.filter((l) => l.status === 'Pending'), summary: {} });
    }

    const filter = { user: req.user._id };
    if (req.user.role === 'student') filter.role = 'student';
    if (req.user.role === 'teacher') filter.role = 'teacher';
    const list = await Leave.find(filter).sort({ appliedOn: -1 });
    res.json({ list, pending: list.filter((l) => l.status === 'Pending'), summary: {} });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* --------------------------------- Apply --------------------------------- */

router.post('/', authorize('teacher', 'student', 'parent'), async (req, res) => {
  try {
    const { startDate, endDate, reason, type } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Start date, end date and reason are required' });
    }
    const data = {
      user: req.user._id,
      role: req.user.role === 'parent' ? 'parent' : req.user.role,
      startDate,
      endDate,
      days: daysBetween(startDate, endDate),
      reason,
      type: type || 'Casual',
    };
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher) data.teacher = teacher._id;
    }
    if (req.user.role === 'parent') {
      const { studentId } = req.body;
      const student = await Student.findOne({ _id: studentId, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
      data.student = student.user;
      data.role = 'parent';
    } else if (req.user.role === 'student') {
      data.student = req.user._id;
    }
    const doc = await Leave.create(data);
    res.json(await Leave.findById(doc._id).populate('user', 'name'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* --------------------------- Approval (principal) --------------------------- */

router.put('/:id/decision', authorize('principal'), async (req, res) => {
  try {
    const doc = await Leave.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Leave not found' });
    const { decision, remarks } = req.body;
    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Rejected' });
    }
    doc.status = decision;
    doc.approvedBy = req.user._id;
    doc.approvalDate = new Date();
    doc.remarks = remarks || '';
    await doc.save();
    res.json(await Leave.findById(doc._id).populate('user', 'name').populate({ path: 'teacher', populate: { path: 'user', select: 'name' } }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* --------------------------------- Balance --------------------------------- */

router.get('/balance', authorize('teacher', 'student'), async (req, res) => {
  try {
    const used = await Leave.aggregate([
      { $match: { user: req.user._id, status: { $in: ['Approved', 'Pending'] } } },
      { $group: { _id: '$type', days: { $sum: '$days' } } },
    ]);
    const usedMap = {};
    used.forEach((u) => (usedMap[u._id] = u.days));
    const quota = req.user.role === 'teacher'
      ? { Casual: 12, Sick: 10, Earned: 15, Medical: 5, Emergency: 5 }
      : { Casual: 10, Sick: 8, Earned: 5, Medical: 3, Emergency: 3 };
    res.json(Object.entries(quota).map(([type, total]) => ({ type, total, used: usedMap[type] || 0, remaining: total - (usedMap[type] || 0) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;