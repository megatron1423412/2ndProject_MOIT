import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import type { ProductCategoryId } from "../../src/app/features/product-catalog/core/types";

export type RagCategory = "air-conditioner" | "televisions" | "refrigerators" | "vacuum-cleaners";
export type TemporalStatus = "stable" | "mixed" | "dated";

export const APP_TO_RAG_CATEGORY: Readonly<Record<ProductCategoryId, RagCategory>> = {
  "air-conditioner": "air-conditioner",
  tv: "televisions",
  refrigerator: "refrigerators",
  vacuum: "vacuum-cleaners",
};

const FOLDER_CATEGORY_ENTRIES: ReadonlyArray<readonly [string, RagCategory]> = [
  ["air-conditioner", "air-conditioner"],
  ["televisions", "televisions"],
  ["refrigerators", "refrigerators"],
  ["vacuum-cleaners", "vacuum-cleaners"],
  ["vacuumcleaners", "vacuum-cleaners"],
];
const FOLDER_TO_CATEGORY = new Map(FOLDER_CATEGORY_ENTRIES);
export const REQUIRED_RAG_CATEGORIES: readonly RagCategory[] = ["air-conditioner", "televisions", "refrigerators", "vacuum-cleaners"];
export const RAG_ROOT = path.resolve(process.cwd(), "docs", "RAG");
export const CHUNK_SIZE = 1200;
export const CHUNK_OVERLAP = 160;

export type RagDocumentMetadata = {
  category: RagCategory;
  topic: string;
  title: string;
  sourceName: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
  curatedAt: string;
  temporalStatus: TemporalStatus;
  limitations: string[];
  relativePath: string;
};

export type RagDocument = RagDocumentMetadata & { body: string; documentHash: string };
export type RagChunkMetadata = RagDocumentMetadata & {
  headingPath: string;
  chunkIndex: number;
  contentHash: string;
  documentHash: string;
};
export type RagChunk = { text: string; embeddingText: string; metadata: RagChunkMetadata };

const requiredScalarFields = ["title", "category", "topic", "source_name", "source_title", "source_url", "source_type", "curated_at", "temporal_status"] as const;
const cleanScalar = (value: string) => value.trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, (_match, double, single) => double ?? single ?? "");
const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const posix = (value: string) => value.split(path.sep).join("/");

export class RagDocumentError extends Error {
  constructor(readonly relativePath: string, message: string) { super(`${relativePath}: ${message}`); }
}

export const parseCuratedMarkdown = (text: string, relativePath: string, expectedCategory: RagCategory): RagDocument => {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/);
  if (!match) throw new RagDocumentError(relativePath, "complete YAML frontmatter is required");
  const fields: Record<string, string> = {};
  const limitations: string[] = [];
  let listKey = "";
  for (const rawLine of match[1].split("\n")) {
    const listMatch = rawLine.match(/^\s+-\s+(.+)$/);
    if (listMatch && listKey === "limitations") { limitations.push(cleanScalar(listMatch[1])); continue; }
    const fieldMatch = rawLine.match(/^([a-z_]+):\s*(.*)$/);
    if (!fieldMatch) continue;
    listKey = fieldMatch[1];
    fields[listKey] = cleanScalar(fieldMatch[2]);
  }
  for (const field of requiredScalarFields) if (!fields[field]) throw new RagDocumentError(relativePath, `missing frontmatter field ${field}`);
  if (!limitations.length) throw new RagDocumentError(relativePath, "limitations must contain at least one item");
  if (fields.category !== expectedCategory) throw new RagDocumentError(relativePath, `category must be ${expectedCategory}`);
  if (!(["stable", "mixed", "dated"] as string[]).includes(fields.temporal_status)) throw new RagDocumentError(relativePath, "invalid temporal_status");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.curated_at)) throw new RagDocumentError(relativePath, "curated_at must be YYYY-MM-DD");
  const body = match[2].trim();
  if (!body || !/^#\s+\S/m.test(body)) throw new RagDocumentError(relativePath, "non-empty Markdown body with a heading is required");
  const metadata: RagDocumentMetadata = {
    category: expectedCategory,
    topic: fields.topic,
    title: fields.title,
    sourceName: fields.source_name,
    sourceTitle: fields.source_title,
    sourceUrl: fields.source_url,
    sourceType: fields.source_type,
    curatedAt: fields.curated_at,
    temporalStatus: fields.temporal_status as TemporalStatus,
    limitations,
    relativePath,
  };
  return { ...metadata, body, documentHash: sha256(JSON.stringify(metadata) + "\n" + body) };
};

