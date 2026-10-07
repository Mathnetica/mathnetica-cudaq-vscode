import * as assert from 'assert';
import { formatEnvironmentInfo, CudaQEnvironmentInfo } from '../../cudaq/environmentInfo';

suite('Environment Detection', () => {
  test('formatEnvironmentInfo produces readable output', () => {
    const info: CudaQEnvironmentInfo = {
      python: '/usr/bin/python3',
      pythonVersion: '3.12.1',
      cudaqInstalled: true,
      cudaqVersion: '0.7.0',
      selectedTarget: 'qpp-cpu',
      platform: 'macOS',
      gpu: 'Unknown',
    };

    const formatted = formatEnvironmentInfo(info);
    assert.ok(formatted.includes('Python version: 3.12.1'));
    assert.ok(formatted.includes('CUDA-Q: installed'));
    assert.ok(formatted.includes('Selected target: qpp-cpu'));
    assert.ok(formatted.includes('Platform: macOS'));
  });

  test('formatEnvironmentInfo handles missing CUDA-Q', () => {
    const info: CudaQEnvironmentInfo = {
      python: 'python3',
      pythonVersion: 'Not found',
      cudaqInstalled: false,
      cudaqVersion: 'Not installed',
      selectedTarget: 'Unknown',
      platform: 'Linux',
      gpu: 'Unknown',
    };

    const formatted = formatEnvironmentInfo(info);
    assert.ok(formatted.includes('CUDA-Q: not installed'));
    assert.ok(formatted.includes('Python version: Not found'));
  });
});
