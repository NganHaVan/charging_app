import express from "express";
import dotenv from "dotenv";
import bp from "body-parser";
import { connect_db } from "./config/db";
import authRoute from "./routes/auth";
// import chargerRoute from './routes/chargers';
import providerRoute from "./routes/providers";

dotenv.config();

const app = express();
const port = process.env.PORT;

connect_db();

// Body-parser
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/providers", providerRoute);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
