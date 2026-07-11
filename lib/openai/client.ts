import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new OpenAI({ apiKey });
  return client;
}

export const CHAT_MODEL = "gpt-5.4-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
