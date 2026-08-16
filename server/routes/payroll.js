const express = require('express');
const Payslip = require('../models/Payslip');
const SalaryStructure = require('../models/SalaryStructure');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const teacherPopulate = { path: 'teacher', populate: { path: 'user', select: 'name' } };

function computePay(st) {
  const earnings = [{ name: 'Basic', amount: st.basic }, { name: 'HRA', amount: st.hra }, { name: 'DA', amount: st.da }];
  st.allowances.forEach((a) => earnings.push({ name: a.name, amount: a.amount }));
  const gross = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const deductions = (st.deductions || []).map((d) => ({ name: d.name, amount: d.amount }));
  const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);
  return { earnings, deductions, gross, totalDeductions, net: gross - totalDeductions };
}

/* ------------------------------ Salary structures ------------------------------ */

router.get('/structures', authorize('principal'), async (req, res) => {
  try {
    const structures = await SalaryStructure.find().populate(teacherPopulate);
    const teachers = await Teacher.find().populate('user', 'name').sort({ employeeId: 1 });
    res.json({ structures, teachers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/structures/bulk', authorize('principal'), async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Provide at least one salary structure' });
    }
    const ops = items.map((i) => ({
      updateOne: {
        filter: { teacher: i.teacherId },
        update: {
          $set: {
            teacher: i.teacherId,
            basic: Number(i.basic) || 0,
            hra: Number(i.hra) || 0,
            da: Number(i.da) || 0,
            allowances: i.allowances || [],
            deductions: i.deductions || [],
          },
        },
        upsert: true,
      },
    }));
    await SalaryStructure.bulkWrite(ops);
    const structures = await SalaryStructure.find().populate(teacherPopulate);
    res.json(structures);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* --------------------------------- Payslips --------------------------------- */

router.get('/', authorize('principal'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) filter.month = req.query.month;
    const list = await Payslip.find(filter).populate(teacherPopulate).sort({ month: -1, 'teacher.user.name': 1 });
    const months = await Payslip.distinct('month');
    const total = await Payslip.aggregate([
      { $match: req.query.month ? { month: req.query.month } : {} },
      { $group: { _id: null, gross: { $sum: '$gross' }, net: { $sum: '$net' }, count: { $sum: 1 } } },
    ]);
    res.json({ list, months: months.sort().reverse(), summary: total[0] || { gross: 0, net: 0, count: 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.json([]);
    const list = await Payslip.find({ teacher: teacher._id }).sort({ month: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/generate', authorize('principal'), async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ message: 'Month is required (YYYY-MM)' });
    const structures = await SalaryStructure.find().populate('teacher');
    const teachers = await Teacher.find();
    if (structures.length === 0 && teachers.length === 0) {
      return res.status(400).json({ message: 'No teachers available' });
    }
    const stMap = new Map(structures.map((s) => [s.teacher._id.toString(), s]));
    const ops = [];
    let created = 0;
    for (const t of teachers) {
      const st = stMap.get(t._id.toString());
      if (!st) continue;
      const pay = computePay(st);
      ops.push({
        updateOne: {
          filter: { teacher: t._id, month },
          update: {
            $set: {
              teacher: t._id,
              month,
              basic: st.basic,
              hra: st.hra,
              da: st.da,
              allowances: pay.earnings.slice(3),
              deductions: pay.deductions,
              gross: pay.gross,
              totalDeductions: pay.totalDeductions,
              net: pay.net,
              status: 'Generated',
              generatedBy: req.user._id,
            },
          },
          upsert: true,
        },
      });
      created++;
    }
    if (ops.length > 0) await Payslip.bulkWrite(ops);
    const list = await Payslip.find({ month }).populate(teacherPopulate);
    res.json({ message: `Payslips ready for ${created} teachers`, list });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/pay', authorize('principal'), async (req, res) => {
  try {
    const doc = await Payslip.findByIdAndUpdate(req.params.id, { status: 'Paid', paidOn: new Date() }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Payslip not found' });
    res.json(await Payslip.findById(doc._id).populate(teacherPopulate));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;