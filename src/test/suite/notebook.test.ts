import * as assert from 'assert';
import { detectCudaQInNotebookCells, notebookHasCudaQ } from '../../notebook/detection';

suite('Notebook Detection', () => {
  test('detects CUDA-Q in notebook cells', () => {
    const cells = [
      { kind: 1, value: '# My notebook' },
      { kind: 2, value: 'import cudaq\n\n@cudaq.kernel\ndef bell(): pass' },
      { kind: 2, value: 'print("hello")' },
    ];

    const result = detectCudaQInNotebookCells(cells);
    assert.strictEqual(result[1].hasCudaQ, true);
    assert.strictEqual(result[2].hasCudaQ, false);
  });

  test('notebookHasCudaQ returns true when any cell has CUDA-Q', () => {
    const cells = [
      { kind: 2, value: 'import os' },
      { kind: 2, value: 'import cudaq' },
    ];

    assert.strictEqual(notebookHasCudaQ(cells), true);
  });

  test('notebookHasCudaQ returns false for non-CUDA-Q notebook', () => {
    const cells = [
      { kind: 2, value: 'import numpy' },
      { kind: 2, value: 'print(1 + 1)' },
    ];

    assert.strictEqual(notebookHasCudaQ(cells), false);
  });
});
