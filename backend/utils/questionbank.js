import ClassicQuestion from "../models/ClassicQuestion.js";

const generateQuestions = async () => {
  await ClassicQuestion.deleteMany();
  console.log('Questions cleared.')

  const documents = [];
  for (let i=0; i<5; i++) {
    const document = {
      question: `Question ${i}`,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctOption: i%4+1
    };
    documents.push(document);
  }

  await ClassicQuestion.insertMany(documents);
  console.log('Questions added.')
}

export default generateQuestions;