import { IProvider } from "../types/Provider";
import { IUser } from "../types/User";
import jwt from "jsonwebtoken";

export const getTokenFromCookie = (cookies: string[]) => {
  const tokenString = cookies[0].split(";")[0];
  const token = tokenString.split("=")[1];
  return token;
};

export const generateAccessToken = (
  data: IUser | IProvider,
  secret?: string
) => {
  return jwt.sign({ _id: data._id, isAdmin: data.isAdmin }, secret ?? "");
};
