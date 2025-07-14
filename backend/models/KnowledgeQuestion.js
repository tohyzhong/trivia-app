import mongoose from "mongoose";

const knowledgeQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: Number, required: true }
});

const KnowledgeQuestion = mongoose.model(
  "KnowledgeQuestion",
  knowledgeQuestionSchema
);

export default KnowledgeQuestion;
