const express = require('express');
const Class = require('../models/Class');
const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const populate = { path: 'classTeacher', populate: { path: 'user', select: 'name email' } };

async function render(id) {
  return Class.findById(id).populate(populate);
}

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const classes = await Class.find().populate(populate).sort({ name: 1 });
    const withCounts = await Promise.all(
      classes.map(async (c) => ({
        ...c.toObject(),
        studentCount: await Student.countDocuments({ class: c._id }),
      }))
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  const { name, room, classTeacher, capacity } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name is required' });
  try {
    const cls = await Class.create({ name, room: room || '', classTeacher, capacity: capacity || 40 });
    res.status(201).json(await render(cls._id));
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A class with this name already exists' });
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const { name, room, classTeacher, capacity } = req.body;
    if (name) cls.name = name;
    if (room !== undefined) cls.room = room;
    if (classTeacher !== undefined) cls.classTeacher = classTeacher || undefined;
    if (capacity !== undefined) cls.capacity = capacity;
    await cls.save();
    res.json(await render(cls._id));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const students = await Student.find({ class: cls._id });
    if (students.length > 0) {
      return res.status(400).json({ message: `Remove the ${students.length} student(s) in this class first` });
    }
    await Timetable.deleteMany({ class: cls._id });
    await cls.deleteOne();
    res.json({ message: 'Class removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
