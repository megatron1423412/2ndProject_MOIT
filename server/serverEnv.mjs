import { loadEnv } from "vite";

/** Loads server-only variables from the project root; never pass this object to client code. */
export const loadServerEnv = (mode = process.env.NODE_ENV === "production" ? "production" : "development") =>
  loadEnv(mode, process.cwd(), "");

export const getNaverCredentials = (env = loadServerEnv()) => ({
  clientId: env.NAVER_CLIENT_ID?.trim(),
  clientSecret: env.NAVER_CLIENT_SECRET?.trim(),
});
