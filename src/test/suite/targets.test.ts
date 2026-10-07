import * as assert from 'assert';
import { normalizeTargetName } from '../../cudaq/targetName';

suite('Target Name Normalization', () => {
  test('strips Target prefix', () => {
    assert.strictEqual(normalizeTargetName('Target qpp-cpu'), 'qpp-cpu');
  });

  test('keeps plain target name', () => {
    assert.strictEqual(normalizeTargetName('qpp-cpu'), 'qpp-cpu');
  });

  test('handles multi-line dump', () => {
    assert.strictEqual(
      normalizeTargetName('Target qpp-cpu\n\tsimulator=qpp'),
      'qpp-cpu',
    );
  });

  test('handles empty', () => {
    assert.strictEqual(normalizeTargetName(''), '');
  });
});
