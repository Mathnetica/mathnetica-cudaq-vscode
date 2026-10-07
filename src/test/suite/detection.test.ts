import * as assert from 'assert';
import { detectCudaQInText } from '../../cudaq/detection';

suite('CUDA-Q Detection', () => {
  test('detects import cudaq', () => {
    const text = 'import cudaq\n\n@cudaq.kernel\ndef bell(): pass';
    assert.strictEqual(detectCudaQInText(text), true);
  });

  test('detects from cudaq import', () => {
    const text = 'from cudaq import kernel\n\n@kernel\ndef test(): pass';
    assert.strictEqual(detectCudaQInText(text), true);
  });

  test('does not detect regular Python', () => {
    const text = 'import numpy as np\n\ndef hello():\n    print("hello")';
    assert.strictEqual(detectCudaQInText(text), false);
  });

  test('does not detect cudaq in comments only', () => {
    const text = '# import cudaq\nimport os';
    assert.strictEqual(detectCudaQInText(text), false);
  });
});
