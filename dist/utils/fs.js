import fs from "node:fs/promises";
import path from "node:path";
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function readTextFile(filePath) {
    return fs.readFile(filePath, "utf8");
}
export function toPosixPath(p) {
    // Normalizes Windows backslashes to forward slashes for consistent output.
    return p.split(path.sep).join("/");
}
