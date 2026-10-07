import * as vscode from 'vscode';
import { runKernel } from '../cudaq/runner';

export async function runKernelCommand(kernelName?: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showErrorMessage('No active editor.');
    return;
  }

  const name = kernelName;
  if (!name) {
    await vscode.window.showErrorMessage('No kernel specified.');
    return;
  }

  await runKernel(editor.document, name);
}
