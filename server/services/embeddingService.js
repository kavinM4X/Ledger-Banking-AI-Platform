const axios = require('axios');

async function generateEmbedding(text) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    console.warn("LLM_API_KEY is missing. Skipping embedding generation.");
    // Return dummy vector of 768 dimensions so seed doesn't crash if API key isn't provided locally
    return Array(768).fill(0.01);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
    const payload = {
      model: "models/gemini-embedding-2",
      content: { parts: [{ text }] }
    };
    const response = await axios.post(url, payload);
    return response.data.embedding.values;
  } catch (error) {
    console.error("Embedding Generation Error:", error?.response?.data || error.message);
    throw new Error("Failed to generate embedding.");
  }
}

module.exports = { generateEmbedding };
