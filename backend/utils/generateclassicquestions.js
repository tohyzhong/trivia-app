import ClassicQuestion from "../models/ClassicQuestion.js";

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
    console.error("Error fetching questions.");
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
    // Repeat until we have enough questions (will be fixed once the database is populated)
    repeatedQuestions.push(...shuffledQuestions);
  }
  const selectedQuestions = repeatedQuestions.slice(0, numQuestions);

  const questionIds = selectedQuestions.map((q) => q._id);

  const firstQuestion = selectedQuestions[0];

  return { questionIds, question: firstQuestion };
};

export default getRandomClassicQuestion;
