// src/tools/getGlobalRules.ts
import { readTextFile } from "../utils/fs";
import { getRepoPaths } from "../repo/paths";
import { PatternIndex } from "../repo/index";
import { GetGlobalRulesResponse, StackRef } from "../contracts/v1/types";

export type GetGlobalRulesArgs = {
  stack: StackRef;
};

export async function getGlobalRules(
  index: PatternIndex,
  patternRepoPath: string,
  args: GetGlobalRulesArgs
): Promise<GetGlobalRulesResponse> {
  const { stack } = args;

  if (stack !== index.stack) {
    throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
  }

  const { baselinePath } = getRepoPaths(patternRepoPath, stack);
  const raw_markdown = await readTextFile(baselinePath);

  return {
    contract_version: "1.0",
    stack,
    ...index.cache,
    rules: { raw_markdown },
  };
}