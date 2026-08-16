const express = require('express');
const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const SchoolSetting = require('../models/SchoolSetting');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const TEMPLATES = ['Bonafide', 'Transfer Certificate', 'Character Certificate', 'Study Certificate', 'School Leaving'];

router.get('/templates', (req, res) => {
  res.json(TEMPLATES);
});

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const list = await Certificate.find({ student: req.user._id }).sort({ issuedDate: -1 });
      return res.json({ list, templates: TEMPLATES });
    }
    if (req.user.role === 'parent') {
      const { studentId } = req.query;
      const student = await Student.findOne({ _id: studentId, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
      const list = await Certificate.find({ student: student.user }).sort({ issuedDate: -1 });
      return res.json({ list, templates: TEMPLATES });
    }
    const list = await Certificate.find()
      .populate('student', 'name')
      .populate({ path: 'student', select: 'name' })
      .sort({ issuedDate: -1 });
    res.json({ list, templates: TEMPLATES });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  try {
    const { template, studentId, purpose, validUntil } = req.body;
    if (!template || !studentId) return res.status(400).json({ message: 'Template and student are required' });
    const year = new Date().getFullYear();
    const seq = (await Certificate.countDocuments()) + 1;
    const doc = await Certificate.create({
      template,
      student: studentId,
      purpose: purpose || '',
      serialNo: `CRT-${year}-${String(seq).padStart(4, '0')}`,
      validUntil: validUntil || undefined,
      issuedBy: req.user._id,
    });
    res.json(await Certificate.findById(doc._id).populate('student', 'name'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id/revoke', authorize('principal'), async (req, res) => {
  try {
    const doc = await Certificate.findByIdAndUpdate(req.params.id, { status: 'Revoked' }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Certificate not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id/print', async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    if (req.user.role === 'student' && cert.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your certificate' });
    }
    const student = await Student.findById(cert.student).populate('user', 'name').populate('class', 'name');
    if (req.user.role === 'parent') {
      const child = await Student.findOne({ _id: student._id, parent: req.user._id });
      if (!child) return res.status(403).json({ message: 'Not your child' });
    }
    const school = await SchoolSetting.get();
    res.json({ cert, student, school, principalName: school.principalName || 'Principal' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;