const OpenAI = require("openai");
require("dotenv").config();

const aiClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN
});

module.exports = aiClient;
