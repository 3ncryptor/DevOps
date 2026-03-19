import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB Replica Set
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();

  // Set env vars before tests run
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';

  // Make sure we have a clean connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect Mongoose to the in-memory db
  await mongoose.connect(mongoUri, {
    dbName: 'zentra-test',
  });
});

afterAll(async () => {
  // Disconnect and stop the server
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clear the database after each test
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
  // Note: jest.clearAllMocks() is handled automatically by clearMocks: true in jest.config.js
});
