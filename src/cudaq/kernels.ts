export interface KernelInfo {
  name: string;
  line: number;
  character: number;
}

const KERNEL_PATTERN = /@cudaq\.kernel\s*\n\s*def\s+(\w+)\s*\(/g;

export function findKernels(text: string): KernelInfo[] {
  const kernels: KernelInfo[] = [];
  let match: RegExpExecArray | null;

  while ((match = KERNEL_PATTERN.exec(text)) !== null) {
    const defIndex = match.index + match[0].indexOf('def ');
    const beforeDef = text.substring(0, defIndex);
    const line = beforeDef.split('\n').length - 1;
    const lastNewline = beforeDef.lastIndexOf('\n');
    const character = defIndex - lastNewline - 1;

    kernels.push({
      name: match[1],
      line,
      character,
    });
  }

  return kernels;
}

export function findKernelAtLine(text: string, line: number): KernelInfo | undefined {
  const kernels = findKernels(text);
  for (const kernel of kernels) {
    const kernelEndLine = findKernelEndLine(text, kernel.line);
    if (line >= kernel.line && line <= kernelEndLine) {
      return kernel;
    }
  }
  return undefined;
}

function findKernelEndLine(text: string, startLine: number): number {
  const lines = text.split('\n');
  const startLineContent = lines[startLine] ?? '';
  const baseIndent = getIndent(startLineContent);

  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      continue;
    }
    const indent = getIndent(line);
    if (indent <= baseIndent && line.trim() !== '') {
      return i - 1;
    }
  }

  return lines.length - 1;
}

function getIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}
