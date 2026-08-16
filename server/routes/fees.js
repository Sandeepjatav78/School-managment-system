const express = require('express');
const Fee = require('../models/Fee');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const recordPopulate = [
  { path: 'student', select: 'name' },
  { path: 'class', select: 'name' },
];

/* ------------------------------ Fee structures ----------------------------- */

router.get('/structures', authorize('principal'), async (req, res) => {
  try {
    const structures = await FeeStructure.find().populate('class', 'name');
    res.json(structures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/structures/bulk', authorize('principal'), async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one fee structure is required' });
  }
  try {
    const ops = items
      .filter((i) => i.classId)
      .map((i) => {
        const heads = Array.isArray(i.heads)
          ? i.heads.filter((h) => h.name).map((h) => ({ name: h.name, amount: Number(h.amount) || 0 }))
          : [];
        const total = heads.length > 0 ? heads.reduce((s, h) => s + h.amount, 0) : Number(i.monthlyFee) || 0;
        return {
          updateOne: {
            filter: { class: i.classId },
            update: { $set: { class: i.classId, monthlyFee: total, heads } },
            upsert: true,
          },
        };
      });
    if (ops.length === 0) return res.status(400).json({ message: 'Provide a class and a monthly fee' });
    await FeeStructure.bulkWrite(ops);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await generateForMonth(month, items.map((i) => i.classId));

    const structures = await FeeStructure.find().populate('class', 'name');
    res.json(structures);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function generateForMonth(month, classIds) {
  const structures = await FeeStructure.find({ class: { $in: classIds } });
  const ops = [];
  for (const st of structures) {
    const students = await Student.find({ class: st.class });
    for (const s of students) {
      ops.push({
        updateOne: {
          filter: { student: s.user, month },
          update: { $set: { student: s.user, class: st.class, month, amount: st.totalMonthlyFee() } },
          upsert: true,
        },
      });
    }
  }
  if (ops.length > 0) await Fee.bulkWrite(ops);
  return ops.length;
}

router.post('/generate', authorize('principal'), async (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ message: 'Month is required (YYYY-MM)' });
  try {
    const classes = await Class.find();
    const count = await generateForMonth(month, classes.map((c) => c._id));
    res.json({ message: `Fee records generated for ${month}`, count });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* --------------------------------- Records --------------------------------- */

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) filter.month = req.query.month;
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.status) filter.status = req.query.status;

    const [records, monthAgg, allPending] = await Promise.all([
      Fee.find(filter)
        .populate(recordPopulate)
        .sort({ month: -1, 'student.name': 1 }),
      Fee.aggregate([
        { $match: req.query.month ? { month: req.query.month } : {} },
        {
          $group: {
            _id: null,
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            pendingAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0] },
            },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
            paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] } },
          },
        },
      ]),
      Fee.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),
    ]);

    const monthSummary = monthAgg[0] || {
      pendingCount: 0,
      pendingAmount: 0,
      paidCount: 0,
      paidAmount: 0,
    };
    const pending = allPending[0] || { count: 0, amount: 0 };

    res.json({
      records,
      monthSummary: { ...monthSummary, month: req.query.month || null },
      totalPending: { count: pending.count, amount: pending.amount },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/pay', authorize('principal'), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    const discount = Math.min(Math.max(Number(req.body.discount) || 0, 0), fee.amount);
    fee.status = 'Paid';
    fee.discount = discount;
    fee.paidAmount = fee.amount - discount;
    fee.mode = req.body.mode || 'Cash';
    if (!fee.receiptNo) {
      const d = new Date();
      const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const seq = (await Fee.countDocuments({ receiptNo: { $regex: `^RCPT-${datePart}` } })) + 1;
      fee.receiptNo = `RCPT-${datePart}-${String(seq).padStart(3, '0')}`;
    }
    fee.paidDate = new Date();
    fee.paidBy = req.user._id;
    await fee.save();
    res.json(await Fee.findById(fee._id).populate(recordPopulate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/unpay', authorize('principal'), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    fee.status = 'Pending';
    fee.paidDate = undefined;
    fee.paidBy = undefined;
    fee.mode = '';
    fee.receiptNo = undefined;
    fee.discount = 0;
    fee.paidAmount = 0;
    await fee.save();
    res.json(await Fee.findById(fee._id).populate(recordPopulate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* --------------------------------- Receipts --------------------------------- */

router.get('/receipts', authorize('principal'), async (req, res) => {
  try {
    const filter = { status: 'Paid' };
    if (req.query.month) filter.month = req.query.month;
    const receipts = await Fee.find(filter).populate(recordPopulate).sort({ paidDate: -1 }).limit(500);
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/receipts/:id', async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({ path: 'student', select: 'name' })
      .populate('class', 'name');
    if (!fee) return res.status(404).json({ message: 'Receipt not found' });
    if (fee.student?._id?.toString() !== req.user._id?.toString() && req.user.role !== 'principal' && req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (req.user.role === 'parent') {
      const student = await Student.findOne({ user: fee.student._id, parent: req.user._id });
      if (!student) return res.status(403).json({ message: 'Not your child' });
    }
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* --------------------------- Student / parent view ------------------------- */

router.get('/student/mine', authorize('student'), async (req, res) => {
  try {
    const records = await Fee.find({ student: req.user._id })
      .populate(recordPopulate)
      .sort({ month: -1 });
    res.json(await feeSummary(req.user._id, records));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/student/:studentId', authorize('parent'), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, parent: req.user._id });
    if (!student) return res.status(403).json({ message: 'Not your child' });
    const records = await Fee.find({ student: student.user })
      .populate(recordPopulate)
      .sort({ month: -1 });
    res.json(await feeSummary(student.user, records));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function feeSummary(studentId, records) {
  const summary = {
    totalCount: records.length,
    pendingCount: 0,
    pendingAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    lastPendingMonth: null,
  };
  for (const r of records) {
    if (r.status === 'Pending') {
      summary.pendingCount += 1;
      summary.pendingAmount += r.amount;
      if (!summary.lastPendingMonth || r.month > summary.lastPendingMonth) summary.lastPendingMonth = r.month;
    } else {
      summary.paidCount += 1;
      summary.paidAmount += r.amount;
    }
  }
  return { studentId, records, summary };
}

module.exports = router;
