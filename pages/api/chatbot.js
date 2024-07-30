import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import * as tf from '@tensorflow/tfjs';

// Set of common stop words
const stopWords = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
  "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
  "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
  "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
  "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
  "should", "now"
]);

// Function to get PDF content
const getPdfContent = async (pdfPath) => {
  const dataBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text.split(/\s+/);
};

// Function to preprocess text (question)
const preprocessText = (text) => {
  let queryProcessed = text.split(' ')
    .filter(word => /^[a-zA-Z]+$/.test(word) && !stopWords.has(word.toLowerCase())) // Filter out non-alphabetic and stop words
    .map(word => word.charCodeAt(0) / 255);
    console.log(queryProcessed,"queryProcess")
  // Ensure the processed query has exactly 10 elements
  while (queryProcessed.length < 10) {
    queryProcessed.push(0);
  }
  if (queryProcessed.length > 10) {
    queryProcessed = queryProcessed.slice(0, 10);
  }
  return queryProcessed;
};

// Placeholder function to load or train a model
const loadOrTrainModel = async (pdfWords) => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, inputShape: [10], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: pdfWords.length, activation: 'softmax' }));
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

  // Prepare training data
  const xs = tf.randomNormal([100, 10]);
  const ys = tf.oneHot(tf.randomUniform([100], 0, pdfWords.length, 'int32'), pdfWords.length);
  
  await model.fit(xs, ys, { epochs: 10 });
  return model;
};

// Function to predict response
const predictResponse = async (model, queryProcessed) => {
  const input = tf.tensor2d(queryProcessed, [1, 10]);
  const prediction = model.predict(input);
  const responseIndex = prediction.argMax(-1).dataSync()[0];
  return responseIndex;
};

// Function to generate a coherent response
const generateResponse = (pdfWords, responseIndex, contextSize = 10) => {
  const start = Math.max(0, responseIndex - Math.floor(contextSize / 2));
  const end = Math.min(pdfWords.length, responseIndex + Math.ceil(contextSize / 2));
  return pdfWords.slice(start, end).join(' ');
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { question } = req.body;
    const pdfPath = path.join(process.cwd(), 'public', 'coaching-material.pdf');
    try {
      const pdfWords = await getPdfContent(pdfPath);
      const queryProcessed = preprocessText(question);
      const model = await loadOrTrainModel(pdfWords);

      // Predict response index
      const responseIndex = await predictResponse(model, [queryProcessed]);
      let response;
      if (typeof responseIndex !== 'number' || responseIndex < 0 || responseIndex >= pdfWords.length || !pdfWords[responseIndex]) {
        response = 'I have no answer for this question. Please ask another question.';
      } else {
        response = generateResponse(pdfWords, responseIndex);
      }
      res.status(200).json({ response });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Error processing PDF' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// import { promises as fs } from 'fs';
// import path from 'path';
// import pdfParse from 'pdf-parse';
// import * as tf from '@tensorflow/tfjs';

// // Function to get PDF content
// const getPdfContent = async (pdfPath) => {
//   const dataBuffer = await fs.readFile(pdfPath);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text.split(' ');
// };

// // Function to preprocess text (question)
// const preprocessText = (text) => {
//   let queryProcessed = text.split(' ')
//     .filter(word => /^[a-zA-Z]+$/.test(word)) // गैर-अक्षर शब्दों को निकालें
//     .map(word => word.charCodeAt(0) / 255); // शब्दों को संख्या में बदलें
//   // सुनिश्चित करें कि संसाधित क्वेरी में ठीक 10 तत्व हों
//   while (queryProcessed.length < 10) {
//     queryProcessed.push(0);
//   }
//   if (queryProcessed.length > 10) {
//     queryProcessed = queryProcessed.slice(0, 10);
//   }
//   return queryProcessed;
// };

// // Function to extract keywords
// const keywordExtraction = (text) => {
//   const stopWords = new Set([
//     "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
//     "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
//     "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
//     "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
//     "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
//     "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
//     "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
//     "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
//     "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
//     "should", "now"
//   ]);

//   return text.split(' ')
//     .filter(word => /^[a-zA-Z]+$/.test(word) && !stopWords.has(word.toLowerCase()))
//     .map(word => word.toLowerCase());
// };

// // Function to classify question
// const classifyQuestion = (keywords) => {
//   if (keywords.includes("what") || keywords.includes("which")) {
//     return "definition";
//   } else if (keywords.includes("how")) {
//     return "procedure";
//   } else if (keywords.includes("when") || keywords.includes("where")) {
//     return "time/place";
//   } else {
//     return "general";
//   }
// };

// // Placeholder function to load or train a model
// const loadOrTrainModel = async (pdfWords) => {
//   const model = tf.sequential();
//   model.add(tf.layers.dense({ units: 128, inputShape: [10], activation: 'relu' }));
//   model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
//   model.add(tf.layers.dense({ units: pdfWords.length, activation: 'softmax' }));
//   model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

//   const xs = tf.randomNormal([100, 10]);
//   const ys = tf.oneHot(tf.randomUniform([100], 0, pdfWords.length, 'int32'), pdfWords.length);

//   await model.fit(xs, ys, { epochs: 10 });

//   return model;
// };

// // Function to predict response
// const predictResponse = async (model, queryProcessed) => {
//   const input = tf.tensor2d(queryProcessed, [1, 10]);
//   const prediction = model.predict(input);
//   const responseIndex = prediction.argMax(-1).dataSync()[0];
//   return responseIndex;
// };

// // Function to match question and answer
// const matchQuestionAnswer = async (question, pdfContent) => {
//   const keywords = keywordExtraction(question);
//   const questionType = classifyQuestion(keywords);
  
//   const model = await loadOrTrainModel(pdfContent);
//   const queryProcessed = preprocessText(keywords.join(' '));
  
//   const responseIndex = await predictResponse(model, [queryProcessed]);
  
//   if (responseIndex < 0 || responseIndex >= pdfContent.length) {
//     return "इस प्रश्न का मेरे पास कोई उत्तर नहीं है। कृपया एक और प्रश्न पूछें।";
//   } else {
//     let response = "";
//     if (questionType === "definition") {
//       response = pdfContent.slice(responseIndex, responseIndex + 20).join(' ');
//     } else if (questionType === "procedure") {
//       response = pdfContent.slice(responseIndex, responseIndex + 50).join(' ');
//     } else if (questionType === "time/place") {
//       response = pdfContent.slice(responseIndex, responseIndex + 30).join(' ');
//     } else {
//       response = pdfContent.slice(responseIndex, responseIndex + 10).join(' ');
//     }
//     return response;
//   }
// };

// // API handler function
// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     const { question } = req.body;
//     const pdfPath = path.join(process.cwd(), 'public', 'coaching-material.pdf');
//     try {
//       const pdfWords = await getPdfContent(pdfPath);
//       const response = await matchQuestionAnswer(question, pdfWords);
//       res.status(200).json({ response });
//     } catch (error) {
//       console.error('अनुरोध संसाधित करने में त्रुटि:', error);
//       res.status(500).json({ error: 'PDF संसाधित करने में त्रुटि' });
//     }
//   } else {
//     res.status(405).json({ error: 'विधि अनुमति नहीं है' });
//   }
// }
