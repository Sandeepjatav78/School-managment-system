const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const SchoolSetting = require('../models/SchoolSetting');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
}

async function enrichUser(user) {
  const out = { ...user.toObject() };
  try {
    const settings = await SchoolSetting.get();
    out.features = settings.features;
  } catch {
    out.features = {};
  }
  if (user.role === 'teacher') {
    out.profile = await Teacher.findOne({ user: user._id }).populate('subjects', 'name code color');
  } else if (user.role === 'student') {
    out.profile = await Student.findOne({ user: user._id })
      .populate('class')
      .populate({ path: 'parent', select: 'name email' });
  } else if (user.role === 'parent') {
    out.children = await Student.find({ parent: user._id })
      .populate('class')
      .populate({ path: 'user', select: 'name email' });
  }
  return out;
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: signToken(user), user: await enrichUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    res.json({ user: await enrichUser(req.user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
