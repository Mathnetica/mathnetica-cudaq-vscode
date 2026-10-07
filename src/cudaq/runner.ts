import * as path from 'path';
import * as vscode from 'vscode';
import { detectEnvironment } from './environment';
import { getSelectedTarget, getTargetEnvVar } from './targets';
import { getPythonExecutable, runPythonScript } from '../utils/python';
import { log, showOutput } from '../ui/outputChannel';

/**
 * Bootstrap that:
 * 1) suppresses CUDA-Q's import-time FutureWarning about sample/observe
 *    (no migration API yet — docs say "coming soon")
 * 2) sets the selected target when CUDAQ_TARGET is present
 * 3) runs the user file via runpy so @cudaq.kernel can recover source
 */
const RUN_FILE_WRAPPER = `
import os
import runpy
import sys
import warnings

warnings.filterwarnings(
    "ignore",
    message=r".*sample.*observe.*algorithmic primitives.*",
    category=FutureWarning,
)

target = os.environ.get("CUDAQ_TARGET", "")
if target:
    import cudaq
    cudaq.set_target(target)
runpy.run_path(sys.argv[1], run_name="__main__")
`;

async function executePythonFile(
  pythonPath: string,
  filePath: string,
  cwd: string,
  target: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const targetEnv = getTargetEnvVar(target);
  return runPythonScript(pythonPath, RUN_FILE_WRAPPER, cwd, targetEnv, [filePath]);
}

export async function runCurrentFile(document?: vscode.TextDocument): Promise<void> {
  const doc = document ?? vscode.window.activeTextEditor?.document;
  if (!doc) {
    await vscode.window.showErrorMessage('No active Python file to run.');
    return;
  }

  if (doc.languageId !== 'python') {
    await vscode.window.showErrorMessage('Active file is not a Python file.');
    return;
  }

  const pythonPath = await getPythonExecutable();
  if (!pythonPath) {
    await vscode.window.showErrorMessage(
      'Python interpreter not found. Configure a Python environment in VS Code.',
    );
    return;
  }

  const env = await detectEnvironment(getSelectedTarget());
  if (!env.cudaqInstalled) {
    await vscode.window.showErrorMessage(
      'CUDA-Q is not installed in the selected Python environment.',
    );
    return;
  }

  const target = getSelectedTarget();
  const filePath = doc.uri.fsPath;
  const cwd = path.dirname(filePath);
  const fileName = path.basename(filePath);

  showOutput();
  log(`Running ${fileName}...`);
  log('');
  if (target) {
    log(`CUDA-Q target: ${target}`);
    log('');
  }

  const result = await executePythonFile(pythonPath, filePath, cwd, target);

  if (result.stdout) {
    log(result.stdout.trimEnd());
  }
  if (result.stderr) {
    log(result.stderr.trimEnd());
  }

  if (result.exitCode === 0) {
    log('');
    log('Process finished successfully.');
  } else {
    log('');
    log(`Process exited with code ${result.exitCode}.`);
    await vscode.window.showErrorMessage(`CUDA-Q execution failed (exit code ${result.exitCode}).`);
  }
}

export async function runKernel(
  document: vscode.TextDocument,
  kernelName: string,
): Promise<void> {
  const pythonPath = await getPythonExecutable();
  if (!pythonPath) {
    await vscode.window.showErrorMessage(
      'Python interpreter not found. Configure a Python environment in VS Code.',
    );
    return;
  }

  const env = await detectEnvironment(getSelectedTarget());
  if (!env.cudaqInstalled) {
    await vscode.window.showErrorMessage(
      'CUDA-Q is not installed in the selected Python environment.',
    );
    return;
  }

  const target = getSelectedTarget();
  const filePath = document.uri.fsPath;
  const cwd = path.dirname(filePath);

  showOutput();
  log(`Running kernel "${kernelName}" from ${path.basename(filePath)}...`);
  log('');
  log(
    'Note: Kernel execution runs the entire file to preserve imports and context. ' +
      'Isolated single-kernel execution is not supported in v0.1.',
  );
  log('');
  if (target) {
    log(`CUDA-Q target: ${target}`);
    log('');
  }

  const result = await executePythonFile(pythonPath, filePath, cwd, target);

  if (result.stdout) {
    log(result.stdout.trimEnd());
  }
  if (result.stderr) {
    log(result.stderr.trimEnd());
  }

  if (result.exitCode === 0) {
    log('');
    log('Process finished successfully.');
  } else {
    log('');
    log(`Process exited with code ${result.exitCode}.`);
    await vscode.window.showErrorMessage(`Kernel execution failed (exit code ${result.exitCode}).`);
  }
}
