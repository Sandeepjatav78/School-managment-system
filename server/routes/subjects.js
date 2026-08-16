const express = require('express');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  const { name, code, color } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
  try {
    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      color: color || '#4f46e5',
    });
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'A subject with this code already exists' });
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    const { name, code, color } = req.body;
    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (color !== undefined) subject.color = color;
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
