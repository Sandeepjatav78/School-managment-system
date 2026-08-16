const express = require('express');
const bcrypt = require('bcryptjs');
const Admission = require('../models/Admission');
const Enquiry = require('../models/Enquiry');
const Class = require('../models/Class');
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('principal'));

/* ------------------------------- Enquiries ------------------------------- */

router.get('/enquiries', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const list = await Enquiry.find(filter).populate('classApplying', 'name').sort({ createdAt: -1 });
    const counts = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const summary = { New: 0, Contacted: 0, Converted: 0, Closed: 0 };
    counts.forEach((c) => (summary[c._id] = c.count));
    res.json({ list, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/enquiries', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
    const doc = await Enquiry.create({ ...req.body, createdBy: req.user._id });
    res.json(await Enquiry.findById(doc._id).populate('classApplying', 'name'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/enquiries/:id', async (req, res) => {
  try {
    const doc = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('classApplying', 'name');
    if (!doc) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/enquiries/:id', async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------------ Applications ------------------------------ */

router.get('/applications', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.classId) filter.classApplying = req.query.classId;
    const list = await Admission.find(filter)
      .populate('classApplying', 'name')
      .populate({ path: 'student', select: 'name email' })
      .sort({ createdAt: -1 });
    const counts = await Admission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const summary = { Applied: 0, 'Under Review': 0, 'Interview Scheduled': 0, Admitted: 0, Rejected: 0, Withdrawn: 0 };
    counts.forEach((c) => (summary[c._id] = c.count));
    res.json({ list, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/applications', async (req, res) => {
  try {
    const { firstName, lastName, parentName, parentPhone, classApplying } = req.body;
    if (!firstName || !parentName || !parentPhone || !classApplying) {
      return res.status(400).json({ message: 'Student name, parent name, phone and class are required' });
    }
    const year = new Date().getFullYear();
    const seq = await Admission.countDocuments() + 1;
    const doc = await Admission.create({
      ...req.body,
      applicationNo: `ADM-${year}-${String(seq).padStart(4, '0')}`,
      documents: req.body.documents || [],
    });
    res.json(await Admission.findById(doc._id).populate('classApplying', 'name'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/applications/:id', async (req, res) => {
  try {
    const doc = await Admission.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('classApplying', 'name');
    if (!doc) return res.status(404).json({ message: 'Application not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/applications/:id', async (req, res) => {
  try {
    await Admission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------- Admit: create student ------------------------- */

router.post('/applications/:id/admit', async (req, res) => {
  try {
    const app = await Admission.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.status === 'Admitted') return res.status(400).json({ message: 'Already admitted' });

    const cls = await Class.findById(app.classApplying);
    if (!cls) return res.status(400).json({ message: 'Class not found' });
    const enrolled = await Student.countDocuments({ class: cls._id });
    if (enrolled >= cls.capacity) {
      return res.status(400).json({ message: `Class ${cls.name} is full (${cls.capacity} seats)` });
    }

    const email = app.parentEmail || `student${app.applicationNo.replace(/[^0-9]/g, '')}@school.com`;
    const user = await User.create({
      name: `${app.firstName} ${app.lastName}`.trim(),
      email,
      password: await bcrypt.hash('welcome123', 10),
      role: 'student',
    });
    const rollNo = enrolled + 1;
    const student = await Student.create({
      user: user._id,
      admissionNo: app.applicationNo.replace('ADM', 'ADM-ADM') === app.applicationNo ? app.applicationNo : app.applicationNo,
      rollNo,
      class: cls._id,
      dateOfBirth: app.dateOfBirth ? new Date(app.dateOfBirth) : undefined,
      gender: app.gender || '',
      guardianName: app.parentName,
      guardianPhone: app.parentPhone,
      address: app.address,
    });

    app.status = 'Admitted';
    app.student = user._id;
    app.admittedOn = new Date();
    app.remarks = req.body.remarks || app.remarks;
    await app.save();

    res.json({
      message: `Student admitted as ${user.name} (Roll ${rollNo})`,
      student: await Student.findById(student._id).populate('user', 'name email'),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ------------------------------ Seat summary ------------------------------ */

router.get('/seats', async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    const students = await Student.find().select('class');
    const enrolledByClass = {};
    students.forEach((s) => {
      const key = s.class.toString();
      enrolledByClass[key] = (enrolledByClass[key] || 0) + 1;
    });
    res.json(
      classes.map((c) => ({
        class: c,
        enrolled: enrolledByClass[c._id.toString()] || 0,
        capacity: c.capacity,
        available: Math.max(0, c.capacity - (enrolledByClass[c._id.toString()] || 0)),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;