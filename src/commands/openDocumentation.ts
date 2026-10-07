import * as vscode from 'vscode';

const CUDAQ_DOCS_URL = 'https://nvidia.github.io/cuda-quantum/latest/';

export async function openDocumentationCommand(): Promise<void> {
  await vscode.env.openExternal(vscode.Uri.parse(CUDAQ_DOCS_URL));
}
