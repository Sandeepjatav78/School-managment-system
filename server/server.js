require('dotenv').config();
const { connectDB } = require('./db');
const { seedDatabase } = require('./seed');
const User = require('./models/User');
const app = require('./app');

const PORT = process.env.PORT || 5050;

if (process.env.NODE_ENV === 'production') {
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

connectDB()
  .then(async () => {
    const count = await User.countDocuments();
    if (count === 0) {
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_SEEDING === 'true') {
        console.log('Database is empty — seeding demo data…');
        await seedDatabase();
      } else {
        console.log('Database is empty and this is a production environment.');
        console.log('Set ALLOW_SEEDING=true in server/.env to create the default demo accounts.');
      }
    }
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });