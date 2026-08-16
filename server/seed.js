require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const Attendance = require('./models/Attendance');
const FeeStructure = require('./models/FeeStructure');
const Fee = require('./models/Fee');
const TeacherAttendance = require('./models/TeacherAttendance');
const Notice = require('./models/Notice');

const PASSWORD = 'password123';
const PERIOD_TIMES = {
  1: ['08:00', '08:45'],
  2: ['08:45', '09:30'],
  3: ['09:45', '10:30'],
  4: ['10:30', '11:15'],
  5: ['11:30', '12:15'],
  6: ['12:45', '13:30'],
  7: ['13:30', '14:15'],
  8: ['14:15', '15:00'],
};
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function wipe() {
  const models = [
    'User',
    'Teacher',
    'Student',
    'Class',
    'Subject',
    'Timetable',
    'Attendance',
    'FeeStructure',
    'Fee',
    'TeacherAttendance',
    'Notice',
    'Exam',
    'Mark',
    'Homework',
    'HomeworkSubmission',
    'Syllabus',
    'Enquiry',
    'Admission',
    'Book',
    'BookIssue',
    'Vehicle',
    'Route',
    'TransportAssignment',
    'Leave',
    'Event',
    'Certificate',
    'Hostel',
    'HostelRoom',
    'HostelAllotment',
    'SalaryStructure',
    'Payslip',
    'SchoolSetting',
  ];
  for (const m of models) {
    await require(`./models/${m}`).deleteMany({});
  }
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function seedDatabase() {
  await wipe();
  console.log('Seeding Athena School…');

  /* Principal */
  const principal = await User.create({
    name: 'Margaret Hayes',
    email: 'principal@school.com',
    password: await bcrypt.hash(PASSWORD, 10),
    role: 'principal',
  });

  /* Subjects */
  const subjects = [
    { name: 'Mathematics', code: 'MATH', color: '#4f46e5' },
    { name: 'English', code: 'ENG', color: '#0891b2' },
    { name: 'Science', code: 'SCI', color: '#059669' },
    { name: 'History', code: 'HIS', color: '#d97706' },
    { name: 'Computer Science', code: 'CS', color: '#7c3aed' },
    { name: 'Physical Education', code: 'PE', color: '#db2777' },
  ];
  const subjectDocs = await Subject.insertMany(subjects);

  /* Teachers */
  const teacherData = [
    ['Alice Johnson', 't1@school.com', 'TCH-001', 'M.Sc. Mathematics', 'Mathematics'],
    ['Robert Chen', 't2@school.com', 'TCH-002', 'M.Sc. Physics', 'Science'],
    ['Maria Garcia', 't3@school.com', 'TCH-003', 'M.A. English Literature', 'English'],
    ['David Miller', 't4@school.com', 'TCH-004', 'M.A. History', 'History'],
    ['Sarah Wilson', 't5@school.com', 'TCH-005', 'B.Tech Computer Science', 'Computer Science'],
    ['James Brown', 't6@school.com', 'TCH-006', 'B.P.Ed', 'Physical Education'],
  ];
  const teachers = [];
  for (const [name, email, empId, qual, subjName] of teacherData) {
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(PASSWORD, 10),
      role: 'teacher',
    });
    const subject = subjectDocs.find((s) => s.name === subjName);
    const teacher = await Teacher.create({
      user: user._id,
      employeeId: empId,
      qualification: qual,
      subjects: [subject._id],
      joinDate: new Date(`202${1 + (teachers.length % 3)}-0${1 + teachers.length}-15`),
    });
    teachers.push(teacher);
  }

  /* Classes */
  const classes = [];
  for (let i = 6; i <= 8; i++) {
    const cls = await Class.create({
      name: `Grade ${i}-A`,
      room: `Room ${100 + i}`,
      classTeacher: teachers[i - 6]._id,
      capacity: 40,
    });
    classes.push(cls);
  }

  /* Students + parents */
  const parents = [];
  for (let i = 1; i <= 6; i++) {
    parents.push(
      await User.create({
        name: `Parent of S${i}`,
        email: `p${i}@school.com`,
        password: await bcrypt.hash(PASSWORD, 10),
        role: 'parent',
      })
    );
  }

  const firstNames = ['Liam', 'Emma', 'Noah', 'Olivia', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'James', 'Amelia', 'Henry', 'Harper', 'Daniel', 'Evelyn', 'Benjamin'];
  const genders = ['Male', 'Female'];
  const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'O-'];
  const students = [];
  let count = 0;
  for (let c = 0; c < classes.length; c++) {
    for (let r = 1; r <= 6; r++) {
      const parent = parents[(c + r - 1) % 6];
      const user = await User.create({
        name: firstNames[count % firstNames.length],
        email: `s${count + 1}@school.com`,
        password: await bcrypt.hash(PASSWORD, 10),
        role: 'student',
      });
      const full = count < 9;
      await Student.create({
        user: user._id,
        admissionNo: `ADM-2026-${String(101 + count)}`,
        rollNo: r,
        class: classes[c]._id,
        phone: full ? '+91 98111 00000' : '',
        address: full ? '12 Oak Avenue, Springfield' : '',
        parent: parent._id,
        photo: full ? 'https://i.pravatar.cc/150?u=student-' + (count + 1) : '',
        dateOfBirth: full ? new Date(2013 + c, count % 12, 5 + count) : undefined,
        gender: full ? genders[count % 2] : '',
        bloodGroup: full ? bloodGroups[count % bloodGroups.length] : '',
        guardianName: full ? parent.name : '',
        guardianPhone: full ? '+91 98111 22222' : '',
        emergencyContact: full ? '+91 98111 33333' : '',
        editAccessUntil: count < 3 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : undefined,
      });
      count++;
    }
  }

  /* Timetable */
  const subjectByTeacher = new Map();
  teachers.forEach((t, i) => subjectByTeacher.set(subjectDocs[i]._id.toString(), t._id));

  let tCount = 0;
  for (const cls of classes) {
    for (let d = 0; d < DAYS.length; d++) {
      for (let p = 1; p <= 8; p++) {
        const subject = subjectDocs[(d + p) % 6];
        await Timetable.create({
          class: cls._id,
          day: DAYS[d],
          period: p,
          startTime: PERIOD_TIMES[p][0],
          endTime: PERIOD_TIMES[p][1],
          subject: subject._id,
          teacher: subjectByTeacher.get(subject._id.toString()),
        });
        tCount++;
      }
    }
  }
  console.log(`  ${tCount} timetable slots`);

  /* Attendance — last 10 school days, 2 subjects per day per student */
  const studentDocs = await Student.find();
  const records = [];
  let daysAdded = 0;
  const d = new Date();
  const teacherUser = await User.findOne({ role: 'teacher' });
  while (daysAdded < 10) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = DAYS[dow - 1];

    for (const student of studentDocs) {
      const daySlots = await Timetable.find({ class: student.class, day: dayName }).sort({ period: 1 }).limit(2);
      for (const slot of daySlots) {
        const roll = Math.random();
        const status = roll < 0.82 ? 'Present' : roll < 0.92 ? 'Late' : 'Absent';
        records.push({
          student: student.user,
          class: student.class,
          subject: slot.subject,
          date: dateStr,
          status,
          markedBy: teacherUser._id,
        });
      }
    }
    daysAdded++;
  }
  await Attendance.insertMany(records);
  console.log(`  ${records.length} attendance records`);

  /* Fees — fee structure per class (multi-head) + records for the last 4 months */
  const MONTHLY_FEES = { 6: 2500, 7: 3000, 8: 3500 };
  const feeStructures = [];
  for (let c = 0; c < classes.length; c++) {
    const grade = 6 + c;
    const heads = [
      { name: 'Tuition Fee', amount: MONTHLY_FEES[grade] - 500 },
      { name: 'Computer & Digital Lab', amount: 300 },
      { name: 'Sports & Activities', amount: 200 },
    ];
    feeStructures.push(
      await FeeStructure.create({
        class: classes[c]._id,
        monthlyFee: heads.reduce((s, h) => s + h.amount, 0),
        heads,
      })
    );
  }

  const months = [];
  const now = new Date();
  for (let back = 3; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const feeRecords = [];
  const payModes = ['Cash', 'UPI', 'Net Banking', 'Card', 'Cheque'];
  let feeSeq = 1;
  for (const student of studentDocs) {
    for (const month of months) {
      const struct = feeStructures.find((s) => s.class.toString() === student.class.toString());
      const amount = struct ? struct.totalMonthlyFee() : 2000;
      const paid = Math.random() < 0.6;
      const [y, m] = month.split('-').map(Number);
      feeRecords.push({
        student: student.user,
        class: student.class,
        month,
        amount,
        status: paid ? 'Paid' : 'Pending',
        paidDate: paid ? new Date(y, m - 1, 5 + Math.floor(Math.random() * 18)) : undefined,
        mode: paid ? payModes[Math.floor(Math.random() * payModes.length)] : '',
        receiptNo: paid ? `RCPT-${month.replace('-', '')}-${String(feeSeq++).padStart(3, '0')}` : undefined,
        paidAmount: paid ? amount : 0,
        discount: 0,
      });
    }
  }
  await Fee.insertMany(feeRecords);
  const pendingFees = feeRecords.filter((f) => f.status === 'Pending');
  console.log(`  ${feeRecords.length} fee records (${pendingFees.length} pending)`);

  /* Teacher attendance — last 5 weekdays */
  const teacherRecords = [];
  let tDays = 0;
  const td = new Date();
  while (tDays < 5) {
    td.setDate(td.getDate() - 1);
    const dow = td.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}`;
    for (const teacher of teachers) {
      const roll = Math.random();
      teacherRecords.push({
        teacher: teacher._id,
        date: dateStr,
        status: roll < 0.85 ? 'Present' : roll < 0.95 ? 'Late' : 'Absent',
        markedBy: principal._id,
      });
    }
    tDays++;
  }
  await TeacherAttendance.insertMany(teacherRecords);
  console.log(`  ${teacherRecords.length} teacher attendance records`);

  /* Notices */
  await Notice.insertMany([
    {
      title: 'Welcome to the new academic year',
      body: 'The new academic year begins on Monday. Please collect your updated timetable from the notice board or your student dashboard. Wishing everyone a wonderful year ahead!',
      audience: 'all',
      publishedBy: principal._id,
    },
    {
      title: 'Fee reminder — last week of the month',
      body: 'Kindly clear all pending monthly fees before the 28th. Parents can check their child’s pending amounts on the parent dashboard under Fees.',
      audience: 'parents',
      publishedBy: principal._id,
    },
    {
      title: 'Staff meeting — Friday 4 PM',
      body: 'All teachers are requested to attend the monthly staff meeting in the conference hall this Friday at 4:00 PM. Attendance will be marked.',
      audience: 'teachers',
      publishedBy: principal._id,
    },
    {
      title: 'Science exhibition — complete your profile first',
      body: 'Students participating in the science exhibition must ensure their student profile (photo and contact details) is complete. If your edit access has expired, visit the school office.',
      audience: 'students',
      publishedBy: principal._id,
    },
    {
      title: 'Grade 8 field trip permission',
      body: 'Permission slips for the Grade 8 field trip to the museum must be submitted by Wednesday. Please have your parents sign the form.',
      audience: 'class',
      targetClass: classes[2]._id,
      publishedBy: principal._id,
    },
  ]);
  console.log('  5 notices');

  /* ------------------------------ EXAM SEED ------------------------------ */

  const { Exam, Mark, Homework, HomeworkSubmission, Syllabus } = require('./models');
  const { Enquiry, Admission, Book, BookIssue } = require('./models');
  const { Vehicle, Route, TransportAssignment, Leave, Event, Certificate } = require('./models');
  const { Hostel, HostelRoom, HostelAllotment, SalaryStructure, Payslip, SchoolSetting } = require('./models');

  const EXAM_TYPES = ['Periodic Test 1', 'Periodic Test 2', 'Half Yearly', 'Annual'];
  const exams = [];
  for (const cls of classes) {
    for (let e = 0; e < 2; e++) {
      const start = new Date();
      start.setDate(start.getDate() + e * 40 - 60 + 5);
      const examSubjects = subjectDocs.slice(0, 4).map((s, i) => ({
        subject: s._id,
        maxMarks: 100,
        date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).toISOString().slice(0, 10),
        startTime: '10:00',
        endTime: '13:00',
      }));
      const exam = await Exam.create({
        name: `${EXAM_TYPES[e]} ${new Date().getFullYear()}`,
        type: EXAM_TYPES[e],
        class: cls._id,
        subjects: examSubjects,
        startDate: examSubjects[0].date,
        endDate: examSubjects[examSubjects.length - 1].date,
        status: e === 0 ? 'Result Published' : 'Completed',
        createdBy: principal._id,
      });
      exams.push(exam);
    }
  }

  const marks = [];
  for (const exam of exams) {
    const stuOfClass = studentDocs.filter((s) => s.class.toString() === exam.class.toString());
    for (const stu of stuOfClass) {
      for (const es of exam.subjects) {
        const m = Math.round(38 + Math.random() * 60);
        const pct = Math.round((m / es.maxMarks) * 100);
        marks.push({
          exam: exam._id,
          student: stu.user,
          subject: es.subject,
          marksObtained: m,
          maxMarks: es.maxMarks,
          grade: pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 40 ? 'C2' : pct >= 33 ? 'D' : 'E',
          enteredBy: principal._id,
        });
      }
    }
  }
  await Mark.insertMany(marks);
  console.log(`  ${exams.length} exams, ${marks.length} marks`);

  /* ---------------------------- HOMEWORK SEED ---------------------------- */

  const hwList = [];
  for (let c = 0; c < classes.length; c++) {
    for (const [title, subIdx, days] of [
      ['Solve exercise 5.2 — Quadratic Equations', 0, 2],
      ['Write an essay on "My Summer Holidays"', 2, 4],
      ['Lab record: rusting of iron experiment', 1, 5],
    ]) {
      hwList.push({
        title,
        description: `Complete the ${title.toLowerCase()} and submit before the due date. Marks will be awarded for neatness and correctness.`,
        class: classes[c]._id,
        subject: subjectDocs[subIdx]._id,
        teacher: teachers[c]._id,
        dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      });
    }
  }
  const hwDocs = await Homework.insertMany(hwList);

  const submissions = [];
  for (let i = 0; i < hwDocs.length; i++) {
    const hw = hwDocs[i];
    const stuOfClass = studentDocs.filter((s) => s.class.toString() === hw.class.toString()).slice(0, 4);
    for (const stu of stuOfClass) {
      if (Math.random() < 0.7) {
        submissions.push({
          homework: hw._id,
          student: stu.user,
          text: `Here is my submission for "${hw.title}". I have completed all the questions.`,
          submittedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          status: Math.random() < 0.5 ? 'Checked' : 'Submitted',
          grade: Math.random() < 0.5 ? 'A' : 'B',
        });
      }
    }
  }
  await HomeworkSubmission.insertMany(submissions);
  console.log(`  ${hwDocs.length} homework, ${submissions.length} submissions`);

  /* ---------------------------- SYLLABUS SEED ---------------------------- */

  const chaptersBySubject = [
    ['Real Numbers', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Triangles', 'Circles', 'Statistics', 'Probability'],
    ['Matter in our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy'],
    ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Reach for the Top', 'Kathmandu'],
  ];
  const syllabusDocs = [];
  for (let c = 0; c < classes.length; c++) {
    for (let s = 0; s < 4; s++) {
      const chs = chaptersBySubject[s % chaptersBySubject.length];
      const chapters = chs.slice(0, 6).map((ch, i) => ({
        title: ch,
        description: `Chapter ${i + 1} — ${ch}. Covers NCERT text and practice problems.`,
        status: i < 3 ? 'Completed' : i < 5 ? 'Ongoing' : 'Planned',
        week: `Weeks ${i * 3 + 1}-${(i + 1) * 3}`,
      }));
      syllabusDocs.push({
        class: classes[c]._id,
        subject: subjectDocs[s]._id,
        teacher: teachers[s]._id,
        chapters,
      });
    }
  }
  await Syllabus.insertMany(syllabusDocs);
  console.log(`  ${syllabusDocs.length} syllabus plans`);

  /* ------------------------------ ADMISSION SEED ------------------------------ */

  await Enquiry.insertMany([
    { name: 'Ramesh Kumar', phone: '+91 98100 10001', email: 'ramesh.k@gmail.com', classApplying: classes[0]._id, source: 'Website', message: 'Interested in admission for my daughter in Grade 6.', status: 'New', followUpDate: '2026-08-20' },
    { name: 'Priya Sharma', phone: '+91 98200 20002', email: 'priya.s@gmail.com', classApplying: classes[1]._id, source: 'Referral', message: 'Enquiry about fee structure and bus facility.', status: 'Contacted', followUpDate: '2026-08-18' },
    { name: 'Amit Patel', phone: '+91 98300 30003', classApplying: classes[2]._id, source: 'Walk-in', message: 'Asked about hostel facilities for Grade 8.', status: 'New' },
  ]);
  const applications = [];
  for (let i = 0; i < 4; i++) {
    applications.push({
      applicationNo: `ADM-2026-${String(1001 + i)}`,
      firstName: ['Aarav', 'Diya', 'Vivaan', 'Ananya'][i],
      lastName: ['Singh', 'Reddy', 'Gupta', 'Nair'][i],
      dateOfBirth: '2014-05-15',
      gender: i % 2 === 0 ? 'Male' : 'Female',
      classApplying: classes[i % 3]._id,
      parentName: ['Vikram Singh', 'Lakshmi Reddy', 'Rajan Gupta', 'Meera Nair'][i],
      parentPhone: `+91 98400 ${4000 + i}`,
      parentEmail: `parent${i + 10}@school.com`,
      address: `${12 + i} Green Park, New Delhi`,
      city: 'New Delhi',
      pincode: '110016',
      previousSchool: i % 2 === 0 ? 'Delhi Public School' : '',
      documents: [
        { name: 'Birth Certificate', status: i < 2 ? 'Verified' : 'Received' },
        { name: 'Previous Marksheet', status: i < 2 ? 'Received' : 'Pending' },
        { name: 'Transfer Certificate', status: i < 2 ? 'Received' : 'Pending' },
      ],
      status: i === 0 ? 'Interview Scheduled' : i === 1 ? 'Under Review' : i === 2 ? 'Applied' : 'Rejected',
      interviewDate: i === 0 ? '2026-08-25' : '',
    });
  }
  await Admission.insertMany(applications);
  console.log('  3 enquiries, 4 admission applications');

  /* ------------------------------- LIBRARY SEED ------------------------------- */

  const books = await Book.insertMany([
    { title: 'Mathematics Textbook Grade 6', author: 'NCERT', isbn: '9788174504900', category: 'Textbook', publisher: 'NCERT', lang: 'English', rack: 'A1', copies: 5, available: 5, price: 120 },
    { title: 'Science Textbook Grade 7', author: 'NCERT', isbn: '9788174504757', category: 'Textbook', publisher: 'NCERT', lang: 'English', rack: 'A2', copies: 4, available: 4, price: 115 },
    { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '9788173711466', category: 'Biography', publisher: 'Universities Press', lang: 'English', rack: 'B1', copies: 3, available: 3, price: 295 },
    { title: 'The Discovery of India', author: 'Jawaharlal Nehru', isbn: '9780143031031', category: 'History', publisher: 'Penguin', lang: 'English', rack: 'B2', copies: 2, available: 2, price: 450 },
    { title: 'Panchatantra Stories', author: 'Vishnu Sharma', isbn: '9788184820052', category: 'Story', publisher: 'Amar Chitra Katha', lang: 'Hindi', rack: 'C1', copies: 6, available: 6, price: 150 },
    { title: 'Concise Physics Grade 8', author: 'S. Chand', isbn: '9788121926559', category: 'Textbook', publisher: 'S. Chand', lang: 'English', rack: 'A3', copies: 5, available: 5, price: 480 },
  ]);
  const bookIssues = [];
  for (let i = 0; i < 4; i++) {
    const book = books[i];
    const stu = studentDocs[i];
    bookIssues.push({
      book: book._id,
      student: stu.user,
      issuedBy: principal._id,
      issueDate: new Date(Date.now() - (5 + i) * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + (9 - i) * 24 * 60 * 60 * 1000),
      status: 'Issued',
    });
    book.available -= 1;
  }
  await BookIssue.insertMany(bookIssues);
  await Promise.all(books.map((b) => b.save()));
  console.log(`  ${books.length} books, ${bookIssues.length} issues`);

  /* ------------------------------ TRANSPORT SEED ------------------------------ */

  const vehicles = await Vehicle.insertMany([
    { registrationNo: 'DL 01 AB 1234', type: 'Bus', capacity: 45, driverName: 'Mohan Lal', driverPhone: '+91 98111 90001', insuranceExpiry: '2027-03-15', rcExpiry: '2028-01-10' },
    { registrationNo: 'DL 01 CD 5678', type: 'Van', capacity: 18, driverName: 'Suresh Yadav', driverPhone: '+91 98111 90002', insuranceExpiry: '2027-06-20', rcExpiry: '2027-12-05' },
    { registrationNo: 'DL 01 EF 9012', type: 'Bus', capacity: 45, driverName: 'Ravi Kumar', driverPhone: '+91 98111 90003', insuranceExpiry: '2026-11-30', rcExpiry: '2028-04-18' },
  ]);
  const routes = await Route.insertMany([
    {
      name: 'Route 1 — Model Town',
      vehicle: vehicles[0]._id,
      driverName: 'Mohan Lal',
      driverPhone: '+91 98111 90001',
      stops: [
        { name: 'Model Town Depot', order: 1, time: '07:00', fare: 800 },
        { name: 'Gulmohar Park', order: 2, time: '07:20', fare: 750 },
        { name: 'JNU Gate', order: 3, time: '07:40', fare: 700 },
        { name: 'School', order: 4, time: '08:00', fare: 0 },
      ],
    },
    {
      name: 'Route 2 — Rohini',
      vehicle: vehicles[1]._id,
      driverName: 'Suresh Yadav',
      driverPhone: '+91 98111 90002',
      stops: [
        { name: 'Rohini Sector 15', order: 1, time: '07:05', fare: 700 },
        { name: 'Rohini Sector 8', order: 2, time: '07:25', fare: 650 },
        { name: 'School', order: 3, time: '08:00', fare: 0 },
      ],
    },
    {
      name: 'Route 3 — Vasant Kunj',
      vehicle: vehicles[2]._id,
      driverName: 'Ravi Kumar',
      driverPhone: '+91 98111 90003',
      stops: [
        { name: 'Vasant Kunj B-6', order: 1, time: '06:55', fare: 900 },
        { name: 'Kishangarh', order: 2, time: '07:15', fare: 850 },
        { name: 'School', order: 3, time: '08:00', fare: 0 },
      ],
    },
  ]);
  const assignments = [];
  for (let i = 0; i < 6; i++) {
    const rt = routes[i % 3];
    const stop = rt.stops[Math.floor(Math.random() * (rt.stops.length - 1))];
    assignments.push({
      student: studentDocs[i * 3].user,
      route: rt._id,
      stop: stop.name,
      pickupTime: stop.time,
      dropTime: '15:30',
      amount: stop.fare,
      status: 'Active',
    });
  }
  await TransportAssignment.insertMany(assignments);
  console.log(`  ${vehicles.length} vehicles, ${routes.length} routes, ${assignments.length} assignments`);

  /* -------------------------------- LEAVE SEED -------------------------------- */

  const leaveDocs = await Leave.insertMany([
    {
      user: teachers[0].user,
      role: 'teacher',
      teacher: teachers[0]._id,
      startDate: '2026-08-19',
      endDate: '2026-08-19',
      days: 1,
      reason: 'Personal work — bank appointment',
      type: 'Casual',
      status: 'Pending',
    },
    {
      user: teachers[2].user,
      role: 'teacher',
      teacher: teachers[2]._id,
      startDate: '2026-08-24',
      endDate: '2026-08-26',
      days: 3,
      reason: 'Medical treatment at hospital',
      type: 'Medical',
      status: 'Approved',
      approvedBy: principal._id,
      approvalDate: new Date(),
    },
    {
      user: studentDocs[2].user,
      role: 'student',
      student: studentDocs[2].user,
      startDate: '2026-08-21',
      endDate: '2026-08-21',
      days: 1,
      reason: 'Family wedding function',
      type: 'Casual',
      status: 'Pending',
    },
  ]);
  console.log(`  ${leaveDocs.length} leave requests`);

  /* -------------------------------- EVENT SEED -------------------------------- */

  const eventDate = (offset) => new Date(Date.now() + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await Event.insertMany([
    { title: 'Independence Day Celebration', description: 'Flag hoisting followed by cultural programme and quiz competition.', date: eventDate(1), startTime: '08:30', endTime: '11:00', venue: 'School Ground', type: 'Cultural', audience: 'all', isHoliday: true, createdBy: principal._id },
    { title: 'Parent–Teacher Meeting', description: 'PTM for all classes. Report cards will be shared with parents.', date: eventDate(9), startTime: '09:00', endTime: '12:30', venue: 'Classrooms', type: 'Academic', audience: 'parents', createdBy: principal._id },
    { title: 'Annual Sports Day', description: 'Track and field events, march past, and prize distribution.', date: eventDate(21), startTime: '08:00', endTime: '15:00', venue: 'Sports Complex', type: 'Sports', audience: 'all', createdBy: principal._id },
    { title: 'Staff Meeting — Monthly Review', description: 'Monthly staff review meeting in the conference hall.', date: eventDate(3), startTime: '16:00', endTime: '17:00', venue: 'Conference Hall', type: 'Meeting', audience: 'teachers', createdBy: principal._id },
    { title: 'Gandhi Jayanti Holiday', description: 'School closed on account of Gandhi Jayanti.', date: eventDate(30), venue: '', type: 'Holiday', audience: 'all', isHoliday: true, createdBy: principal._id },
  ]);
  console.log('  5 events');

  /* ------------------------------ CERTIFICATE SEED ------------------------------ */

  await Certificate.insertMany([
    { template: 'Bonafide', student: studentDocs[0].user, purpose: 'Bank account opening', serialNo: 'CRT-2026-0001', status: 'Issued', issuedBy: principal._id },
    { template: 'Character Certificate', student: studentDocs[4].user, purpose: 'Higher studies application', serialNo: 'CRT-2026-0002', status: 'Issued', issuedBy: principal._id },
  ]);
  console.log('  2 certificates');

  /* ------------------------------- HOSTEL SEED ------------------------------- */

  const hostel = await Hostel.create({
    name: 'Athena Boys Hostel',
    warden: teachers[1]._id,
    contact: '+91 98111 80001',
    address: 'Behind school campus, Block C',
    capacity: 40,
  });
  const rooms = await HostelRoom.insertMany([
    { hostel: hostel._id, roomNo: 'B-101', floor: 'Ground', type: 'Shared', capacity: 4 },
    { hostel: hostel._id, roomNo: 'B-102', floor: 'Ground', type: 'Shared', capacity: 4 },
    { hostel: hostel._id, roomNo: 'B-201', floor: 'First', type: 'Dormitory', capacity: 10 },
  ]);
  await HostelAllotment.insertMany([
    { student: studentDocs[1].user, hostel: hostel._id, room: rooms[0]._id, bedNo: 'B-101-1', startDate: '2026-04-01', fee: 5000, status: 'Active' },
    { student: studentDocs[3].user, hostel: hostel._id, room: rooms[1]._id, bedNo: 'B-102-2', startDate: '2026-04-01', fee: 5000, status: 'Active' },
  ]);
  console.log('  1 hostel, 3 rooms, 2 allotments');

  /* ------------------------------- PAYROLL SEED ------------------------------- */

  const structures = [];
  for (let i = 0; i < teachers.length; i++) {
    const basic = 30000 + i * 3500;
    structures.push({
      teacher: teachers[i]._id,
      basic,
      hra: Math.round(basic * 0.3),
      da: Math.round(basic * 0.12),
      allowances: [{ name: 'Special Allowance', amount: 2000 }],
      deductions: [{ name: 'PF', amount: Math.round(basic * 0.12) }, { name: 'Professional Tax', amount: 200 }],
    });
  }
  await SalaryStructure.insertMany(structures);

  const payNow = new Date();
  const currentMonth = `${payNow.getFullYear()}-${String(payNow.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = new Date(payNow.getFullYear(), payNow.getMonth() - 1, 1);
  const payslips = [];
  for (const st of structures) {
    for (const mDate of [prevMonth, currentMonth]) {
      const month = typeof mDate === 'string' ? mDate : `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`;
      const gross = st.basic + st.hra + st.da + 2000;
      const totalDed = st.deductions.reduce((s, d) => s + d.amount, 0);
      payslips.push({
        teacher: st.teacher,
        month,
        basic: st.basic,
        hra: st.hra,
        da: st.da,
        allowances: st.allowances,
        deductions: st.deductions,
        gross,
        totalDeductions: totalDed,
        net: gross - totalDed,
        status: typeof mDate === 'string' ? 'Generated' : 'Paid',
        paidOn: typeof mDate === 'string' ? undefined : new Date(payNow.getFullYear(), payNow.getMonth() - 1, 28),
        generatedBy: principal._id,
      });
    }
  }
  await Payslip.insertMany(payslips);
  console.log(`  ${payslips.length} payslips`);

  /* ------------------------------- SCHOOL SEED ------------------------------- */

  await SchoolSetting.create({
    name: 'Athena Public School',
    tagline: 'Knowledge • Discipline • Excellence',
    address: '12 Knowledge Park, Sarita Vihar',
    city: 'New Delhi',
    pincode: '110076',
    phone: '+91 11 2500 1234',
    email: 'office@athenaschool.edu.in',
    website: 'www.athenaschool.edu.in',
    affiliationNo: 'CBSE/1130456',
    udiseCode: '07031056101',
    board: 'CBSE',
    medium: 'English',
    academicYear: '2026-27',
    sessionStart: 'April',
    sessionEnd: 'March',
    principalName: 'Margaret Hayes',
    established: '2002',
  });
  console.log('  school profile created');

  console.log('Demo accounts (password: password123):');
  console.log('  Principal  principal@school.com');
  console.log('  Teacher    t1@school.com  (also t2–t6)');
  console.log('  Student    s1@school.com  (also s2–s18)');
  console.log('  Parent     p1@school.com  (also p2–p6)');
  return true;
}

if (require.main === module) {
  const { connectDB, disconnectDB } = require('./db');
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
