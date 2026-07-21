import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { OpenAIEmbeddings } from "@langchain/openai";
import { chunkRagDocuments, discoverCuratedDocuments, RAG_ROOT, REQUIRED_RAG_CATEGORIES, type RagCategory, type RagChunkMetadata } from "./ragDocuments";

export const RAG_INDEX_SCHEMA_VERSION = 1;
export const RAG_INDEX_PATH = path.resolve(process.cwd(), ".cache", "rag", "index.json");
export const RAG_MANIFEST_PATH = path.join(RAG_ROOT, "CURATION_MANIFEST.json");
export const RAG_EMBEDDING_MODEL = () => process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

export type PersistedRagChunk = { text: string; embedding: number[]; metadata: RagChunkMetadata };
export type PersistedRagIndex = {
  schemaVersion: number;
  generatedAt: string;
  embeddingModel: string;
  dimensions: number;
  documents: Array<{ category: RagCategory; relativePath: string; documentHash: string }>;
  chunks: PersistedRagChunk[];
};
export type EmbeddingsLike = { embedDocuments: (texts: string[]) => Promise<number[][]>; embedQuery: (text: string) => Promise<number[]> };

export class RagIndexError extends Error {
  constructor(readonly code: "RAG_INDEX_MISSING" | "RAG_INDEX_INVALID") { super(code); }
}

const readExisting = async (indexPath: string): Promise<PersistedRagIndex | null> => {
  try { return JSON.parse(await readFile(indexPath, "utf8")) as PersistedRagIndex; }
  catch (error) { return (error as NodeJS.ErrnoException).code === "ENOENT" ? null : null; }
};

const atomicJsonWrite = async (filePath: string, value: unknown) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
};

export const loadPersistedRagIndex = async (indexPath = RAG_INDEX_PATH, expectedModel = RAG_EMBEDDING_MODEL()): Promise<PersistedRagIndex> => {
  const index = await readExisting(indexPath);
  if (!index) throw new RagIndexError("RAG_INDEX_MISSING");
  if (index.schemaVersion !== RAG_INDEX_SCHEMA_VERSION || index.embeddingModel !== expectedModel || !index.dimensions || !Array.isArray(index.chunks)) throw new RagIndexError("RAG_INDEX_INVALID");
  if (index.chunks.some((chunk) => chunk.embedding.length !== index.dimensions)) throw new RagIndexError("RAG_INDEX_INVALID");
  return index;
};

export const buildPersistentRagIndex = async ({
  apiKey,
  embeddings,
  ragRoot = RAG_ROOT,
  indexPath = RAG_INDEX_PATH,
  manifestPath = RAG_MANIFEST_PATH,
  modelId = RAG_EMBEDDING_MODEL(),
}: { apiKey?: string; embeddings?: EmbeddingsLike; ragRoot?: string; indexPath?: string; manifestPath?: string; modelId?: string }) => {
  const { documents, folders } = await discoverCuratedDocuments(ragRoot);
  const chunks = await chunkRagDocuments(documents);
  const existing = await readExisting(indexPath);
  const reusable = new Map<string, PersistedRagChunk>();
  if (existing?.schemaVersion === RAG_INDEX_SCHEMA_VERSION && existing.embeddingModel === modelId) {
    for (const chunk of existing.chunks) reusable.set(chunk.metadata.contentHash, chunk);
  }
  const missing = chunks.filter((chunk) => !reusable.has(chunk.metadata.contentHash));
  const client = embeddings ?? (apiKey?.trim() ? new OpenAIEmbeddings({ apiKey: apiKey.trim(), model: modelId, batchSize: 64, maxRetries: 1 }) : null);
  if (missing.length && !client) throw new Error("OPENAI_API_KEY is required to embed new RAG chunks");
  const newVectors = missing.length ? await client!.embedDocuments(missing.map((chunk) => chunk.embeddingText)) : [];
  const newByHash = new Map(missing.map((chunk, index) => [chunk.metadata.contentHash, newVectors[index]]));
  const persistedChunks: PersistedRagChunk[] = chunks.map((chunk) => ({
    text: chunk.text,
    metadata: chunk.metadata,
    embedding: reusable.get(chunk.metadata.contentHash)?.embedding ?? newByHash.get(chunk.metadata.contentHash)!,
  }));
  const dimensions = persistedChunks[0]?.embedding.length ?? existing?.dimensions ?? 0;
  if (!dimensions || persistedChunks.some((chunk) => !Array.isArray(chunk.embedding) || chunk.embedding.length !== dimensions)) throw new Error("Embedding dimensions are inconsistent");
  const index: PersistedRagIndex = {
    schemaVersion: RAG_INDEX_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    embeddingModel: modelId,
    dimensions,
    documents: documents.map(({ category, relativePath, documentHash }) => ({ category, relativePath, documentHash })),
    chunks: persistedChunks,
  };
  const nextHashes = new Set(persistedChunks.map((chunk) => chunk.metadata.contentHash));
  const removed = existing?.chunks.filter((chunk) => !nextHashes.has(chunk.metadata.contentHash)).length ?? 0;
  await atomicJsonWrite(indexPath, index);
  const categories = Object.fromEntries(REQUIRED_RAG_CATEGORIES.map((category) => [category, documents.filter((document) => document.category === category).map((document) => path.posix.basename(document.relativePath)).sort()]));
  await atomicJsonWrite(manifestPath, { schema_version: 1, generated_at: index.generatedAt, source: "filesystem", categories, folders, document_count: documents.length, chunk_count: chunks.length });
  return {
    index,
    summary: REQUIRED_RAG_CATEGORIES.map((category) => ({
      category,
      documents: documents.filter((document) => document.category === category).length,
      chunks: persistedChunks.filter((chunk) => chunk.metadata.category === category).length,
      reused: persistedChunks.filter((chunk) => chunk.metadata.category === category && reusable.has(chunk.metadata.contentHash)).length,
      embedded: persistedChunks.filter((chunk) => chunk.metadata.category === category && newByHash.has(chunk.metadata.contentHash)).length,
      removed: existing?.chunks.filter((chunk) => chunk.metadata.category === category && !nextHashes.has(chunk.metadata.contentHash)).length ?? 0,
    })),
    removed,
  };
};
