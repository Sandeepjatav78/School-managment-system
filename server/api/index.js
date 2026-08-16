require('dotenv').config();
const app = require('../app');
const { connectDB } = require('../db');
const { seedDatabase } = require('../seed');
const User = require('../models/User');

let readyPromise = null;

async function bootstrap() {
  if (!process.env.MONGO_URI) {
    throw new Error(
      'MONGO_URI is not set. Add it in Vercel: Project → Settings → Environment Variables (a real MongoDB — e.g. Atlas — in-memory DB does not work on Vercel).'
    );
  }
  await connectDB();
  const count = await User.countDocuments();
  if (count === 0 && process.env.ALLOW_SEEDING === 'true') {
    console.log('Database is empty — seeding demo data…');
    await seedDatabase();
  }
}

module.exports = async (req, res) => {
  try {
    if (!readyPromise) {
      readyPromise = bootstrap();
      readyPromise.catch(() => {
        readyPromise = null;
      });
    }
    await readyPromise;
    app(req, res);
  } catch (err) {
    console.error('Server failed to start:', err.message);
    res.status(500).json({ message: 'Server failed to start: ' + err.message });
  }
};