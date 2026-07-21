import { OpenAIEmbeddings } from "@langchain/openai";
import { APP_TO_RAG_CATEGORY, type RagCategory } from "./ragDocuments";
import { loadPersistedRagIndex, RAG_EMBEDDING_MODEL, type EmbeddingsLike, type PersistedRagChunk, type PersistedRagIndex } from "./ragIndex";
import type { ProductCategoryId } from "../../src/app/features/product-catalog/core/types";

export const RAG_MAX_RESULTS = 5;
export const RAG_RELEVANCE_THRESHOLD = 0.28;
let runtimeIndexPromise: Promise<PersistedRagIndex> | undefined;

export type RetrievedRagChunk = { text: string; metadata: PersistedRagChunk["metadata"] };

const cosine = (left: number[], right: number[]) => {
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) { dot += left[index] * right[index]; leftNorm += left[index] ** 2; rightNorm += right[index] ** 2; }
  return leftNorm && rightNorm ? dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) : 0;
};
const tokens = (value: string) => value.toLocaleLowerCase("ko-KR").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2);
const lexicalBoost = (query: string, chunk: PersistedRagChunk) => {
  const haystack = `${chunk.metadata.title} ${chunk.metadata.topic} ${chunk.metadata.headingPath}`.toLocaleLowerCase("ko-KR");
  const matched = new Set(tokens(query).filter((token) => haystack.includes(token))).size;
  return Math.min(0.08, matched * 0.025);
};

export const searchRagIndex = ({ index, category, query, queryEmbedding, limit = RAG_MAX_RESULTS, threshold = RAG_RELEVANCE_THRESHOLD }: { index: PersistedRagIndex; category: RagCategory; query: string; queryEmbedding: number[]; limit?: number; threshold?: number }): RetrievedRagChunk[] => {
  const seenSections = new Set<string>();
  return index.chunks
    .filter((chunk) => chunk.metadata.category === category)
    .map((chunk) => ({ chunk, relevance: cosine(queryEmbedding, chunk.embedding) + lexicalBoost(query, chunk) }))
    .filter(({ relevance }) => relevance >= threshold)
    .sort((a, b) => b.relevance - a.relevance || a.chunk.metadata.relativePath.localeCompare(b.chunk.metadata.relativePath) || a.chunk.metadata.chunkIndex - b.chunk.metadata.chunkIndex)
    .filter(({ chunk }) => {
      const key = `${chunk.metadata.relativePath}|${chunk.metadata.headingPath}`;
      if (seenSections.has(key)) return false;
      seenSections.add(key); return true;
    })
    .slice(0, Math.min(limit, RAG_MAX_RESULTS))
    .map(({ chunk }) => ({ text: chunk.text, metadata: chunk.metadata }));
};

export const retrieveRagChunks = async ({ apiKey, appCategory, question, embeddings, index }: { apiKey: string; appCategory: ProductCategoryId; question: string; embeddings?: EmbeddingsLike; index?: PersistedRagIndex }) => {
  const category = APP_TO_RAG_CATEGORY[appCategory];
  if (!category) return [];
  const loaded = index ?? await (runtimeIndexPromise ??= loadPersistedRagIndex());
  const client = embeddings ?? new OpenAIEmbeddings({ apiKey, model: RAG_EMBEDDING_MODEL(), maxRetries: 1 });
  const queryEmbedding = await client.embedQuery(`${category}\n${question}`);
  if (queryEmbedding.length !== loaded.dimensions) throw new Error("RAG query embedding dimensions do not match the persisted index");
  return searchRagIndex({ index: loaded, category, query: question, queryEmbedding });
};

export const resetRuntimeRagIndexForTests = () => { runtimeIndexPromise = undefined; };
