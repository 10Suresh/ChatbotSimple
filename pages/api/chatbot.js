import { promises as fs } from "fs";
import path from "path";
import pdfParse from "pdf-parse";

// Function to get PDF content
const getPdfContent = async (pdfPath) => {
  const dataBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
};

// Predefined patterns to recognize different question types
const questionPatterns = {
  who: /who\s+|whom\s+/i,
  what: /what\s+/i,
  where: /where\s+/i,
  when: /when\s+/i,
  why: /why\s+/i,
  how: /how\s+/i,
  yes_no: /(?:is|are|do|does|can|will|would|should)\s+/i,
};

// Function to preprocess and categorize the text
const preprocessText = (text) => {
  let words = text
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .toLowerCase()
    .split(/\s+/); // Split by whitespace

  // Recognize question type
  let questionType = "unknown";
  for (const [type, pattern] of Object.entries(questionPatterns)) {
    if (pattern.test(text)) {
      questionType = type;
      break;
    }
  }

  return {
    words,
    questionType,
  };
};

// Function to search PDF content based on question type
const searchContentByType = (pdfText, questionType) => {
  const patterns = {
    who: /(?:who|whom).*?(\n\n|\n|$)/i,
    what: /(?:what).*?(\n\n|\n|$)/i,
    where: /(?:India).*?(\n\n|\n|$)/i,
    when: /(?:when).*?(\n\n|\n|$)/i,
    why: /(?:why).*?(\n\n|\n|$)/i,
    how: /(?:India).*?(\n\n|\n|$)/i,
    yes_no: /(?:is|are|do|does|can|will|would|should).*?(\n\n|\n|$)/i,
  };
  let relevantContent = pdfText.match(patterns[questionType]);
  return relevantContent ? relevantContent[0] : "No relevant content found.";
};

// Placeholder function for a more sophisticated model
const generateResponse = (text, contextSize = 100) => {
  // For simplicity, this function just returns a portion of the text.
  // You can replace this with more advanced response generation logic.
  return text.slice(0, contextSize);
};

// Main handler function
export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;
    const pdfPath = path.join(process.cwd(), "public", "coaching-material.pdf");
    try {
      const pdfText = await getPdfContent(pdfPath);
      const queryProcessed = preprocessText(question);
      console.log(queryProcessed, "queryProcessed");
      // Search for relevant content based on the question type
      const relevantContent = searchContentByType(
        pdfText,
        queryProcessed.questionType
      );

      // Generate response (simplified version)
      const response = relevantContent || generateResponse(pdfText);

      res.status(200).json({ response });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ error: "Error processing PDF" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
