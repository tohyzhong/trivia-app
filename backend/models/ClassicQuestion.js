import mongoose from "mongoose";

const classicQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number },
  category: { type: String, required: true, default: "General" },
  difficulty: { type: Number, required: true, default: 1 }
});

const ClassicQuestion = mongoose.model(
  "ClassicQuestion",
  classicQuestionSchema
);

export default ClassicQuestion;
