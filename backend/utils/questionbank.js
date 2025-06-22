import ClassicQuestion from "../models/ClassicQuestion.js";
import fs from "fs";
import path from "path";

const questionData = JSON.parse(
  fs.readFileSync(path.resolve("./questiondata/ClassicQuestions.json"), "utf-8")
);

const generateQuestions = async () => {
  await ClassicQuestion.deleteMany();
  console.log("Questions cleared.");

  await ClassicQuestion.insertMany(questionData);
  console.log("Questions added.");
};

export default generateQuestions;
