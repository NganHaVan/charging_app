import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer | null = null;

export const starDBConnection = async () => {
  const mongoServer = await MongoMemoryServer.create();
  mongo = mongoServer;
  await mongoose.connect(mongoServer.getUri());
};

export const disconnectDBConnection = async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
};

export const dropDB = async () => {
  if (mongo) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  }
};

export const dropCollections = async () => {
  if (mongo) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
    }
  }
};
