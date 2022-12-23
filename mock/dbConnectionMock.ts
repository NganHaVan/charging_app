import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connect_db } from "../config/db";

let mongo: MongoMemoryReplSet | null = null;

export const starDBConnection = async () => {
  const mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 2 },
  });
  mongo = mongoServer;
  await connect_db(mongoServer.getUri());
  console.log({ testURI: mongoServer.getUri() });
  return mongoServer;
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
