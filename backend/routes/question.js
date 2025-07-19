import express from "express";
import sendEmail from "../utils/email.js";
import mongoose from "mongoose";
import ClassicQuestion from "../models/ClassicQuestion.js";
import KnowledgeQuestion from "../models/KnowledgeQuestion.js";
import authenticate from "./authMiddleware.js";

const router = express.Router();

router.get("/fetch-classic", authenticate, async (req, res) => {
  try {
    const result = await ClassicQuestion.aggregate([
      {
        $facet: {
          questions: [{ $match: { approved: false } }],
          categories: [{ $group: { _id: "$category" } }]
        }
      }
    ]);

    const data = result[0];
    const questions = data.questions.map((q) => ({
      ...q,
      type: "classic"
    }));
    const categories = data.categories.map((c) => c._id);
    res.status(200).json({ questions, categories });
  } catch (error) {
    console.error("Error fetching initial questions and categories:", error);
    res.status(500).send("An error occurred while fetching questions.");
  }
});

router.get("/fetch-knowledge", authenticate, async (req, res) => {
  try {
    const result = await KnowledgeQuestion.aggregate([
      {
        $facet: {
          questions: [{ $match: { approved: false } }]
        }
      }
    ]);

    const data = result[0];
    const questions = data.questions.map((q) => ({
      ...q,
      type: "knowledge"
    }));
    res.status(200).json({ questions });
  } catch (error) {
    console.error("Error fetching initial questions and categories:", error);
    res.status(500).send("An error occurred while fetching questions.");
  }
});

router.get("/search-classic", authenticate, async (req, res) => {
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
    res.json(questions.map((q) => ({ ...q._doc, type: "classic" })));
  } catch (error) {
    console.error("Error searching questions:", error);
    res.status(500).send("An error occurred while searching for questions.");
  }
});

router.get("/search-knowledge", authenticate, async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const regex = new RegExp(searchQuery, "i");

    const questions = await KnowledgeQuestion.find({
      $and: [
        {
          correctOption: { $regex: regex }
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

    res.json(questions.map((q) => ({ ...q._doc, type: "knowledge" })));
  } catch (error) {
    console.error("Error searching questions:", error);
    res.status(500).send("An error occurred while searching for questions.");
  }
});

router.put("/approve-classic/:questionId", authenticate, async (req, res) => {
  const { questionId } = req.params;
  const { category, difficulty } = req.body;
  const { username, role } = req.user;

  try {
    if (!role.includes("admin")) {
      return res
        .status(403)
        .send("You do not have permission to approve questions.");
    }

    if (typeof difficulty !== "number" || difficulty < 1 || difficulty > 5) {
      return res
        .status(400)
        .send("Please enter a valid difficulty between 1 and 5 (inclusive)");
    }

    const result = await ClassicQuestion.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(questionId) } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "username",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } }
    ]);

    if (result.length === 0) {
      return res.status(404).send("Question not found");
    }

    const question = result[0];
    const user = question.userInfo || null;

    const updated = await ClassicQuestion.findByIdAndUpdate(
      questionId,
      {
        $set: {
          approved: true,
          approvedBy: username,
          category,
          difficulty
        }
      },
      { new: true }
    );

    if (user) {
      const subject = "[The Rizz Quiz] Your question has been approved!";
      const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #28a745;">Your question was approved!</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>Great news! Your question has been reviewed and approved by an admin.</p>
            <h4>Question Details:</h4>
            <ul>
              <li><strong>Question:</strong> ${updated.question}</li>
              <li><strong>Category:</strong> ${category}</li>
              <li><strong>Difficulty:</strong> ${difficulty}</li>
            </ul>
            <p>Thanks for contributing to the community!</p>
            <p style="color: #888;">– The Rizz Quiz Admin</p>
          </div>
        `;
      await sendEmail(user.email, subject, "", html);
    }

    res.status(200).json({ message: "Question approved successfully" });
  } catch (error) {
    console.error("Error approving question:", error);
    res.status(500).send("An error occurred while approving the question.");
  }
});

router.put("/approve-knowledge/:questionId", authenticate, async (req, res) => {
  const { questionId } = req.params;
  const { difficulty } = req.body;
  const { username, role } = req.user;

  try {
    if (!role.includes("admin")) {
      return res
        .status(403)
        .send("You do not have permission to approve questions.");
    }

    if (typeof difficulty !== "number" || difficulty < 1 || difficulty > 5) {
      return res
        .status(400)
        .send("Please enter a valid difficulty between 1 and 5 (inclusive)");
    }

    const result = await KnowledgeQuestion.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(questionId) } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "username",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } }
    ]);

    if (result.length === 0) {
      return res.status(404).send("Question not found");
    }

    const question = result[0];
    const user = question.userInfo || null;

    const updated = await KnowledgeQuestion.findByIdAndUpdate(
      questionId,
      {
        $set: {
          approved: true,
          approvedBy: username,
          difficulty
        }
      },
      { new: true }
    );

    if (user) {
      const subject = "[The Rizz Quiz] Your question has been approved!";
      const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #28a745;">Your question was approved!</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>Great news! Your question has been reviewed and approved by an admin.</p>
            <h4>Question Details:</h4>
            <ul>
              <li>
                <p><strong>Meme Name:</strong> ${updated.correctOption}</p>
                <p><img src="${updated.question}" alt="Meme Question Image" style="max-width: 150px; height: auto; border-radius: 8px;" /></p>
              </li>
              <li><strong>Difficulty:</strong> ${difficulty}</li>
            </ul>
            <p>Thanks for contributing to the community!</p>
            <p style="color: #888;">– The Rizz Quiz Admin</p>
          </div>
        `;
      await sendEmail(user.email, subject, "", html);
    }

    res.status(200).json({ message: "Question approved successfully" });
  } catch (error) {
    console.error("Error approving question:", error);
    res.status(500).send("An error occurred while approving the question.");
  }
});

