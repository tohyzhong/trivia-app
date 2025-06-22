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

export default getRandomClassicQuestion;
