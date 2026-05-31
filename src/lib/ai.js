import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if the key is the known leaked one and fail fast
function checkLeakedKey(apiKey) {
  if (apiKey === "[ENCRYPTION_KEY]") {
    throw new Error("Your API key was reported as leaked and disabled by Google. Please generate a NEW key at aistudio.google.com and replace it in your .env.local file.");
  }
}

export async function getBusinessPrediction(historicalData) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    // Explicitly check for the known disabled key
    checkLeakedKey(apiKey);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Using 2.5-flash and forcing a strict JSON response
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      As a business analyst for a restaurant, analyze the following historical order data and predict whether business will go up or down next month.
      
      Historical Data (Last 12 weeks):
      ${JSON.stringify(historicalData, null, 2)}
      
      Provide a concise prediction.
      Format your response as a JSON object with EXACTLY these fields:
      {
        "trend": "Up" | "Down" | "Stable",
        "message": "A short summary",
        "reason": "Detailed reason based on data",
        "tip": "Actionable tip"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Prediction Error:", error);
    if (error.message?.includes("leaked")) throw error;

    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return getBusinessPredictionFallback(historicalData);
    }
    throw error;
  }
}

async function getBusinessPredictionFallback(historicalData) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    checkLeakedKey(apiKey);

    const genAI = new GoogleGenerativeAI(apiKey);

    // FIXED: Changed "gemini-pro" to "gemini-1.5-flash" for a reliable fallback
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Analyze these orders and predict next month trend (Up/Down/Stable). 
      Data: ${JSON.stringify(historicalData)}. 
      Return JSON strictly matching this schema: {"trend": "string", "message": "string", "reason": "string", "tip": "string"}.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);

  } catch (e) {
    console.error("Fallback Prediction Error:", e);
    return {
      trend: "Stable",
      message: "Analysis unavailable at the moment.",
      reason: "Could not connect to the AI prediction service.",
      tip: "Please manually review your historical data."
    };
  }
}