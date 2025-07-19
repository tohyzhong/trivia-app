import ClassicQuestion from "../models/ClassicQuestion.js";
import KnowledgeQuestion from "../models/KnowledgeQuestion.js";
import fs from "fs";
import path from "path";

const classicQuestionData = JSON.parse(
  fs.readFileSync(path.resolve("./questiondata/ClassicQuestions.json"), "utf-8")
);

const knowledgeQuestionData = JSON.parse(
  fs.readFileSync(
    path.resolve("./questiondata/KnowledgeQuestions.json"),
    "utf-8"
  )
);

const generateQuestions = async () => {
  await ClassicQuestion.deleteMany();
  await KnowledgeQuestion.deleteMany();
  console.log("Questions cleared.");

  await ClassicQuestion.insertMany(classicQuestionData);
  await KnowledgeQuestion.insertMany(knowledgeQuestionData);
  console.log("Questions added.");
};

export default generateQuestions;
