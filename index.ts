import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import bp from "body-parser";
import cookieParser from "cookie-parser";
import { connect_db } from "./config/db";
import authRoute from "./routes/auth";
import { StatusError } from "./utils/error";
// import chargerRoute from './routes/chargers';
import providerRoute from "./routes/providers";

dotenv.config();

const app = express();
const port = process.env.PORT;

connect_db();

// Body-parser
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// Cookie-parser
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/providers", providerRoute);

app.use((err: StatusError, req: Request, res: Response, next: NextFunction) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
