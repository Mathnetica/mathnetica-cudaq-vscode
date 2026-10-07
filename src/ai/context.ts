import * as vscode from 'vscode';
import { getSelectedTarget } from '../cudaq/targets';

export async function buildEnvironmentContext(): Promise<string> {
  // Lightweight context only — avoid slow GPU probes during AI calls.
  const target = getSelectedTarget() || 'unknown';
  return [
    'Environment context:',
    `- Platform: ${process.platform}`,
    `- Selected target: ${target}`,
  ].join('\n');
}

export function getSelectedCode(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }
  const selection = editor.selection;
  if (selection.isEmpty) {
    return undefined;
  }
  return editor.document.getText(selection);
}

export function getActiveDocumentText(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }
  return editor.document.getText();
}
