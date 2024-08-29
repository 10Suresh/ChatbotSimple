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
const searchContentByType = (pdfText, words) => {
  console.log(words, "words");
  const patterns = {
    who: /(?:who|whom).*?(\n\n|\n|$)/i,
    what: /(?:what).*?(\n\n|\n|$)/i,
    India: /(?:where).*?(\n\n|\n|$)/i,
    when: /(?:when).*?(\n\n|\n|$)/i,
    why: /(?:why).*?(\n\n|\n|$)/i,
    how: /(?:how).*?(\n\n|\n|$)/i,
    yes_no: /(?:is|are|do|does|can|will|would|should).*?(\n\n|\n|$)/i,
  };

  // Find all matches
  const matches = pdfText.match(patterns[words]);
  console.log(matches, "matches");
  if (!matches) {
    return "No relevant content found.";
  }
  return matches[5];
};
const generateResponse = (text, contextSize = 200) => {
  return text.slice(0, contextSize);
};

// Main handler function
export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;
    const pdfPath = path.join(process.cwd(), "public", "Indian-Economy.pdf");
    try {
      const pdfText = await getPdfContent(pdfPath);
      const queryProcessed = preprocessText(question);
      console.log(queryProcessed, "queryProcessed");
      const relevantContent = searchContentByType(
        pdfText,
        queryProcessed.words
      );

      console.log(relevantContent, "relevantContent");
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
