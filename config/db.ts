import mongoose from 'mongoose';

export const connect_db = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "");
        console.log(conn.connection.host);
    } catch (error: any) {
        throw new Error(error);
    }
}