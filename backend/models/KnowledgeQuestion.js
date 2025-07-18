import mongoose from "mongoose";

const knowledgeQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  correctOption: { type: String, required: true },
  difficulty: { type: Number, required: true },
  approved: { type: Boolean },
  createdBy: { type: String, ref: "User" },
  approvedBy: { type: String, ref: "User" }
});

const KnowledgeQuestion = mongoose.model(
  "KnowledgeQuestion",
  knowledgeQuestionSchema
);

export default KnowledgeQuestion;
