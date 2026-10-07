const CUDAQ_IMPORT_PATTERN = /^\s*(?:import\s+cudaq|from\s+cudaq\s+import)/m;

export function detectCudaQInText(text: string): boolean {
  return CUDAQ_IMPORT_PATTERN.test(text);
}

export function detectCudaQInDocument(text: string): boolean {
  return detectCudaQInText(text);
}
