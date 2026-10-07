import { detectCudaQInText } from '../cudaq/detection';

export interface NotebookCellInfo {
  index: number;
  hasCudaQ: boolean;
}

export function detectCudaQInNotebookCells(
  cells: Array<{ kind: number; value: string }>,
): NotebookCellInfo[] {
  return cells.map((cell, index) => ({
    index,
    hasCudaQ: cell.kind === 2 && detectCudaQInText(cell.value),
  }));
}

export function notebookHasCudaQ(
  cells: Array<{ kind: number; value: string }>,
): boolean {
  return detectCudaQInNotebookCells(cells).some((c) => c.hasCudaQ);
}

// Notebook cell kind: 1 = markup, 2 = code (vscode.NotebookCellKind.Code = 2)
export const NOTEBOOK_CELL_KIND_CODE = 2;
