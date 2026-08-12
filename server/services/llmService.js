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
    
    // Strict validation
    if (!parsed.priority || !['HIGH', 'MEDIUM', 'LOW'].includes(parsed.priority)) throw new Error("Invalid priority");
    if (typeof parsed.reason !== 'string') throw new Error("Invalid reason");
    if (typeof parsed.recommended_action !== 'string') throw new Error("Invalid recommended_action");
    
    // Nested call_script validation
    if (!parsed.call_script || typeof parsed.call_script !== 'object') throw new Error("Invalid call_script object");
    if (typeof parsed.call_script.greeting !== 'string') throw new Error("Invalid greeting");
    if (typeof parsed.call_script.reason_for_call !== 'string') throw new Error("Invalid reason_for_call");
    if (typeof parsed.call_script.current_status !== 'string') throw new Error("Invalid current_status");
    if (typeof parsed.call_script.request !== 'string') throw new Error("Invalid request");
    if (typeof parsed.call_script.next_step !== 'string') throw new Error("Invalid next_step");
    
    return parsed;
  } catch (error) {
    console.error("LLM Generation Error:", error?.response?.data || error.message);
    throw new Error("Unable to generate a valid collection response.");
  }
}

// F2: Monthly Spend Brief
async function generateSpendBrief(context) {
  const systemPrompt = `SYSTEM ROLE
You are an analytical banking assistant writing a monthly spending brief for a retail banking customer.

DATA CONTEXT
You will be provided with backend-generated analytics including total spending, transaction count, average transaction, category breakdown, highest spending category, and anomalies. Do NOT calculate the analytics yourself. The backend is the source of truth.

TASK
Write a SHORT, SIMPLE, PROFESSIONAL, and EASY TO SCAN monthly spend brief. The complete brief should be approximately 100-160 words. Do not create long paragraphs. Use clear sections and concise bullet points.

CONTENT REQUIREMENTS & OUTPUT FORMAT
Output MUST be strictly valid JSON matching this schema:
{
  "greeting": "string",
  "spending_analysis": "string",
  "anomaly_warning": "string"
}

The fields MUST be populated EXACTLY as follows (including emojis and formatting):

1. "greeting" MUST contain:
📊 Summary
• Total spending: [amount]
• Transaction count: [count]
• Average transaction: [amount]
• Highest spending category: [category]

2. "spending_analysis" MUST contain:
💡 Key Insights
• [Insight 1]
• [Insight 2]
• [Insight 3 (optional)]

✅ Recommendations
• [Action 1]
• [Action 2]
• [Action 3 (optional)]

3. "anomaly_warning" MUST contain:
[One concise statement explaining detected anomalies. If none exist, output exactly: "No significant spending anomalies were detected."]

GROUNDING RULES
Use ONLY the supplied analytics context. Do not invent names, amounts, dates, policies, or financial information. Do not repeat statistics unnecessarily. Do not use markdown formatting like \`\`\`json.`;

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



// F4: RM Morning Brief
async function generateMorningBrief(customers) {
  const lines = customers.map(c => 
    `Name: ${c.account_title}\nPriority: ${c.priority}\nOverdue Days: ${c.overdueDays}\nOutstanding Amount: ₹${c.loanAmount}\nIssues: ${c.issues.join("; ")}\nAnomaly: ${c.suspicious ? 'Yes' : 'No'}`
  ).join("\n\n");

  const systemPrompt = `SYSTEM ROLE
You are a professional Relationship Manager briefing assistant.

DATA CONTEXT
You will be provided with today's top priority unique customers and why they need attention.

TASK
Write a SHORT, SIMPLE, and EASY TO READ morning brief for the RM. The total length MUST be approximately 150-250 words. Do NOT generate large paragraphs. Use short sentences, bullet points, numbered customers, and clear section headings.

CONTENT REQUIREMENTS & OUTPUT FORMAT
You MUST use exactly this structure and formatting:

AI Morning Brief

Good morning. [X] customers require immediate attention today.

📌 Priority Summary
• High Priority: [count]
• Medium Priority: [count]
• Overdue: [count]
• Anomalies: [count]

🔥 Top Priorities

[For each customer, format exactly like this:]
1. [Name]
• Outstanding: ₹[amount]
• Overdue: [days] days
• Priority: [HIGH/MEDIUM/LOW]
• Action: [One short recommended action sentence]

📋 Today's Focus
• [1st bullet point about the highest priority]
• [2nd bullet point about next priority]
• [3rd bullet point on general operational advice]

GROUNDING RULES
Use ONLY the supplied context. The LLM MUST NOT select additional customers, reorder customers, or change risk scores, levels, amounts, overdue days, or anomaly results. Never invent names, numbers, dates, balances, or policies. Do not repeat the same customer.`;
  const userPrompt = `TOP 5 CUSTOMERS:\n\n${lines}`;

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

  generateMorningBrief
};
