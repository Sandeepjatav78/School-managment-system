const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const { validatePassword } = require('../utils/validate');

const router = express.Router();
router.use(protect);

const populate = [
  { path: 'user', select: 'name email' },
  { path: 'class', select: 'name' },
  { path: 'parent', select: 'name email' },
];

async function render(id) {
  return Student.findById(id).populate(populate);
}

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.class = req.query.classId;
    const students = await Student.find(filter).populate(populate).sort({ 'class.name': 1, rollNo: 1 });
    res.json(students.map((s) => ({ ...s.toObject(), isProfileComplete: s.isProfileComplete() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-class/:classId', authorize('principal'), async (req, res) => {
  try {
    const students = await Student.find({ class: req.params.classId })
      .populate(populate)
      .sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  const { name, email, password, admissionNo, rollNo, classId, phone, address, parentEmail } = req.body;
  if (!name || !email || !password || !admissionNo || !classId) {
    return res.status(400).json({ message: 'Name, email, password, admission no and class are required' });
  }
  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ message: pwError });
  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'A user with this email already exists' });

    let parent = null;
    if (parentEmail) {
      parent = await User.findOne({ email: parentEmail.toLowerCase().trim(), role: 'parent' });
      if (!parent) return res.status(400).json({ message: 'Parent account not found with that email' });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'student',
    });
    const student = await Student.create({
      user: user._id,
      admissionNo,
      rollNo,
      class: classId,
      phone: phone || '',
      address: address || '',
      parent: parent ? parent._id : undefined,
    });
    res.status(201).json(await render(student._id));
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Admission number already in use' });
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const {
      name,
      email,
      password,
      rollNo,
      classId,
      phone,
      address,
      parentEmail,
      photo,
      dateOfBirth,
      gender,
      bloodGroup,
      guardianName,
      guardianPhone,
      emergencyContact,
      editAccessUntil,
    } = req.body;
    const user = await User.findById(student.user);
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

    if (rollNo !== undefined) student.rollNo = rollNo;
    if (classId) student.class = classId;
    if (phone !== undefined) student.phone = phone;
    if (address !== undefined) student.address = address;
    if (photo !== undefined) student.photo = photo;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth || undefined;
    if (gender !== undefined) student.gender = gender;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (emergencyContact !== undefined) student.emergencyContact = emergencyContact;
    if (editAccessUntil !== undefined) student.editAccessUntil = editAccessUntil || undefined;
    if (parentEmail !== undefined) {
      if (!parentEmail) student.parent = undefined;
      else {
        const parent = await User.findOne({ email: parentEmail.toLowerCase().trim(), role: 'parent' });
        if (!parent) return res.status(400).json({ message: 'Parent account not found with that email' });
        student.parent = parent._id;
      }
    }
    await student.save();

    res.json(await render(student._id));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/grant-edit', authorize('principal'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const days = Number(req.body.days) || 1;
    student.editAccessUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await student.save();
    res.json({
      message: 'Edit access granted',
      editAccessUntil: student.editAccessUntil,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await User.deleteOne({ _id: student.user });
    await student.deleteOne();
    res.json({ message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
