const mongoose = require('mongoose');

let memoryServer = null;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log('MongoDB connected (external)');
    return;
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memUri = memoryServer.getUri();
  await mongoose.connect(memUri);
  console.log('MongoDB connected (in-memory, data resets on restart)');
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
