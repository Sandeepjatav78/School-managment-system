require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./db');
const { seedDatabase } = require('./seed');
const User = require('./models/User');
const gate = require('./middleware/featureGate');

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI is required when NODE_ENV=production. Configure server/.env');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error(
      'FATAL: JWT_SECRET must be set to a strong random value in production. Generate one with: openssl rand -base64 48'
    );
    process.exit(1);
  }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

/* ------------------------------ Security ------------------------------ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

if (process.env.CORS_ORIGIN) {
  const origins = process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins, credentials: true }));
} else if (!isProd) {
  app.use(cors());
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later' },
});
app.use('/api', apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts, please wait 15 minutes and try again' },
});
app.use('/api/auth/login', loginLimiter);

/* ------------------------------- Routes ------------------------------- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/teacher-attendance', require('./routes/teacherAttendance'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/exams', gate('exams'), require('./routes/exams'));
app.use('/api/homework', gate('homework'), require('./routes/homework'));
app.use('/api/syllabus', gate('syllabus'), require('./routes/syllabus'));
app.use('/api/admissions', gate('admissions'), require('./routes/admissions'));
app.use('/api/library', gate('library'), require('./routes/library'));
app.use('/api/transport', gate('transport'), require('./routes/transport'));
app.use('/api/leaves', gate('leaves'), require('./routes/leaves'));
app.use('/api/events', gate('events'), require('./routes/events'));
app.use('/api/certificates', gate('certificates'), require('./routes/certificates'));
app.use('/api/hostel', gate('hostel'), require('./routes/hostel'));
app.use('/api/payroll', gate('payroll'), require('./routes/payroll'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/teacher', require('./routes/portal').teacher);
app.use('/api/student', require('./routes/portal').student);
app.use('/api/parent', require('./routes/portal').parent);

/* -------------------------- Static client (prod) ---------------------- */
const staticDir = path.join(__dirname, 'public');
if (fs.existsSync(path.join(staticDir, 'index.html'))) {
  app.use(express.static(staticDir, { maxAge: isProd ? '7d' : 0, index: false }));
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  console.log('Serving built client from ./public');
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

/* ------------------------------ Startup ------------------------------- */
const PORT = process.env.PORT || 5050;

connectDB()
  .then(async () => {
    const count = await User.countDocuments();
    if (count === 0) {
      if (isProd && process.env.ALLOW_SEEDING !== 'true') {
        console.log('Database is empty and this is a production environment.');
        console.log('Set ALLOW_SEEDING=true in server/.env to create the default demo accounts.');
      } else {
        console.log('Database is empty — seeding demo data…');
        await seedDatabase();
      }
    }
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });