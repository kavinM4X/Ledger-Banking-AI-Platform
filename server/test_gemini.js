require('dotenv').config();
const axios = require('axios');
const apiKey = process.env.LLM_API_KEY;

async function testGemini() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ role: "user", parts: [{ text: "Hi" }] }]
    });
    console.log("Success!", response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Error:', error.response ? error.response.status + ' ' + JSON.stringify(error.response.data) : error.message);
  }
}

testGemini();
