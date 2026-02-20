"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExists = fileExists;
exports.readTextFile = readTextFile;
exports.toPosixPath = toPosixPath;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
async function fileExists(filePath) {
    try {
        await promises_1.default.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function readTextFile(filePath) {
    return promises_1.default.readFile(filePath, "utf8");
}
function toPosixPath(p) {
    // Normalizes Windows backslashes to forward slashes for consistent output.
    return p.split(node_path_1.default.sep).join("/");
}
