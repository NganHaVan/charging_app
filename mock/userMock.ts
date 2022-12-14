import mongoose from "mongoose";
import User from "../models/User";
import { IUser } from "../types/User";
import { hashPassword } from "../utils/passwordUtils";

export const User1: IUser = {
  _id: new mongoose.Types.ObjectId().toString(),
  email: "john@mail.com",
  password: "123456",
  isAdmin: false,
  phoneNumber: "1111111111",
  username: "John Doe",
};

export const User2: IUser = {
  _id: new mongoose.Types.ObjectId().toString(),
  email: "janen@mail.com",
  password: "123456",
  isAdmin: false,
  phoneNumber: "222222222",
  username: "Jane Doe",
};

export const addUser1ToDb = async () => {
  const newUser1 = new User({
    email: User1.email,
    isAdmin: false,
    password: hashPassword(User1.password),
    phoneNumber: User1.phoneNumber,
    username: User1.username,
  });
  await newUser1.save();
  return newUser1;
};

export const addUser2ToDb = async () => {
  const newUser2 = new User({
    email: User2.email,
    isAdmin: false,
    password: hashPassword(User2.password),
    phoneNumber: User2.phoneNumber,
    username: User2.username,
  });
  await newUser2.save();
  return newUser2;
};
