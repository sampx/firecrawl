import { createOpenAI } from "@ai-sdk/openai";
import { config } from "../config";
import { createOllama } from "ollama-ai-provider";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { fireworks } from "@ai-sdk/fireworks";
import { deepinfra } from "@ai-sdk/deepinfra";
import { createVertex } from "@ai-sdk/google-vertex";

type Provider =
  | "openai"
  | "ollama"
  | "anthropic"
  | "groq"
  | "google"
  | "openrouter"
  | "fireworks"
  | "deepinfra"
  | "vertex";
const defaultProvider: Provider = config.OLLAMA_BASE_URL ? "ollama" : "openai";

const providerList: Record<Provider, any> = {
  openai: createOpenAI({
    apiKey: config.OPENAI_API_KEY,
    baseURL: config.OPENAI_BASE_URL,
  }),
  ollama: createOllama({
    baseURL: config.OLLAMA_BASE_URL,
  }),
  anthropic,
  groq,
  google,
  openrouter: createOpenRouter({
    apiKey: config.OPENROUTER_API_KEY,
  }),
  fireworks,
  deepinfra,
  vertex: createVertex({
    project: "firecrawl",
    baseURL:
      "https://aiplatform.googleapis.com/v1/projects/firecrawl/locations/global/publishers/google",
    location: "global",
    googleAuthOptions: config.VERTEX_CREDENTIALS
      ? {
          credentials: JSON.parse(atob(config.VERTEX_CREDENTIALS)),
        }
      : {
          keyFile: "./gke-key.json",
        },
  }),
};

export function getModel(name: string, provider: Provider = defaultProvider) {
  if (name === "gemini-2.5-pro") {
    name = "gemini-2.5-pro";
  }
  const modelName = config.MODEL_NAME || name;

  if (provider === "openai") {
    return providerList.openai.chat(modelName);
  }
  return providerList[provider](modelName);
}

export function getEmbeddingModel(
  name: string,
  provider: Provider = defaultProvider,
) {
  return config.MODEL_EMBEDDING_NAME
    ? providerList[provider].embedding(config.MODEL_EMBEDDING_NAME)
    : providerList[provider].embedding(name);
}
