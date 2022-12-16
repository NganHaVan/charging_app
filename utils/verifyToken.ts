import jwt from "jsonwebtoken";
import e, { Request, Response, NextFunction } from "express";
import { createError, StatusError } from "./error";
import { RequestCustom } from "../types/RequestCustom";
import { IUser } from "../types/User";
import { IProvider } from "../types/Provider";

export const verifyToken = (
  expressReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expressReq as RequestCustom;
  const token = req.cookies.access_token;
  if (!token) {
    return next(createError(401, "You are not authenticated"));
  }
  jwt.verify(token, process.env.JWT || "", (err: any, user: any) => {
    if (err) {
      return next(createError(403, "Token is not valid"));
    }
    req.user = user as IProvider | IUser;
    next();
  });
};

export const verifyOwnAccount = (
  expressReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expressReq as RequestCustom;
  verifyToken(req, res, (params) => {
    if (params instanceof StatusError) {
      return next(params);
    }
    if ((req.user._id as unknown as string) === req.params.id) {
      next();
    } else {
      return next(createError(403, "You are not authorized to do it"));
    }
  });
};

export const verifyAdmin = (
  expReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expReq as RequestCustom;
  verifyToken(req, res, (params) => {
    if (params instanceof StatusError) {
      return next(params);
    }
    if (req.user.isAdmin) {
      next();
    } else {
      return next(createError(403, "Only providers can request this"));
    }
  });
};
