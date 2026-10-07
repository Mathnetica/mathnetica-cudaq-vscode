import * as vscode from 'vscode';
import { detectEnvironment, formatEnvironmentInfo } from '../cudaq/environment';
import { getSelectedTarget } from '../cudaq/targets';
import { showOutput, log } from '../ui/outputChannel';

export async function showEnvironmentCommand(): Promise<void> {
  const info = await detectEnvironment(getSelectedTarget());
  const formatted = formatEnvironmentInfo(info);

  showOutput();
  log(formatted);

  await vscode.window.showInformationMessage('CUDA-Q environment info written to output channel.');
}
