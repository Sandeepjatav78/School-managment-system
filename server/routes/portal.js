const express = require('express');
const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

const ttPopulate = [
  { path: 'class', select: 'name room' },
  { path: 'subject', select: 'name code color' },
  { path: 'teacher', populate: { path: 'user', select: 'name' } },
];

const ttRouter = express.Router();
const studentRouter = express.Router();
const parentRouter = express.Router();

/* ------------------------------ TEACHER ------------------------------ */
ttRouter.use(protect, authorize('teacher'));

async function getTeacherDoc(user) {
  return Teacher.findOne({ user: user._id });
}

ttRouter.get('/timetable', async (req, res) => {
  try {
    const teacher = await getTeacherDoc(req.user);
    if (!teacher) return res.json([]);
    const entries = await Timetable.find({ teacher: teacher._id }).populate(ttPopulate).sort({ day: 1, period: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

ttRouter.get('/subjects', async (req, res) => {
  try {
    const teacher = await getTeacherDoc(req.user);
    if (!teacher) return res.json([]);
    const entries = await Timetable.find({ teacher: teacher._id })
      .populate('subject', 'name code color')
      .populate('class', 'name');
    const map = new Map();
    for (const e of entries) {
      const key = e.subject._id.toString();
      if (!map.has(key)) {
        map.set(key, { ...e.subject.toObject(), classes: [] });
      }
      if (!map.get(key).classes.some((c) => c._id.toString() === e.class._id.toString())) {
        map.get(key).classes.push(e.class);
      }
    }
    res.json([...map.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

ttRouter.get('/class-students', async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: 'classId is required' });
  try {
    const students = await Student.find({ class: classId })
      .populate('user', 'name')
      .sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

ttRouter.get('/history', async (req, res) => {
  try {
    const records = await Attendance.find({ markedBy: req.user._id })
      .populate('subject', 'name code color')
      .populate('class', 'name')
      .populate({ path: 'student', select: 'name' })
      .sort({ date: -1 })
      .limit(100);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------ STUDENT ------------------------------ */
studentRouter.use(protect, authorize('student'));

async function getStudentDoc(user) {
  return Student.findOne({ user: user._id }).populate('class');
}

studentRouter.get('/timetable', async (req, res) => {
  try {
    const student = await getStudentDoc(req.user);
    if (!student) return res.json([]);
    const entries = await Timetable.find({ class: student.class._id }).populate(ttPopulate).sort({ day: 1, period: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

studentRouter.get('/subjects', async (req, res) => {
  try {
    const student = await getStudentDoc(req.user);
    if (!student) return res.json([]);
    const entries = await Timetable.find({ class: student.class._id })
      .populate('subject', 'name code color')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });
    const map = new Map();
    for (const e of entries) {
      const key = e.subject._id.toString();
      if (!map.has(key)) {
        map.set(key, { ...e.subject.toObject(), periodsPerWeek: 0, teachers: [] });
      }
      const item = map.get(key);
      item.periodsPerWeek += 1;
      const tName = e.teacher?.user?.name || '—';
      if (!item.teachers.some((t) => t === tName)) item.teachers.push(tName);
    }
    res.json([...map.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

studentRouter.get('/profile', async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('class');
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    res.json({
      profile: {
        ...student.toObject(),
        isProfileComplete: student.isProfileComplete(),
        hasEditAccess: student.hasEditAccess(),
      },
      user: { name: req.user.name, email: req.user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const EDITABLE_FIELDS = [
  'photo',
  'phone',
  'address',
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'guardianName',
  'guardianPhone',
  'emergencyContact',
];

studentRouter.put('/profile', async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    if (!student.hasEditAccess()) {
      return res.status(403).json({
        message: 'Your edit access has expired. Please ask the school office to grant you access again.',
      });
    }
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        if (field === 'dateOfBirth') student[field] = req.body[field] || undefined;
        else student[field] = req.body[field];
      }
    }
    await student.save();
    res.json({
      profile: {
        ...(await Student.findById(student._id).populate('class')).toObject(),
        isProfileComplete: student.isProfileComplete(),
        hasEditAccess: student.hasEditAccess(),
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

studentRouter.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('subject', 'name code color')
      .sort({ date: -1 });
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    res.json({ records, summary: { total, present, late, absent, rate: total ? Math.round(((present + late) / total) * 100) : 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------- PARENT ------------------------------ */
parentRouter.use(protect, authorize('parent'));

parentRouter.get('/children', async (req, res) => {
  try {
    const children = await Student.find({ parent: req.user._id })
      .populate('class', 'name room')
      .populate({ path: 'user', select: 'name email' });
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

parentRouter.get('/timetable', async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ message: 'studentId is required' });
  try {
    const student = await Student.findOne({ _id: studentId, parent: req.user._id });
    if (!student) return res.status(403).json({ message: 'Not your child' });
    const entries = await Timetable.find({ class: student.class }).populate(ttPopulate).sort({ day: 1, period: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

parentRouter.get('/attendance', async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ message: 'studentId is required' });
  try {
    const student = await Student.findOne({ _id: studentId, parent: req.user._id });
    if (!student) return res.status(403).json({ message: 'Not your child' });
    const records = await Attendance.find({ student: student.user })
      .populate('subject', 'name code color')
      .sort({ date: -1 });
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    res.json({ records, summary: { total, present, late, absent, rate: total ? Math.round(((present + late) / total) * 100) : 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { teacher: ttRouter, student: studentRouter, parent: parentRouter };
