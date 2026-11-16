import { readFile } from "node:fs/promises";

const readPrompt = (name) =>
  readFile(new URL(`../ai/${name}-prompt.md`, import.meta.url), "utf8");

export const [systemPrompt, reviewPrompt, chatPrompt] = await Promise.all([
  readPrompt("system"),
  readPrompt("review"),
  readPrompt("chat"),
]);
