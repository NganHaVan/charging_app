import { Request } from "express";
import { IProvider } from "./Provider";
import { IUser } from "./User";

export interface RequestCustom extends Request {
  user: IUser | IProvider;
}
