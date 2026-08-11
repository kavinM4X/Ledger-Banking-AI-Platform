require('dotenv').config({ path: './.env' });
const { generateMorningBrief } = require('./services/llmService');

async function test() {
  const top5 = [
    { account_title: "John Doe", issues: ["Overdue 90 days"], priority: "HIGH" }
  ];
  console.log("Testing morning brief...");
  try {
    const brief = await generateMorningBrief(top5);
    console.log("Result:", brief);
  } catch (err) {
    console.log(err.response ? err.response.data : err);
  }
}
test();
