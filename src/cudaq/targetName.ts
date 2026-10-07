/** Normalize values like "Target qpp-cpu" to "qpp-cpu". */
export function normalizeTargetName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const match = /^Target\s+(\S+)/i.exec(trimmed);
  if (match) {
    return match[1];
  }
  // First token only — ignore multi-line dumps
  return trimmed.split(/\s+/)[0];
}
