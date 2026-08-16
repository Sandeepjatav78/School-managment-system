const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const { protect, authorize } = require('../middleware/auth');
const { validatePassword } = require('../utils/validate');

const router = express.Router();
router.use(protect);

const populate = [
  { path: 'user', select: 'name email' },
  { path: 'subjects', select: 'name code color' },
];

async function render(id) {
  return Teacher.findById(id).populate(populate);
}

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const teachers = await Teacher.find().populate(populate).sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', authorize('principal'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(populate);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  const { name, email, password, employeeId, phone, qualification, subjects, joinDate } = req.body;
  if (!name || !email || !password || !employeeId) {
    return res.status(400).json({ message: 'Name, email, password and employee ID are required' });
  }
  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ message: pwError });
  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'A user with this email already exists' });
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'teacher',
    });
    const teacher = await Teacher.create({
      user: user._id,
      employeeId,
      phone: phone || '',
      qualification: qualification || '',
      subjects: subjects || [],
      joinDate: joinDate || undefined,
    });
    res.status(201).json(await render(teacher._id));
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Employee ID already in use' });
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const { name, email, password, phone, qualification, subjects, joinDate } = req.body;
    const user = await User.findById(teacher.user);
    if (name) user.name = name;
    if (email) {
      const dup = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (dup) return res.status(400).json({ message: 'A user with this email already exists' });
      user.email = email;
    }
    if (password) {
      const pwError = validatePassword(password);
      if (pwError) return res.status(400).json({ message: pwError });
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();

    if (phone !== undefined) teacher.phone = phone;
    if (qualification !== undefined) teacher.qualification = qualification;
    if (subjects !== undefined) teacher.subjects = subjects;
    if (joinDate !== undefined) teacher.joinDate = joinDate || undefined;
    await teacher.save();

    res.json(await render(teacher._id));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    await Timetable.deleteMany({ teacher: teacher._id });
    await User.deleteOne({ _id: teacher.user });
    await teacher.deleteOne();
    res.json({ message: 'Teacher removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
