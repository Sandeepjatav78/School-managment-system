const express = require('express');
const Notice = require('../models/Notice');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const populate = [
  { path: 'targetClass', select: 'name' },
  { path: 'publishedBy', select: 'name' },
];

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const notices = await Notice.find().populate(populate).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('principal'), async (req, res) => {
  const { title, body, audience, targetClass } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Title and message are required' });
  try {
    const notice = await Notice.create({
      title,
      body,
      audience: audience || 'all',
      targetClass: audience === 'class' ? targetClass : undefined,
      publishedBy: req.user._id,
    });
    res.status(201).json(await Notice.findById(notice._id).populate(populate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authorize('principal'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    const { title, body, audience, targetClass } = req.body;
    if (title) notice.title = title;
    if (body) notice.body = body;
    if (audience) {
      notice.audience = audience;
      notice.targetClass = audience === 'class' ? targetClass : undefined;
    }
    await notice.save();
    res.json(await Notice.findById(notice._id).populate(populate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authorize('principal'), async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      filter = {
        $or: [
          { audience: { $in: ['all', 'students'] } },
          { audience: 'class', targetClass: student?.class },
        ],
      };
    } else if (req.user.role === 'teacher') {
      filter = { audience: { $in: ['all', 'teachers'] } };
    } else {
      filter = { audience: { $in: ['all', 'parents'] } };
    }
    const notices = await Notice.find(filter).populate(populate).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
