import { loadEnv } from "vite";

/** Loads server-only variables from the project root; never pass this object to client code. */
export const loadServerEnv = (mode = process.env.NODE_ENV === "production" ? "production" : "development") => {
  const env = loadEnv(mode, process.cwd(), "");
  if (!process.env.OPENAI_MODEL && env.OPENAI_MODEL?.trim()) process.env.OPENAI_MODEL = env.OPENAI_MODEL.trim();
  if (!process.env.OPENAI_EMBEDDING_MODEL && env.OPENAI_EMBEDDING_MODEL?.trim()) process.env.OPENAI_EMBEDDING_MODEL = env.OPENAI_EMBEDDING_MODEL.trim();
  return env;
};

export const getNaverCredentials = (env = loadServerEnv()) => ({
  clientId: env.NAVER_CLIENT_ID?.trim(),
  clientSecret: env.NAVER_CLIENT_SECRET?.trim(),
});