export const discoverCuratedDocuments = async (ragRoot = RAG_ROOT): Promise<{ documents: RagDocument[]; folders: Record<RagCategory, string> }> => {
  const entries = await readdir(ragRoot, { withFileTypes: true });
  const folders = {} as Record<RagCategory, string>;
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const category = FOLDER_TO_CATEGORY.get(entry.name.toLowerCase());
    if (!category) continue;
    if (folders[category]) throw new Error(`Duplicate RAG category folder: ${category}`);
    folders[category] = entry.name;
  }
  for (const category of REQUIRED_RAG_CATEGORIES) if (!folders[category]) throw new Error(`Missing RAG category folder: ${category}`);
  const documents: RagDocument[] = [];
  for (const category of REQUIRED_RAG_CATEGORIES) {
    const curatedDir = path.join(ragRoot, folders[category], "curated");
    const files = (await readdir(curatedDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      .map((entry) => entry.name).sort((a, b) => a.localeCompare(b, "en"));
    if (!files.length) throw new Error(`No curated Markdown documents: ${category}`);
    for (const file of files) {
      const absolutePath = path.join(curatedDir, file);
      const relativePath = posix(path.relative(ragRoot, absolutePath));
      documents.push(parseCuratedMarkdown(await readFile(absolutePath, "utf8"), relativePath, category));
    }
  }
  return { documents, folders };
};

type HeadingSection = { headingPath: string; text: string };
const headingSections = (body: string): HeadingSection[] => {
  const lines = body.split("\n");
  const hierarchy: string[] = [];
  const sections: HeadingSection[] = [];
  let buffer: string[] = [];
  let currentPath = "";
  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) sections.push({ headingPath: currentPath || "문서 개요", text });
    buffer = [];
  };
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      flush();
      const level = match[1].length;
      hierarchy.length = level - 1;
      hierarchy[level - 1] = match[2].trim();
      currentPath = hierarchy.filter(Boolean).join(" > ");
    }
    buffer.push(line);
  }
  flush();
  return sections;
};

const splitSection = async (section: HeadingSection): Promise<HeadingSection[]> => {
  if (section.text.length <= CHUNK_SIZE) return [section];
  const splitter = new MarkdownTextSplitter({ chunkSize: CHUNK_SIZE, chunkOverlap: CHUNK_OVERLAP, keepSeparator: true });
  return (await splitter.splitText(section.text)).map((text) => ({ headingPath: section.headingPath, text: text.trim() })).filter((item) => item.text);
};

const groupShortSections = (sections: HeadingSection[]): HeadingSection[] => {
  const grouped: HeadingSection[] = [];
  for (const section of sections) {
    const previous = grouped.at(-1);
    if (previous && previous.text.length < 520 && previous.text.length + section.text.length + 2 <= CHUNK_SIZE) {
      previous.text += `\n\n${section.text}`;
      previous.headingPath = previous.headingPath === section.headingPath ? previous.headingPath : `${previous.headingPath} / ${section.headingPath}`;
    } else grouped.push({ ...section });
  }
  return grouped;
};

export const chunkRagDocuments = async (documents: RagDocument[]): Promise<RagChunk[]> => {
  const chunks: RagChunk[] = [];
  for (const document of documents) {
    const split: HeadingSection[] = [];
    for (const section of headingSections(document.body)) split.push(...await splitSection(section));
    const grouped = groupShortSections(split);
    grouped.forEach((section, chunkIndex) => {
      const embeddingText = `${document.title}\n${section.headingPath}\n${section.text}`;
      const hashInput = JSON.stringify({ category: document.category, topic: document.topic, title: document.title, temporalStatus: document.temporalStatus, limitations: document.limitations, embeddingText });
      chunks.push({
        text: section.text,
        embeddingText,
        metadata: { ...document, body: undefined, headingPath: section.headingPath, chunkIndex, contentHash: sha256(hashInput), documentHash: document.documentHash } as unknown as RagChunkMetadata,
      });
    });
  }
  return chunks;
};
