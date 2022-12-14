import mongoose from "mongoose";
import Provider from "../models/Provider";
import { IProvider } from "../types/Provider";
import { hashPassword } from "../utils/passwordUtils";

export const Provider1: IProvider = {
  _id: new mongoose.Types.ObjectId().toString(),
  chargers: [],
  companyName: "Provider 1",
  isAdmin: true,
  password: "123456",
  address: "123 AAA",
  city: "Espoo",
  country: "Finland",
};

export const Provider2: IProvider = {
  _id: new mongoose.Types.ObjectId().toString(),
  chargers: [],
  companyName: "Provider 2",
  isAdmin: true,
  password: "123456",
  address: "123 BBB",
  city: "Helsinki",
  country: "Finland",
};

export const addProvider1ToDb = async () => {
  const { companyName, password, address, city, country } = Provider1;
  const newProvider1 = new Provider({
    companyName,
    password: hashPassword(password),
    address,
    city,
    country,
    isAdmin: true,
  });
  await newProvider1.save();
  return newProvider1;
};

export const addUser2ToDb = async () => {
  const { companyName, password, address, city, country } = Provider2;
  const newProvider2 = new Provider({
    companyName,
    password: hashPassword(password),
    address,
    city,
    country,
    isAdmin: true,
  });
  await newProvider2.save();
  return newProvider2;
};
