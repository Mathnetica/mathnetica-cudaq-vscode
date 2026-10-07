import * as vscode from 'vscode';

/** Prefer active notebook/editor URI so multi-root folder settings apply. */
export function getActiveResourceUri(): vscode.Uri | undefined {
  return (
    vscode.window.activeNotebookEditor?.notebook.uri ??
    vscode.window.activeTextEditor?.document.uri
  );
}

export function getCudaQConfig(section?: string): vscode.WorkspaceConfiguration {
  const resource = getActiveResourceUri();
  const base = section ? `mathnetica.cudaq.${section}` : 'mathnetica.cudaq';
  return vscode.workspace.getConfiguration(base, resource);
}
