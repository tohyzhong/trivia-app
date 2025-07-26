import { beforeAll, describe, it, expect } from "vitest";
import ClassicQuestion from "../models/ClassicQuestion.js";
import KnowledgeQuestion from "../models/KnowledgeQuestion.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import mongoose from "mongoose";

let request;
let userCookie;
let adminCookie;
let superadminCookie;

beforeAll(async () => {
  request = global.request;
  userCookie = global.userCookie;
  adminCookie = global.adminCookie;
  superadminCookie = global.superadminCookie;

  await ClassicQuestion.deleteMany({});
  await KnowledgeQuestion.deleteMany({});
  await User.deleteMany({});
  await Profile.deleteMany({});

  await User.insertOne({
    username: "basic_user",
    password: "sample",
    email: "test@xyz.com",
    role: "user"
  });

  await ClassicQuestion.insertMany([
    {
      question: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      correctOption: 1,
      explanation: "Paris is the capital of France.",
      category: "Community",
      difficulty: 1,
      approved: false,
      createdBy: "admin_user"
    },
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctOption: 2,
      explanation: "2 + 2 equals 4.",
      category: "Math",
      difficulty: 1,
      approved: true,
      createdBy: "superadmin_user"
    }
  ]);

  await KnowledgeQuestion.insertMany([
    {
      question: "blue.jpg",
      correctOption: "Blue Chinese Man",
      difficulty: 2,
      approved: false,
      createdBy: "admin_user"
    },
    {
      question: "green.jpg",
      correctOption: "Mike Wazowski",
      difficulty: 1,
      approved: true,
      createdBy: "superadmin_user"
    }
  ]);
});

describe("GET /fetch-classic", () => {
  it("should deny access to normal users", async () => {
    const res = await request
      .get("/api/questions/fetch-classic")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorised to view this page.");
  });

  it("should return classic questions and categories for admin", async () => {
    const res = await request
      .get("/api/questions/fetch-classic")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories.length).toBe(2);
    expect(res.body.questions.length).toBe(1);
    expect(res.body.questions[0]).toMatchObject({
      question: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      correctOption: 1,
      explanation: "Paris is the capital of France.",
      category: "Community",
      difficulty: 1,
      approved: false,
      createdBy: "admin_user"
    });
    expect(res.body.categories.sort()).toEqual(["Community", "Math"].sort());
  });

  it("should return classic questions and categories for superadmin", async () => {
    const res = await request
      .get("/api/questions/fetch-classic")
      .set("Cookie", superadminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories.length).toBe(2);
    expect(res.body.questions.length).toBe(1);
    expect(res.body.questions[0]).toMatchObject({
      question: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      correctOption: 1,
      explanation: "Paris is the capital of France.",
      category: "Community",
      difficulty: 1,
      approved: false,
      createdBy: "admin_user"
    });
    expect(res.body.categories.sort()).toEqual(["Community", "Math"].sort());
  });
});

describe("GET /fetch-knowledge", () => {
  it("should deny access to normal users", async () => {
    const res = await request
      .get("/api/questions/fetch-knowledge")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorised to view this page.");
  });

  it("should return unapproved knowledge questions for admin", async () => {
    const res = await request
      .get("/api/questions/fetch-knowledge")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBe(1);
    expect(res.body.questions[0]).toMatchObject({
      question: "blue.jpg",
      correctOption: "Blue Chinese Man",
      difficulty: 2,
      approved: false,
      createdBy: "admin_user",
      type: "knowledge"
    });
  });

  it("should return unapproved knowledge questions for superadmin", async () => {
    const res = await request
      .get("/api/questions/fetch-knowledge")
      .set("Cookie", superadminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBe(1);
    expect(res.body.questions[0]).toMatchObject({
      question: "blue.jpg",
      correctOption: "Blue Chinese Man",
      difficulty: 2,
      approved: false,
      createdBy: "admin_user",
      type: "knowledge"
    });
  });
});

describe("GET /search-classic", () => {
  it("should deny access to normal users", async () => {
    const res = await request
      .get("/api/questions/search-classic?searchQuery=2")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorised to view this page.");
  });

  it("should return matching classic questions for admin", async () => {
    const res = await request
      .get("/api/questions/search-classic?searchQuery=2")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctOption: 2,
      explanation: "2 + 2 equals 4.",
      category: "Math",
      difficulty: 1,
      approved: true,
      createdBy: "superadmin_user",
      type: "classic"
    });
  });

  it("should return matching classic questions for superadmin", async () => {
    const res = await request
      .get("/api/questions/search-classic?searchQuery=admin")
      .set("Cookie", superadminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctOption: 2,
      explanation: "2 + 2 equals 4.",
      category: "Math",
      difficulty: 1,
      approved: true,
      createdBy: "superadmin_user",
      type: "classic"
    });
  });
});

