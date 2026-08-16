const express = require('express');
const Syllabus = require('../models/Syllabus');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.subjectId) filter.subject = req.query.subjectId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.json([]);
      filter.class = student.class;
    } else if (req.user.role === 'parent') {
      const { studentId } = req.query;
      const student = await Student.findOne({ _id: studentId, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
      filter.class = student.class;
    } else if (req.user.role === 'teacher' && req.query.mine === 'true') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher) return res.json([]);
      const teacherSubjects = teacher.subjects.map((s) => s.toString());
      const all = await Syllabus.find({ ...filter })
        .populate('class', 'name')
        .populate('subject', 'name code color');
      return res.json(all.filter((s) => teacherSubjects.includes(s.subject._id.toString())));
    }
    const list = await Syllabus.find(filter)
      .populate('class', 'name')
      .populate('subject', 'name code color')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ 'class.name': 1, 'subject.name': 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { class: cls, subject, chapters } = req.body;
    if (!cls || !subject) return res.status(400).json({ message: 'Class and subject are required' });
    let teacher;
    if (req.user.role === 'teacher') {
      teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher.subjects.map((s) => s.toString()).includes(subject)) {
        return res.status(403).json({ message: 'You can only manage your own subjects' });
      }
    }
    const doc = await Syllabus.findOneAndUpdate(
      { class: cls, subject },
      { $set: { class: cls, subject, teacher: teacher?._id, chapters: chapters || [] } },
      { upsert: true, new: true }
    );
    res.json(await Syllabus.findById(doc._id).populate('class', 'name').populate('subject', 'name code color'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const doc = await Syllabus.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Syllabus not found' });
    if (req.body.chapters) doc.chapters = req.body.chapters;
    if (req.body.teacher !== undefined) doc.teacher = req.body.teacher;
    await doc.save();
    res.json(await Syllabus.findById(doc._id).populate('class', 'name').populate('subject', 'name code color'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/chapters', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const doc = await Syllabus.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Syllabus not found' });
    const { title, description, status, week } = req.body;
    if (!title) return res.status(400).json({ message: 'Chapter title is required' });
    doc.chapters.push({ title, description: description || '', status: status || 'Planned', week: week || '' });
    await doc.save();
    res.json(await Syllabus.findById(doc._id).populate('class', 'name').populate('subject', 'name code color'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id/chapters/:chapterId', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const doc = await Syllabus.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Syllabus not found' });
    const ch = doc.chapters.id(req.params.chapterId);
    if (!ch) return res.status(404).json({ message: 'Chapter not found' });
    Object.assign(ch, req.body);
    await doc.save();
    res.json(await Syllabus.findById(doc._id).populate('class', 'name').populate('subject', 'name code color'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id/chapters/:chapterId', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const doc = await Syllabus.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Syllabus not found' });
    doc.chapters.pull(req.params.chapterId);
    await doc.save();
    res.json(await Syllabus.findById(doc._id).populate('class', 'name').populate('subject', 'name code color'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;