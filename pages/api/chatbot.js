import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import * as tf from '@tensorflow/tfjs';
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
console.log(text,"text query")
  let words = text
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .filter(word => !stopWords.has(word)) // Remove stop words
    .map(word => word.charCodeAt(0) / 255); // Convert to normalized character codes
  while (words.length < 10) {
    words.push(0); 
  }
  if (words.length > 10) {
    words = words.slice(0, 10); 
  } 
  return words;
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
           console.log(question,"question")
    const pdfPath = path.join(process.cwd(), 'public', 'Indian-Economy.pdf');
    try {
      const pdfWords = await getPdfContent(pdfPath);
    
      const queryProcessed = preprocessText(question); 
       console.log(queryProcessed,"queryProcessed")
      const model = await loadOrTrainModel(pdfWords);
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
