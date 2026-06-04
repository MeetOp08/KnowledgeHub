// test_ai_init.mjs
import 'dotenv/config';
import OpenAI from 'openai';
import { Groq } from 'groq-sdk';

(async () => {
  console.log('OPENAI key present:', !!process.env.OPENAI_API_KEY);
  console.log('GROQ key present :', !!process.env.GROQ_API_KEY);

  try {
    const o = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('OpenAI client created OK');
  } catch (e) {
    console.error('OpenAI client error:', e);
  }

  try {
    const g = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('Groq client created OK');
  } catch (e) {
    console.error('Groq client error:', e);
  }
})();
