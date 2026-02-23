type JsonResultOptions = {
  isError?: boolean;
};

export function jsonResult<T extends Record<string, unknown>>(
  payload: T,
  options?: JsonResultOptions
) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    ...(options?.isError !== undefined ? { isError: options.isError } : {}),
  };
}
