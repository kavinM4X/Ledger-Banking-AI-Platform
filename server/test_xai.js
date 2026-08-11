require('dotenv').config();
const axios = require('axios');
const apiKey = process.env.XAI_API_KEY;

async function testXAI() {
  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Reply with valid JSON.' },
          { role: 'user', content: 'Say hello in JSON format like {"message": "hello"}' }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testXAI();
