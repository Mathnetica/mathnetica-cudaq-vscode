import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'mathnetica.cudaq.selectTarget';
    this.item.tooltip = 'Select CUDA-Q Target';
  }

  show(target: string): void {
    this.item.text = `$(symbol-misc) CUDA-Q: ${target || 'unknown'}`;
    this.item.show();
  }

  hide(): void {
    this.item.hide();
  }

  updateTarget(target: string): void {
    if (this.item.text) {
      this.item.text = `$(symbol-misc) CUDA-Q: ${target || 'unknown'}`;
    }
  }

  dispose(): void {
    this.item.dispose();
  }
}
