import express, { Request, Response, NextFunction } from "express";
import bp from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import chargerRoute from "../routes/chargers";
import providerRoute from "../routes/providers";
import userRoute from "../routes/users";

import { StatusError } from "../utils/error";
export const createServer = () => {
  dotenv.config();
  const app = express();

  // Body-parser
  app.use(bp.json());
  app.use(bp.urlencoded({ extended: true }));

  // Cookie-parser
  app.use(cookieParser());

  // Routes
  app.use("/api/providers", providerRoute);
  app.use("/api/users", userRoute);
  app.use("/api/chargers", chargerRoute);

  app.use(
    (err: StatusError, req: Request, res: Response, next: NextFunction) => {
      const errorStatus = err.status || 500;
      const errorMessage = err.message || "Something went wrong!";
      return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack,
      });
    }
  );

  return app;
};
