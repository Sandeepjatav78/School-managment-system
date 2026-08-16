const express = require('express');
const Timetable = require('../models/Timetable');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const populate = [
  { path: 'class', select: 'name room' },
  { path: 'subject', select: 'name code color' },
  { path: 'teacher', populate: { path: 'user', select: 'name' } },
];

async function checkConflicts(classId, teacherId, day, period, excludeId) {
  const byClass = await Timetable.findOne({ class: classId, day, period, _id: { $ne: excludeId } });
  if (byClass) return { message: 'This class already has a class scheduled in that day and period' };
  const byTeacher = await Timetable.findOne({ teacher: teacherId, day, period, _id: { $ne: excludeId } });
  if (byTeacher) return { message: 'This teacher is already teaching another class in that day and period' };
  return null;
}

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.teacherId) filter.teacher = req.query.teacherId;
    const entries = await Timetable.find(filter).populate(populate);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  const { classId, day, period, startTime, endTime, subjectId, teacherId } = req.body;
  if (!classId || !day || !period || !subjectId || !teacherId) {
    return res.status(400).json({ message: 'Class, day, period, subject and teacher are required' });
  }
  try {
    const conflict = await checkConflicts(classId, teacherId, day, period);
    if (conflict) return res.status(400).json({ message: conflict.message });
    const entry = await Timetable.create({
      class: classId,
      day,
      period,
      startTime: startTime || '',
      endTime: endTime || '',
      subject: subjectId,
      teacher: teacherId,
    });
    res.status(201).json(await Timetable.findById(entry._id).populate(populate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const entry = await Timetable.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Timetable entry not found' });
    const { classId, day, period, startTime, endTime, subjectId, teacherId } = req.body;
    const nextClass = classId || entry.class;
    const nextDay = day || entry.day;
    const nextPeriod = period || entry.period;
    const nextTeacher = teacherId || entry.teacher;

    const conflict = await checkConflicts(nextClass, nextTeacher, nextDay, nextPeriod, entry._id);
    if (conflict) return res.status(400).json({ message: conflict.message });

    entry.class = nextClass;
    entry.day = nextDay;
    entry.period = nextPeriod;
    entry.startTime = startTime !== undefined ? startTime : entry.startTime;
    entry.endTime = endTime !== undefined ? endTime : entry.endTime;
    entry.subject = subjectId || entry.subject;
    entry.teacher = nextTeacher;
    await entry.save();

    res.json(await Timetable.findById(entry._id).populate(populate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Timetable entry removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
