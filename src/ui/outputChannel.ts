import * as vscode from 'vscode';

const CHANNEL_NAME = 'Mathnetica Tools for CUDA-Q';

let channel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel(CHANNEL_NAME);
  }
  return channel;
}

export function log(message: string): void {
  getOutputChannel().appendLine(message);
}

export function showOutput(): void {
  getOutputChannel().show(true);
}
