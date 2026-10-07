import { getPlatformName } from '../utils/platform';
import { getPythonExecutable, runPythonScript } from '../utils/python';
import { CudaQEnvironmentInfo, formatEnvironmentInfo } from './environmentInfo';

export type { CudaQEnvironmentInfo };
export { formatEnvironmentInfo };

const ENV_SCRIPT = `
import sys
try:
    import cudaq
    print("CUDA-Q:installed")
    print(f"CUDA-Q-version:{getattr(cudaq, '__version__', 'unknown')}")
except ImportError:
    print("CUDA-Q:not_installed")
except Exception as e:
    print(f"CUDA-Q:error:{e}")
print(f"Python-version:{sys.version.split()[0]}")
`;

const GPU_SCRIPT = `
try:
    import subprocess
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
        capture_output=True, text=True, timeout=5
    )
    if result.returncode == 0 and result.stdout.strip():
        print(f"GPU:available:{result.stdout.strip().split(chr(10))[0]}")
    else:
        print("GPU:unavailable")
except Exception:
    print("GPU:unknown")
`;

export async function detectEnvironment(selectedTarget: string): Promise<CudaQEnvironmentInfo> {
  const pythonPath = (await getPythonExecutable()) ?? 'python3';
  const platform = getPlatformName();

  const info: CudaQEnvironmentInfo = {
    python: pythonPath,
    pythonVersion: 'Unknown',
    cudaqInstalled: false,
    cudaqVersion: 'Unknown',
    selectedTarget: selectedTarget || 'Unknown',
    platform,
    gpu: 'Unknown',
  };

  try {
    const result = await runPythonScript(pythonPath, ENV_SCRIPT);
    if (result.exitCode !== 0 && result.stderr.includes('ENOENT')) {
      info.pythonVersion = 'Not found';
      return info;
    }

    for (const line of result.stdout.split('\n')) {
      if (line.startsWith('Python-version:')) {
        info.pythonVersion = line.replace('Python-version:', '').trim();
      } else if (line === 'CUDA-Q:installed') {
        info.cudaqInstalled = true;
      } else if (line.startsWith('CUDA-Q-version:')) {
        info.cudaqVersion = line.replace('CUDA-Q-version:', '').trim();
      } else if (line.startsWith('CUDA-Q:not_installed')) {
        info.cudaqInstalled = false;
        info.cudaqVersion = 'Not installed';
      }
    }
  } catch {
    info.pythonVersion = 'Unknown';
  }

  try {
    const gpuResult = await runPythonScript(pythonPath, GPU_SCRIPT);
    for (const line of gpuResult.stdout.split('\n')) {
      if (line.startsWith('GPU:available:')) {
        info.gpu = `Available (${line.replace('GPU:available:', '').trim()})`;
      } else if (line === 'GPU:unavailable') {
        info.gpu = 'Unavailable';
      } else if (line === 'GPU:unknown') {
        info.gpu = 'Unknown';
      }
    }
  } catch {
    info.gpu = 'Unknown';
  }

  return info;
}
