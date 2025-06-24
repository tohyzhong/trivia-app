import express from "express";
import ClassicQuestion from "../models/ClassicQuestion.js";
import authenticate from "./authMiddleware.js";

const router = express.Router();

router.get("/initial", authenticate, async (req, res) => {
  try {
    const communityQuestions = await ClassicQuestion.find({ approved: false });

    const categories = await ClassicQuestion.distinct("category");

    res.json({ questions: communityQuestions, categories });
  } catch (error) {
    console.error("Error fetching initial questions and categories:", error);
    res.status(500).send("An error occurred while fetching questions.");
  }
});

router.get("/search", authenticate, async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const regex = new RegExp(searchQuery, "i");

    const questions = await ClassicQuestion.find({
      $and: [
        {
          $or: [
            { question: { $regex: regex } },
            { options: { $elemMatch: { $regex: regex } } }
          ]
        },
        {
          $or: [
            { approved: true },
            { approved: { $exists: false } },
            { approved: null }
          ]
        }
      ]
    }).limit(10);

    res.json(questions);
  } catch (error) {
    console.error("Error searching questions:", error);
    res.status(500).send("An error occurred while searching for questions.");
  }
});

router.put("/approve/:questionId", authenticate, async (req, res) => {
  const { questionId } = req.params;
  const { category } = req.body;
  const { username, role } = req.user;

  try {
    if (role !== "admin") {
      return res
        .status(403)
        .send("You do not have permission to approve questions.");
    }

    const question = await ClassicQuestion.findById(questionId);

    if (!question) {
      return res.status(404).send("Question not found");
    }

    question.approved = true;
    question.approvedBy = username;
    question.category = category;

    await question.save();

    res.status(200).json({ message: "Question approved successfully" });
  } catch (error) {
    console.error("Error approving question:", error);
    res.status(500).send("An error occurred while approving the question.");
  }
});

router.delete("/reject/:id", authenticate, async (req, res) => {
  const { role } = req.user;
  if (role !== "admin") {
    return res
      .status(403)
      .json({ message: "You do not have permission to reject questions." });
  }

  try {
    const { id } = req.params;
    await ClassicQuestion.findByIdAndDelete(id);
    res.status(200).json({ message: "Question rejected and deleted." });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Failed to reject question." });
  }
});

router.post("/request", authenticate, async (req, res) => {
  const {
    question,
    options,
    correctOption,
    explanation,
    category,
    difficulty,
    approved,
    createdBy
  } = req.body;

  if (
    !question ||
    !Array.isArray(options) ||
    options.length !== 4 ||
    options.some((opt) => typeof opt !== "string" || opt.trim() === "") ||
    !Number.isInteger(correctOption) ||
    correctOption < 1 ||
    correctOption > 4 ||
    !explanation ||
    !category ||
    typeof difficulty !== "number" ||
    difficulty < 1 ||
    difficulty > 5 ||
    typeof approved !== "boolean" ||
    !createdBy
  ) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const newQuestion = new ClassicQuestion({
      question: `[Contributed by ${createdBy}] ${question.trim()}`,
      options: options.map((opt) => opt.trim()),
      correctOption,
      explanation: explanation.trim(),
      category: category.trim(),
      difficulty,
      approved: false,
      createdBy
    });

    await newQuestion.save();

    res.status(201).json({ message: "Question submitted successfully." });
  } catch (err) {
    console.error("Error saving question:", err);
    res
      .status(500)
      .json({ message: "Server error while submitting question." });
  }
});

export default router;
