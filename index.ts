import { connect_db } from "./config/db";

import { createServer } from "./config/server";

const app = createServer();

const port = process.env.PORT;

connect_db(process.env.MONGO_URI || "");

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
