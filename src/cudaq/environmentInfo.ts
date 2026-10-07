export interface CudaQEnvironmentInfo {
  python: string;
  pythonVersion: string;
  cudaqInstalled: boolean;
  cudaqVersion: string;
  selectedTarget: string;
  platform: string;
  gpu: string;
}

export function formatEnvironmentInfo(info: CudaQEnvironmentInfo): string {
  return [
    'CUDA-Q Environment',
    '==================',
    '',
    `Python: ${info.python}`,
    `Python version: ${info.pythonVersion}`,
    '',
    `CUDA-Q: ${info.cudaqInstalled ? 'installed' : 'not installed'}`,
    `CUDA-Q version: ${info.cudaqVersion}`,
    '',
    `Selected target: ${info.selectedTarget}`,
    '',
    `Platform: ${info.platform}`,
    `GPU: ${info.gpu}`,
  ].join('\n');
}
