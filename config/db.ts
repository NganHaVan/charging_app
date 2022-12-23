import mongoose from "mongoose";

export const connect_db = async (mongoURI: string) => {
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(conn.connection.host);
    return conn;
  } catch (error: any) {
    console.log("Mongoose error: ", error);
    throw new Error(error);
    return null;
  }
};

export const getMongoClient = async () => {
  const conn = await mongoose
    .createConnection(process.env.MONGO_URI || "")
    .asPromise();

  return conn.getClient();
};