router.delete("/reject-classic/:questionId", authenticate, async (req, res) => {
  const { role } = req.user;
  if (!role.includes("admin")) {
    return res
      .status(403)
      .json({ message: "You do not have permission to reject questions." });
  }

  try {
    const { questionId } = req.params;
    const { reason } = req.body;

    const result = await ClassicQuestion.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(questionId) } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "username",
          as: "userInfo"
        }
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } }
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }

    const question = result[0];
    const user = question.userInfo || null;

    if (user) {
      const subject = "[The Rizz Quiz] Your question was rejected";
      const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #dc3545;">Your question was rejected</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>We regret to inform you that your submitted question was not approved by the admin team.</p>
            <h4>Question:</h4>
            <p>${question.question}</p>
            ${
              reason?.trim()
                ? `<h4>Reason:</h4><p style="background-color: #f8f8f8; padding: 10px; border-left: 4px solid #dc3545;">${reason}</p>`
                : ""
            }
            <p>If you'd like, you may revise and resubmit the question for review.</p>
            <p style="color: #888;">– The Rizz Quiz Admin</p>
          </div>
        `;
      await sendEmail(user.email, subject, "", html);
    }

    await ClassicQuestion.findByIdAndDelete(questionId);
    res.status(200).json({ message: "Question rejected and deleted." });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Failed to reject question." });
  }
});

router.delete(
  "/reject-knowledge/:questionId",
  authenticate,
  async (req, res) => {
    const { role } = req.user;
    if (!role.includes("admin")) {
      return res
        .status(403)
        .json({ message: "You do not have permission to reject questions." });
    }

    try {
      const { questionId } = req.params;
      const { reason } = req.body;

      const result = await KnowledgeQuestion.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(questionId) } },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "username",
            as: "userInfo"
          }
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } }
      ]);

      if (result.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      const question = result[0];
      const user = question.userInfo || null;

      if (user) {
        const subject = "[The Rizz Quiz] Your question was rejected";
        const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #dc3545;">Your question was rejected</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>We regret to inform you that your submitted question was not approved by the admin team.</p>
            <p><strong>Meme Name:</strong> ${question.correctOption}</p>
            <p><img src="${question.question}" alt="Meme Question Image" style="max-width: 150px; height: auto; border-radius: 8px;" /></p>
            ${
              reason?.trim()
                ? `<h4>Reason:</h4><p style="background-color: #f8f8f8; padding: 10px; border-left: 4px solid #dc3545;">${reason}</p>`
                : ""
            }
            <p>If you'd like, you may revise and resubmit the question for review.</p>
            <p style="color: #888;">– The Rizz Quiz Admin</p>
          </div>
        `;
        await sendEmail(user.email, subject, "", html);
      }

      await KnowledgeQuestion.findByIdAndDelete(questionId);
      res.status(200).json({ message: "Question rejected and deleted." });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to reject question." });
    }
  }
);

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

router.post("/requestknowledge", authenticate, async (req, res) => {
  const { question, answer, difficulty, createdBy } = req.body;

  if (
    !question ||
    typeof difficulty !== "number" ||
    difficulty < 1 ||
    difficulty > 5 ||
    !createdBy
  ) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const newQuestion = new KnowledgeQuestion({
      question,
      correctOption: answer,
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
