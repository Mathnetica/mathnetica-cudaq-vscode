import * as vscode from 'vscode';

export async function getPythonExecutable(): Promise<string | undefined> {
  try {
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (pythonExtension) {
      if (!pythonExtension.isActive) {
        await pythonExtension.activate();
      }
      const api = pythonExtension.exports as {
        environments?: {
          getActiveEnvironmentPath?: (uri?: vscode.Uri) => Promise<{ path?: string }>;
        };
      };
      const envPath = await api.environments?.getActiveEnvironmentPath?.(
        vscode.window.activeTextEditor?.document.uri,
      );
      if (envPath?.path) {
        return envPath.path;
      }
    }
  } catch {
    // Fall through to default
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

export interface PythonRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runPythonScript(
  pythonPath: string,
  script: string,
  cwd?: string,
  env?: Record<string, string>,
  args: string[] = [],
): Promise<PythonRunResult> {
  const { spawn } = await import('child_process');

  return new Promise((resolve) => {
    const proc = spawn(pythonPath, ['-c', script, ...args], {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

export async function runPythonFile(
  pythonPath: string,
  filePath: string,
  cwd?: string,
  env?: Record<string, string>,
): Promise<PythonRunResult> {
  const { spawn } = await import('child_process');

  return new Promise((resolve) => {
    const proc = spawn(pythonPath, [filePath], {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}
