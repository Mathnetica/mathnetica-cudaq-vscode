import * as vscode from 'vscode';
import { detectCudaQInDocument } from './detection';
import { findKernels } from './kernels';

export class CudaQCodeLensProvider implements vscode.CodeLensProvider {
  private readonly onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  refresh(): void {
    this.onDidChangeCodeLensesEmitter.fire();
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.CodeLens[] {
    if (document.languageId !== 'python') {
      return [];
    }

    if (!detectCudaQInDocument(document.getText())) {
      return [];
    }

    const kernels = findKernels(document.getText());
    const codeLenses: vscode.CodeLens[] = [];

    for (const kernel of kernels) {
      const range = new vscode.Range(kernel.line, 0, kernel.line, 0);

      codeLenses.push(
        new vscode.CodeLens(range, {
          title: '▶ Run Kernel',
          command: 'mathnetica.cudaq.runKernel',
          arguments: [kernel.name],
        }),
      );

      codeLenses.push(
        new vscode.CodeLens(range, {
          title: '✨ Explain',
          command: 'mathnetica.cudaq.explainKernel',
          arguments: [kernel.name, document.uri.toString()],
        }),
      );
    }

    return codeLenses;
  }
}
