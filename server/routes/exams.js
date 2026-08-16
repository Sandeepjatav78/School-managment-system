const express = require('express');
const Exam = require('../models/Exam');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const subjectPopulate = { path: 'subjects.subject', select: 'name code color' };

function gradeFor(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '—';
  if (pct >= 90) return 'A1';
  if (pct >= 80) return 'A2';
  if (pct >= 70) return 'B1';
  if (pct >= 60) return 'B2';
  if (pct >= 50) return 'C1';
  if (pct >= 40) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
}

function gradePoint(g) {
  return { A1: 10, A2: 9, B1: 8, B2: 7, C1: 6, C2: 5, D: 4, E: 3 }[g] ?? 0;
}

async function canManageExam(req, exam) {
  if (req.user.role === 'principal') return true;
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return false;
    const subjectIds = teacher.subjects.map((s) => s.toString());
    return exam.subjects.some((s) => subjectIds.includes(s.subject.toString()));
  }
  return false;
}

/* ------------------------------- List / CRUD ------------------------------- */

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.class = req.query.classId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) filter.class = student.class;
    } else if (req.user.role === 'parent') {
      if (!req.query.classId) return res.json([]);
    }
    const exams = await Exam.find(filter).populate('class', 'name').populate(subjectPopulate).sort({ startDate: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json([]);
    const exams = await Exam.find({ class: student.class }).populate('class', 'name').populate(subjectPopulate).sort({ startDate: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  try {
    const { name, type, class: cls, subjects, startDate, endDate, session } = req.body;
    if (!name || !cls || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Name, class and at least one subject are required' });
    }
    const exam = await Exam.create({
      name,
      type,
      class: cls,
      subjects: subjects.map((s) => ({
        subject: s.subject,
        maxMarks: Number(s.maxMarks) || 100,
        date: s.date || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
      })),
      startDate: startDate || '',
      endDate: endDate || '',
      session,
      createdBy: req.user._id,
    });
    res.json(await Exam.findById(exam._id).populate('class', 'name').populate(subjectPopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const { name, type, class: cls, subjects, startDate, endDate, session, status } = req.body;
    if (name) exam.name = name;
    if (type) exam.type = type;
    if (cls) exam.class = cls;
    if (startDate !== undefined) exam.startDate = startDate;
    if (endDate !== undefined) exam.endDate = endDate;
    if (session !== undefined) exam.session = session;
    if (status) exam.status = status;
    if (Array.isArray(subjects)) {
      exam.subjects = subjects.map((s) => ({
        subject: s.subject,
        maxMarks: Number(s.maxMarks) || 100,
        date: s.date || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
      }));
    }
    await exam.save();
    res.json(await Exam.findById(exam._id).populate('class', 'name').populate(subjectPopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    await Mark.deleteMany({ exam: req.params.id });
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/publish', authorize('principal'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, { status: 'Result Published' }, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Results published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* --------------------------- Marks entry (results) -------------------------- */

router.get('/:id/results', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('class', 'name').populate(subjectPopulate);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student.class.toString() !== exam.class._id.toString()) {
        return res.status(403).json({ message: 'Not your exam' });
      }
      const marks = await Mark.find({ exam: exam._id, student: req.user._id }).populate('subject', 'name code color');
      const rows = exam.subjects.map((s) => {
        const m = marks.find((x) => x.subject._id.toString() === s.subject._id.toString());
        return { subject: s.subject, maxMarks: s.maxMarks, marksObtained: m?.marksObtained, grade: m?.grade };
      });
      return res.json(buildStudentResult(rows));
    }

    if (req.user.role === 'parent') {
      const { studentId } = req.query;
      const student = await Student.findOne({ _id: studentId, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
      const marks = await Mark.find({ exam: exam._id, student: student.user }).populate('subject', 'name code color');
      const rows = exam.subjects.map((s) => {
        const m = marks.find((x) => x.subject._id.toString() === s.subject._id.toString());
        return { subject: s.subject, maxMarks: s.maxMarks, marksObtained: m?.marksObtained, grade: m?.grade };
      });
      return res.json(buildStudentResult(rows));
    }

    const teacher = req.user.role === 'teacher' ? await Teacher.findOne({ user: req.user._id }) : null;
    const canEditAll = req.user.role === 'principal';
    const editableSubjects = canEditAll ? null : new Set((teacher?.subjects || []).map((s) => s.toString()));

    const students = await Student.find({ class: exam.class._id })
      .populate('user', 'name')
      .sort({ rollNo: 1 });
    const marks = await Mark.find({ exam: exam._id }).populate('subject', 'name code color');
    const results = students.map((st) => {
      const rows = exam.subjects.map((s) => {
        const m = marks.find((x) => x.student.toString() === st.user._id.toString() && x.subject._id.toString() === s.subject._id.toString());
        const pct = m?.marksObtained != null && s.maxMarks ? Math.round((m.marksObtained / s.maxMarks) * 100) : null;
        return {
          subject: s.subject,
          maxMarks: s.maxMarks,
          marksObtained: m?.marksObtained ?? null,
          grade: m?.grade || gradeFor(pct),
          editable: canEditAll || editableSubjects?.has(s.subject._id.toString()),
        };
      });
      const agg = aggregate(rows);
      return { student: st.user, rollNo: st.rollNo, rows, ...agg };
    });
    results.sort((a, b) => (b.totalObtained ?? -1) - (a.totalObtained ?? -1));
    results.forEach((r, i) => {
      r.rank = r.totalObtained != null ? i + 1 : null;
    });
    res.json({ exam, results, subjectNames: exam.subjects.map((s) => s.subject) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function aggregate(rows) {
  let maxTotal = 0;
  let totalObtained = 0;
  let marked = 0;
  let points = 0;
  for (const r of rows) {
    if (!r.maxMarks) continue;
    maxTotal += r.maxMarks;
    if (r.marksObtained != null) {
      totalObtained += r.marksObtained;
      marked += 1;
      const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
      points += gradePoint(gradeFor(pct));
    }
  }
  const percentage = marked ? Math.round((totalObtained / maxTotal) * 100) : null;
  return {
    maxTotal,
    totalObtained: marked ? totalObtained : null,
    percentage,
    grade: percentage != null ? gradeFor(percentage) : null,
    gradePoints: marked ? points / marked : null,
    markedSubjects: marked,
  };
}

function buildStudentResult(rows) {
  const agg = aggregate(rows);
  return { rows, ...agg };
}

router.post('/:id/marks', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!(await canManageExam(req, exam))) {
      return res.status(403).json({ message: 'You can only enter marks for subjects you teach' });
    }
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Provide at least one mark entry' });
    }
    const ops = items.map((i) => {
      const marksObtained = i.marksObtained === '' || i.marksObtained == null ? null : Number(i.marksObtained);
      const maxMarks = Number(i.maxMarks) || 100;
      const pct = marksObtained != null ? Math.round((marksObtained / maxMarks) * 100) : null;
      return {
        updateOne: {
          filter: { exam: exam._id, student: i.student, subject: i.subject },
          update: {
            $set: {
              exam: exam._id,
              student: i.student,
              subject: i.subject,
              marksObtained,
              maxMarks,
              grade: gradeFor(pct),
              remarks: i.remarks || '',
              enteredBy: req.user._id,
            },
          },
          upsert: true,
        },
      };
    });
    await Mark.bulkWrite(ops);
    const count = await Mark.countDocuments({ exam: exam._id });
    if (exam.status === 'Scheduled') await exam.updateOne({ status: 'In Progress' });
    res.json({ message: `Marks saved (${count} total entries)` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ------------------------------ Hall ticket ------------------------------- */

router.get('/:id/hall-ticket', authorize('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('class', 'name room').populate(subjectPopulate);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    const student = await Student.findOne({ user: req.user._id }).populate('class', 'name');
    if (!student || student.class._id.toString() !== exam.class._id.toString()) {
      return res.status(403).json({ message: 'Not your exam' });
    }
    res.json({
      exam,
      student: {
        name: req.user.name,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class.name,
        photo: student.photo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('class', 'name').populate(subjectPopulate);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;