import express from "express";
import dotenv from "dotenv";
import { connect_db } from "./config/db";

dotenv.config();

const app = express();
const port = process.env.PORT;

connect_db();

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
