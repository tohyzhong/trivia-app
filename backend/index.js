import app, { connectMongo } from "./server.js";
import http from "http";
import { initSocket } from "./socket.js";
import runSchedulers from "./utils/tasks.js";
import generateQuestions from "./utils/questionbank.js";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(app);
initSocket(server);

connectMongo().then(() => {
  server.listen(process.env.PORT, () => {
    console.info(`Server is running on port ${process.env.PORT}`);
  });

  runSchedulers();

  if (process.env.NODE_ENV === "development") {
    generateQuestions();
  }
});
