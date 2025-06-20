import mongoose from "mongoose";

const classicQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number },
  category: { type: String, required: true },
  difficulty: { type: Number, required: true }
});

const ClassicQuestion = mongoose.model(
  "ClassicQuestion",
  classicQuestionSchema
);

export default ClassicQuestion;
