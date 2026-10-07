import * as assert from 'assert';
import { findKernels, findKernelAtLine } from '../../cudaq/kernels';

suite('Kernel Detection', () => {
  test('finds @cudaq.kernel function', () => {
    const text = `@cudaq.kernel
def bell():
    qubits = cudaq.qvector(2)
    h(qubits[0])`;

    const kernels = findKernels(text);
    assert.strictEqual(kernels.length, 1);
    assert.strictEqual(kernels[0].name, 'bell');
  });

  test('finds multiple kernels', () => {
    const text = `@cudaq.kernel
def bell():
    pass

@cudaq.kernel
def ghz():
    pass`;

    const kernels = findKernels(text);
    assert.strictEqual(kernels.length, 2);
    assert.strictEqual(kernels[0].name, 'bell');
    assert.strictEqual(kernels[1].name, 'ghz');
  });

  test('findKernelAtLine returns correct kernel', () => {
    const text = `@cudaq.kernel
def bell():
    qubits = cudaq.qvector(2)

@cudaq.kernel
def ghz():
    qubits = cudaq.qvector(3)`;

    const kernel = findKernelAtLine(text, 2);
    assert.ok(kernel);
    assert.strictEqual(kernel.name, 'bell');
  });

  test('returns empty for no kernels', () => {
    const text = 'import cudaq\n\ndef hello(): pass';
    const kernels = findKernels(text);
    assert.strictEqual(kernels.length, 0);
  });
});
