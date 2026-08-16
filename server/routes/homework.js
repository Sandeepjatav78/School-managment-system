const express = require('express');
const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const populate = [
  { path: 'class', select: 'name' },
  { path: 'subject', select: 'name code color' },
  { path: 'teacher', populate: { path: 'user', select: 'name' } },
];

const subPopulate = [
  { path: 'student', select: 'name' },
  { path: 'homework', select: 'title subject dueDate' },
];

/* --------------------------------- List --------------------------------- */

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.subjectId) filter.subject = req.query.subjectId;
    if (req.query.mine === 'true' && req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher) filter.teacher = teacher._id;
    }
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.json([]);
      filter.class = student.class;
      const list = await Homework.find(filter).populate(populate).sort({ dueDate: -1 });
      const subs = await HomeworkSubmission.find({ student: req.user._id });
      const subMap = new Map(subs.map((s) => [s.homework.toString(), s]));
      return res.json(
        list.map((h) => {
          const sub = subMap.get(h._id.toString());
          const overdue = h.dueDate && new Date(h.dueDate) < new Date();
          return {
            ...h.toObject(),
            mySubmission: sub || null,
            overdue,
            canSubmit: !sub || sub.status === 'Submitted',
          };
        })
      );
    }
    if (req.user.role === 'parent') {
      const { studentId } = req.query;
      const student = await Student.findOne({ _id: studentId, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
      filter.class = student.class;
    }
    const list = await Homework.find(filter).populate(populate).sort({ dueDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------- CRUD ------------------------------- */

router.post('/', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { title, description, class: cls, subject, dueDate, attachments } = req.body;
    if (!title || !cls || !subject) {
      return res.status(400).json({ message: 'Title, class and subject are required' });
    }
    let teacher;
    if (req.user.role === 'teacher') {
      teacher = await Teacher.findOne({ user: req.user._id });
    }
    const hw = await Homework.create({
      title,
      description: description || '',
      class: cls,
      subject,
      teacher: teacher?._id,
      dueDate: dueDate || undefined,
      attachments: Array.isArray(attachments) ? attachments : [],
    });
    res.json(await Homework.findById(hw._id).populate(populate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).json({ message: 'Homework not found' });
    if (req.user.role === 'teacher' && hw.teacher) {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (hw.teacher.toString() !== teacher?._id.toString()) {
        return res.status(403).json({ message: 'You can only edit your own homework' });
      }
    }
    Object.assign(hw, req.body);
    await hw.save();
    res.json(await Homework.findById(hw._id).populate(populate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('teacher', 'principal'), async (req, res) => {
  try {
    await HomeworkSubmission.deleteMany({ homework: req.params.id });
    await Homework.findByIdAndDelete(req.params.id);
    res.json({ message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------ Submissions ------------------------------ */

router.get('/:id/submissions', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const submissions = await HomeworkSubmission.find({ homework: req.params.id }).populate(subPopulate).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/submit', authorize('student'), async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).json({ message: 'Homework not found' });
    const student = await Student.findOne({ user: req.user._id });
    if (!student || student.class.toString() !== hw.class.toString()) {
      return res.status(403).json({ message: 'Not your homework' });
    }
    const existing = await HomeworkSubmission.findOne({ homework: hw._id, student: req.user._id });
    const late = hw.dueDate && new Date(hw.dueDate) < new Date();
    const data = {
      homework: hw._id,
      student: req.user._id,
      text: req.body.text || '',
      status: late ? 'Late' : 'Submitted',
    };
    let doc;
    if (existing) {
      Object.assign(existing, data);
      doc = await existing.save();
    } else {
      doc = await HomeworkSubmission.create(data);
    }
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/submissions/:sid/check', authorize('teacher', 'principal'), async (req, res) => {
  try {
    const sub = await HomeworkSubmission.findById(req.params.sid);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    sub.status = 'Checked';
    if (req.body.grade !== undefined) sub.grade = req.body.grade;
    if (req.body.remarks !== undefined) sub.remarks = req.body.remarks;
    await sub.save();
    res.json(await HomeworkSubmission.findById(sub._id).populate(subPopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;