describe("GET /search-knowledge", () => {
  it("should deny access to normal users", async () => {
    const res = await request
      .get("/api/questions/search-knowledge?searchQuery=mike")
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorised to view this page.");
  });

  it("should return matching knowledge questions for admin", async () => {
    const res = await request
      .get("/api/questions/search-knowledge?searchQuery=mike")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({
      question: "green.jpg",
      correctOption: "Mike Wazowski",
      difficulty: 1,
      approved: true,
      createdBy: "superadmin_user"
    });
  });

  it("should return matching knowledge questions for superadmin", async () => {
    const res = await request
      .get("/api/questions/search-knowledge?searchQuery=admin")
      .set("Cookie", superadminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({
      question: "green.jpg",
      correctOption: "Mike Wazowski",
      difficulty: 1,
      approved: true,
      createdBy: "superadmin_user"
    });
  });
});

describe("PUT /approve-classic/:questionId", () => {
  let classicQuestionId;

  beforeAll(async () => {
    const created = await ClassicQuestion.create({
      question: "What is 1 + 1?",
      options: ["1", "2", "3", "4"],
      correctOption: 2,
      explanation: "1 + 1 equals 2.",
      category: "Community",
      difficulty: 1,
      approved: false,
      createdBy: "basic_user"
    });
    classicQuestionId = created._id.toString();
  });

  it("should deny access to normal users", async () => {
    const res = await request
      .put(`/api/questions/approve-classic/${classicQuestionId}`)
      .set("Cookie", userCookie)
      .send({ category: "Math", difficulty: 2 });

    expect(res.status).toBe(403);
    expect(res.text).toBe("You do not have permission to approve questions.");
  });

  it("should return 400 if difficulty is invalid", async () => {
    const res = await request
      .put(`/api/questions/approve-classic/${classicQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ category: "Math", difficulty: 6 });

    expect(res.status).toBe(400);
    expect(res.text).toBe(
      "Please enter a valid difficulty between 1 and 5 (inclusive)"
    );

    const res2 = await request
      .put(`/api/questions/approve-classic/${classicQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ category: "Math", difficulty: 0 });

    expect(res2.status).toBe(400);
    expect(res2.text).toBe(
      "Please enter a valid difficulty between 1 and 5 (inclusive)"
    );
  });

  it("should return 404 if the question does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request
      .put(`/api/questions/approve-classic/${fakeId}`)
      .set("Cookie", adminCookie)
      .send({ category: "Math", difficulty: 3 });

    expect(res.status).toBe(404);
    expect(res.text).toBe("Question not found");
  });

  it("should approve the question and update fields correctly (admin) and email", async () => {
    delete global.approveText;
    const res = await request
      .put(`/api/questions/approve-classic/${classicQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ category: "Math", difficulty: 4 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question approved successfully");

    const updated = await ClassicQuestion.findById(classicQuestionId).lean();
    expect(updated).toMatchObject({
      approved: true,
      approvedBy: "admin",
      category: "Math",
      difficulty: 4,
      question: "What is 1 + 1?",
      options: ["1", "2", "3", "4"],
      correctOption: 2,
      explanation: "1 + 1 equals 2.",
      createdBy: "basic_user"
    });

    expect(global.approveText).toContain("What is 1 + 1?");
    expect(global.approveText).toContain("Math");
    expect(global.approveText).toContain("4");

    delete global.approveText;
  });

  it("should allow superadmin to approve another question and email", async () => {
    delete global.approveText;
    const another = await ClassicQuestion.create({
      question: "What is the capital of Japan?",
      options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
      correctOption: 3,
      explanation: "Tokyo is the capital of Japan.",
      category: "Community",
      difficulty: 1,
      approved: false,
      createdBy: "basic_user"
    });

    const res = await request
      .put(`/api/questions/approve-classic/${another._id}`)
      .set("Cookie", superadminCookie)
      .send({ category: "Geography", difficulty: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question approved successfully");

    const updated = await ClassicQuestion.findById(another._id).lean();
    expect(updated).toMatchObject({
      approved: true,
      approvedBy: "superadmin",
      category: "Geography",
      difficulty: 2,

      question: "What is the capital of Japan?",
      options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
      correctOption: 3,
      explanation: "Tokyo is the capital of Japan.",
      createdBy: "basic_user"
    });

    expect(global.approveText).toContain("What is the capital of Japan?");
    expect(global.approveText).toContain("Geography");
    expect(global.approveText).toContain("2");

    delete global.approveText;
  });
});

describe("PUT /approve-knowledge/:questionId", () => {
  let knowledgeQuestionId;

  beforeAll(async () => {
    const created = await KnowledgeQuestion.create({
      question: "meme.jpg",
      correctOption: "Success Kid",
      difficulty: 1,
      approved: false,
      createdBy: "basic_user"
    });

    knowledgeQuestionId = created._id.toString();
  });

  it("should deny access to normal users", async () => {
    const res = await request
      .put(`/api/questions/approve-knowledge/${knowledgeQuestionId}`)
      .set("Cookie", userCookie)
      .send({ difficulty: 3 });

    expect(res.status).toBe(403);
    expect(res.text).toBe("You do not have permission to approve questions.");
  });

  it("should return 400 for invalid difficulty", async () => {
    const res = await request
      .put(`/api/questions/approve-knowledge/${knowledgeQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ difficulty: 6 });

    expect(res.status).toBe(400);
    expect(res.text).toBe(
      "Please enter a valid difficulty between 1 and 5 (inclusive)"
    );

    const res2 = await request
      .put(`/api/questions/approve-knowledge/${knowledgeQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ difficulty: 0 });

    expect(res2.status).toBe(400);
    expect(res2.text).toBe(
      "Please enter a valid difficulty between 1 and 5 (inclusive)"
    );
  });

  it("should return 404 for non-existent question", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request
      .put(`/api/questions/approve-knowledge/${fakeId}`)
      .set("Cookie", adminCookie)
      .send({ difficulty: 2 });

    expect(res.status).toBe(404);
    expect(res.text).toBe("Question not found");
  });

  it("should approve the knowledge question correctly (admin) and email", async () => {
    delete global.approveText;
    const res = await request
      .put(`/api/questions/approve-knowledge/${knowledgeQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ difficulty: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question approved successfully");

    const updated =
      await KnowledgeQuestion.findById(knowledgeQuestionId).lean();
    expect(updated).toMatchObject({
      approved: true,
      approvedBy: "admin",
      difficulty: 2,

      question: "meme.jpg",
      correctOption: "Success Kid",
      createdBy: "basic_user"
    });

    expect(global.approveText).toContain("Success Kid");
    expect(global.approveText).toContain("meme.jpg");
    expect(global.approveText).toContain("2");
  });

  it("should allow superadmin to approve another knowledge question and email", async () => {
    const another = await KnowledgeQuestion.create({
      question: "doge.jpg",
      correctOption: "Doge",
      difficulty: 1,
      approved: false,
      createdBy: "basic_user"
    });

    delete global.approveText;

    const res = await request
      .put(`/api/questions/approve-knowledge/${another._id}`)
      .set("Cookie", superadminCookie)
      .send({ difficulty: 4 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question approved successfully");

    const updated = await KnowledgeQuestion.findById(another._id).lean();
    expect(updated).toMatchObject({
      approved: true,
      approvedBy: "superadmin",
      difficulty: 4,

      question: "doge.jpg",
      correctOption: "Doge",
      createdBy: "basic_user"
    });

    expect(global.approveText).toContain("Doge");
    expect(global.approveText).toContain("doge.jpg");
    expect(global.approveText).toContain("4");

    delete global.approveText;
  });
});

describe("DELETE /reject-classic/:questionId", () => {
  let classicQuestionId;

  beforeAll(async () => {
    const created = await ClassicQuestion.create({
      question: "What is 3+3?",
      options: ["3", "4", "5", "6"],
      correctOption: 4,
      explanation: "3+3=6",
      category: "Math",
      difficulty: 1,
      approved: false,
      createdBy: "basic_user"
    });
    classicQuestionId = created._id.toString();
  });

  it("should deny access to normal users", async () => {
    const res = await request
      .delete(`/api/questions/reject-classic/${classicQuestionId}`)
      .set("Cookie", userCookie)
      .send({ reason: "Not a good question" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "You do not have permission to reject questions."
    );
  });

  it("should return 404 if question not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request
      .delete(`/api/questions/reject-classic/${fakeId}`)
      .set("Cookie", adminCookie)
      .send({ reason: "Invalid content" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found.");
  });

  it("should reject and delete the question, sending email with reason (admin)", async () => {
    delete global.questionText;

    const res = await request
      .delete(`/api/questions/reject-classic/${classicQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ reason: "Too easy" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question rejected and deleted.");

    const deleted = await ClassicQuestion.findById(classicQuestionId);
    expect(deleted).toBeNull();

    expect(global.questionText).toContain("Too easy");
    expect(global.questionText).toContain("What is 3+3?");

    delete global.questionText;
  });

  it("should reject and delete the question without reason in email (superadmin)", async () => {
    const created = await ClassicQuestion.create({
      question: "What is 5+5?",
      options: ["9", "10", "11", "12"],
      correctOption: 1,
      explanation: "5+5=10",
      category: "Math",
      difficulty: 1,
      approved: false,
      createdBy: "basic_user"
    });
    const questionId = created._id.toString();

    delete global.questionText;

    const res = await request
      .delete(`/api/questions/reject-classic/${questionId}`)
      .set("Cookie", superadminCookie)
      .send({ reason: "" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question rejected and deleted.");

    const deleted = await ClassicQuestion.findById(questionId);
    expect(deleted).toBeNull();

    expect(global.questionText).toBeDefined();
    expect(global.questionText).toContain("What is 5+5?");

    delete global.questionText;
  });
});

describe("DELETE /reject-knowledge/:questionId", () => {
  let knowledgeQuestionId;

  beforeAll(async () => {
    const created = await KnowledgeQuestion.create({
      question: "meme1.jpg",
      correctOption: "Sigma",
      createdBy: "basic_user",
      approved: false,
      type: "knowledge",
      difficulty: 3
    });
    knowledgeQuestionId = created._id.toString();
  });

  it("should deny access to normal users", async () => {
    const res = await request
      .delete(`/api/questions/reject-knowledge/${knowledgeQuestionId}`)
      .set("Cookie", userCookie)
      .send({ reason: "Not a good meme" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "You do not have permission to reject questions."
    );
  });

  it("should return 404 if question not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request
      .delete(`/api/questions/reject-knowledge/${fakeId}`)
      .set("Cookie", adminCookie)
      .send({ reason: "Invalid meme" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found.");
  });

  it("should reject and delete the question, sending email with reason (admin)", async () => {
    delete global.questionText;

    const res = await request
      .delete(`/api/questions/reject-knowledge/${knowledgeQuestionId}`)
      .set("Cookie", adminCookie)
      .send({ reason: "Inappropriate meme" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question rejected and deleted.");

    const deleted = await KnowledgeQuestion.findById(knowledgeQuestionId);
    expect(deleted).toBeNull();

    expect(global.questionText).toContain("Inappropriate meme");
    expect(global.questionText).toContain("Sigma");

    delete global.questionText;
  });

  it("should reject and delete the question without reason in email (superadmin)", async () => {
    const created = await KnowledgeQuestion.create({
      question: "meme2.jpg",
      correctOption: "Chad",
      createdBy: "basic_user",
      approved: false,
      type: "knowledge",
      difficulty: 1
    });
    const questionId = created._id.toString();

    delete global.questionText;

    const res = await request
      .delete(`/api/questions/reject-knowledge/${questionId}`)
      .set("Cookie", superadminCookie)
      .send({ reason: "" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Question rejected and deleted.");

    const deleted = await KnowledgeQuestion.findById(questionId);
    expect(deleted).toBeNull();

    expect(global.questionText).toContain("Chad");
    delete global.questionText;
  });
});

describe("POST /request", () => {
  it("should reject unauthenticated users", async () => {
    const res = await request.post("/api/questions/request").send({});
    expect(res.status).toBe(401);
  });

  it("should return 400 for invalid input", async () => {
    const res = await request
      .post("/api/questions/request")
      .set("Cookie", userCookie)
      .send({
        question: "Incomplete",
        options: ["A", "B"],
        correctOption: 2,
        explanation: "",
        category: "Community",
        difficulty: 2,
        approved: false,
        createdBy: "basic_user"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid input data");
  });

  it("should submit a valid question", async () => {
    const payload = {
      question: "What is a country?",
      options: ["Berlin", "France", "Madrid", "Rome"],
      correctOption: 2,
      explanation: "The rest are cities.",
      category: "Geography",
      difficulty: 3,
      approved: false,
      createdBy: "basic_user"
    };

    const res = await request
      .post("/api/questions/request")
      .set("Cookie", userCookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Question submitted successfully.");

    const stored = await ClassicQuestion.findOne({
      question: new RegExp("country")
    });

    expect(stored).not.toBeNull();
    expect(stored?.question).toContain("[Contributed by basic_user]");
    expect(stored?.approved).toBe(false);
    expect(stored?.options).toEqual(payload.options);
    expect(stored?.correctOption).toBe(payload.correctOption);
    expect(stored?.explanation).toBe(payload.explanation);
    expect(stored?.category).toBe(payload.category);
    expect(stored?.difficulty).toBe(payload.difficulty);
  });
});

describe("POST /requestknowledge", () => {
  it("should reject unauthenticated users", async () => {
    const res = await request.post("/api/questions/requestknowledge").send({});
    expect(res.status).toBe(401);
  });

  it("should return 400 for invalid input", async () => {
    const res = await request
      .post("/api/questions/requestknowledge")
      .set("Cookie", userCookie)
      .send({
        question: "meme123.jpg",
        answer: "Meme123"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid input data");
  });

  it("should submit a valid knowledge question", async () => {
    const payload = {
      question: "meme123.jpg",
      answer: "Meme123",
      difficulty: 1,
      createdBy: "basic_user"
    };

    const res = await request
      .post("/api/questions/requestknowledge")
      .set("Cookie", userCookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Question submitted successfully.");

    const stored = await KnowledgeQuestion.findOne({
      question: payload.question
    });

    expect(stored).not.toBeNull();
    expect(stored?.correctOption).toBe(payload.answer);
    expect(stored?.difficulty).toBe(payload.difficulty);
    expect(stored?.approved).toBe(false);
    expect(stored?.createdBy).toBe(payload.createdBy);
  });
});
