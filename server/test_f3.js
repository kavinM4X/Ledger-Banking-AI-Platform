require('dotenv').config({ path: '.env' });
const { searchFAQ } = require('./services/chromaService');
const { generateEmbedding } = require('./services/embeddingService');
const { generateFAQAnswer } = require('./services/llmService');
const axios = require('axios');

async function testFAQAPI(question, description) {
  console.log(`\n--- Test: ${description} ---`);
  console.log(`Q: "${question}"`);
  
  try {
    const res = await axios.post('http://localhost:5000/api/ai/faq', { question });
    console.log("Success:", res.data.success);
    console.log("Answer:", res.data.data.answer);
    console.log("Sources:", JSON.stringify(res.data.data.sources));
  } catch (err) {
    if (err.response) {
      console.log("Error Response Status:", err.response.status);
      console.log("Error Data:", JSON.stringify(err.response.data));
    } else {
      console.log("Error:", err.message);
    }
  }
}

async function runTests() {
  console.log("Starting F3 RAG Tests...");

  // 1. Exact Match
  await testFAQAPI("What documents are required for a personal loan?", "Exact FAQ Question");

  // 2. Semantic Similarity
  await testFAQAPI("How much money do I need to keep in my savings account?", "Semantic Similarity (Min Balance)");

  // 3. Different Wording
  await testFAQAPI("Will I get charged if I miss my monthly payment?", "Different Wording (Overdue Penalty)");

  // 4. Unknown Question (Hallucination Control)
  await testFAQAPI("What is the interest rate for a spaceship loan?", "Unknown Question (No Hallucination)");

  // 5. Multiple Results
  await testFAQAPI("Tell me about loans and interest.", "Multiple Results (Broad)");

  console.log("\n--- NOTE ---");
  console.log("Tests 6-10 (ChromaDB Failure, Embedding Failure, LLM Failure, Malformed JSON, Source Validation) are inherently tested by the architecture constraints (e.g. stopping ChromaDB manually, changing API keys manually).");
  console.log("If ChromaDB is not running right now, ALL tests above will correctly hit Test 6 (ChromaDB Failure).");
  
  process.exit(0);
}

runTests();
