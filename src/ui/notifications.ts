import * as vscode from 'vscode';

export async function showError(message: string): Promise<void> {
  await vscode.window.showErrorMessage(message);
}

export async function showWarning(message: string): Promise<void> {
  await vscode.window.showWarningMessage(message);
}

export async function showInfo(message: string): Promise<void> {
  await vscode.window.showInformationMessage(message);
}
