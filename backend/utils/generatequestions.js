import ClassicQuestion from "../models/ClassicQuestion.js";
import KnowledgeQuestion from "../models/KnowledgeQuestion.js";

const getRandomClassicQuestion = async (categories) => {
  try {
    const allQuestions = await ClassicQuestion.find({
      category: { $in: categories }
    });

    if (allQuestions.length <= 0) {
      return new Error({ message: "No questions found." });
    }

    const question =
      allQuestions[Math.floor(Math.random() * allQuestions.length)];
    return question;
  } catch (error) {
    console.error(error);
    return new Error({ message: "Error fetching questions." });
  }
};

export const getQuestionById = async (questionId) => {
  const question = await ClassicQuestion.collection.findOne({
    _id: questionId
  });
  return question;
};

export const generateUniqueQuestionIds = async (
  numQuestions,
  categories,
  difficulty
) => {
  const allQuestions = await ClassicQuestion.find({
    category: { $in: categories },
    difficulty: { $lte: difficulty }
  });

  const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
  const repeatedQuestions = [];
  while (repeatedQuestions.length < numQuestions) {
    repeatedQuestions.push(...shuffledQuestions);
  }
  const selectedQuestions = repeatedQuestions.slice(0, numQuestions);

  const questionIds = [];
  const questionCategories = [];
  selectedQuestions.forEach((q) => {
    questionIds.push(q._id);
    questionCategories.push(q.category);
  });

  const firstQuestion = selectedQuestions[0];

  return { questionIds, questionCategories, question: firstQuestion };
};

export const generateUniqueKnowledgeQuestionIds = async (
  numQuestions,
  difficulty,
  communityMode
) => {
  const allQuestions = await KnowledgeQuestion.find({
    difficulty: { $lte: difficulty },
    approved: !communityMode
  });

  const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
  const repeatedQuestions = [];
  while (repeatedQuestions.length < numQuestions) {
    repeatedQuestions.push(...shuffledQuestions);
  }
  const selectedQuestions = repeatedQuestions.slice(0, numQuestions);

  const questionIds = [];
  selectedQuestions.forEach((q) => {
    questionIds.push(q._id);
  });

  const firstQuestion = selectedQuestions[0];

  return { questionIds, question: firstQuestion };
};

export const getKnowledgeQuestionById = async (questionId) => {
  const question = await KnowledgeQuestion.collection.findOne({
    _id: questionId
  });
  return question;
};

export default getRandomClassicQuestion;
