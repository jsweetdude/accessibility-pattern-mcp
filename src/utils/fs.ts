import fs from "node:fs/promises";
import path from "node:path";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

export function toPosixPath(p: string): string {
  // Normalizes Windows backslashes to forward slashes for consistent output.
  return p.split(path.sep).join("/");
}
