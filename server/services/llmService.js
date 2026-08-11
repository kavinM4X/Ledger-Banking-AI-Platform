const axios = require('axios');
const { systemPrompt: collectionSystemPrompt } = require('../prompts/collectionPrompt');

async function callGeminiAPI(systemText, userText, responseMimeType = "text/plain") {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("LLM_API_KEY is missing. Cannot generate AI content.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    system_instruction: {
      parts: [{ text: systemText }]
    },
    contents: [{
      role: "user",
      parts: [{ text: userText }]
    }],
    generationConfig: {
      response_mime_type: responseMimeType
    }
  };

  try {
    const response = await axios.post(url, payload);
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("Gemini API Error Details:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// F1: Collections Call-Script (Strict JSON structured output)
async function generateCallScript(context) {
  const userPrompt = `Context:\n${JSON.stringify(context, null, 2)}`;
  
  try {
    const textResponse = await callGeminiAPI(collectionSystemPrompt, userPrompt, "application/json");
    const parsed = JSON.parse(textResponse);
    
    // Strict validation
    if (!parsed.priority || !['HIGH', 'MEDIUM', 'LOW'].includes(parsed.priority)) throw new Error("Invalid priority");
    if (typeof parsed.reason !== 'string') throw new Error("Invalid reason");
    if (typeof parsed.call_script !== 'string') throw new Error("Invalid call_script");
    if (typeof parsed.recommended_action !== 'string') throw new Error("Invalid recommended_action");
    
    return parsed;
  } catch (error) {
    console.error("LLM Generation Error:", error?.response?.data || error.message);
    throw new Error("Unable to generate a valid collection response.");
  }
}

// F2: Monthly Spend Brief
async function generateSpendBrief(context) {
  const systemPrompt = `You are a banking assistant writing a monthly spending brief for a retail banking customer inside their app.
Output MUST be strictly valid JSON matching this schema:
{
  "greeting": "A short warm greeting",
  "spending_analysis": "2-3 sentences analyzing their spending, referencing the numbers and categories",
  "anomaly_warning": "1 sentence warning about any anomalies, OR an empty string if none were found"
}
Do not use markdown formatting or code blocks. Do NOT use double quotes inside the text values (use single quotes instead).`;

  const userPrompt = `Context:\n${JSON.stringify(context, null, 2)}`;
  
  try {
    const textResponse = await callGeminiAPI(systemPrompt, userPrompt, "application/json");
    let parsed;
    try {
      let cleanText = textResponse.replace(/^```json\n?/i, '').replace(/```$/i, '').trim();
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) cleanText = match[0];
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("JSON Parse Error. Raw response was:", textResponse);
      throw parseErr;
    }
    
    // Relaxed validation with fallbacks
    if (!parsed.greeting) parsed.greeting = "Hello! Here is your monthly update.";
    if (!parsed.spending_analysis) parsed.spending_analysis = "Here is your spending analysis.";
    if (typeof parsed.anomaly_warning !== 'string') parsed.anomaly_warning = "";
    
    return parsed;
  } catch (error) {
    console.error("Spend Brief Error:", error.message);
    throw new Error("Unable to generate a valid spend brief response.");
  }
}

// F3: FAQ Bot Answer (RAG)
async function generateFAQAnswer(question, context) {
  const systemPrompt = `You are a banking product FAQ assistant.

Answer the user's question using ONLY the supplied FAQ context.

Rules:
- Do not use general knowledge.
- Do not invent information.
- Do not infer unsupported banking policies.
- Do not change numbers, rates, limits, dates, or conditions.
- If the answer is not contained in the retrieved context, state that the information is unavailable.
- Keep the answer concise.
- Do not expose internal reasoning.
- Return only valid JSON matching this schema:
{
  "answer": "string",
  "sources": [
    {
      "title": "string"
    }
  ]
}

RETRIEVED FAQ CONTEXT:
${context}`;
  
  try {
    const textResponse = await callGeminiAPI(systemPrompt, question, "application/json");
    
    let parsed;
    try {
      let cleanText = textResponse.replace(/^```json\n?/i, '').replace(/```$/i, '').trim();
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) cleanText = match[0];
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("JSON Parse Error. Raw response was:", textResponse);
      throw new Error("Unable to generate a valid FAQ response.");
    }
    
    // Validate output
    if (!parsed || typeof parsed.answer !== 'string' || !Array.isArray(parsed.sources)) {
      throw new Error("Unable to generate a valid FAQ response.");
    }
    
    for (const src of parsed.sources) {
      if (typeof src.title !== 'string') {
        throw new Error("Unable to generate a valid FAQ response.");
      }
    }
    
    return parsed;
  } catch (error) {
    if (error.message === "Unable to generate a valid FAQ response.") {
      throw error;
    }
    console.error("FAQ Bot Error:", error.message);
    throw new Error("Unable to generate a valid FAQ response.");
  }
}

// F4: RM Morning Brief
async function generateMorningBrief(customers) {
  const lines = customers.map(c => `${c.account_title}: ${c.issues.join("; ")} (priority ${c.priority}, outstanding ₹${c.loanAmount})`).join("\n");
  const systemPrompt = "You are an AI assistant writing a short morning briefing for a bank Relationship Manager, to be read in under 15 seconds. 2-4 sentences, direct, prioritized, no markdown, no headers.";
  const userPrompt = `Here are today's top-priority customers and why they need attention:\n${lines}\n\nWrite the morning brief.`;

  try {
    return await callGeminiAPI(systemPrompt, userPrompt, "text/plain");
  } catch (error) {
    console.error("Morning Brief Error:", error.message);
    return "AI morning brief is currently unavailable.";
  }
}

module.exports = { 
  generateCallScript,
  generateSpendBrief,
  generateFAQAnswer,
  generateMorningBrief
};
