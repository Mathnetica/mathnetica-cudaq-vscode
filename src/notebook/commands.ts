import * as vscode from 'vscode';
import { AIService } from '../ai/service';
import { showOutput, log } from '../ui/outputChannel';

export function registerNotebookCommands(
  context: vscode.ExtensionContext,
  aiService: AIService,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mathnetica.cudaq.explainCurrentCell', async () => {
      const cell = getActiveNotebookCell();
      if (!cell) {
        await vscode.window.showWarningMessage('No active notebook cell.');
        return;
      }

      if (!aiService.isEnabled()) {
        await vscode.window.showWarningMessage(
          'AI assistance is disabled. Enable it in Mathnetica Tools for CUDA-Q settings.',
        );
        return;
      }

      try {
        const explanation = await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Explaining cell...' },
          async () => aiService.explain(cell.text),
        );

        showOutput();
        log('CUDA-Q Cell Explanation');
        log('=========================');
        log('');
        log(explanation);

        const doc = await vscode.workspace.openTextDocument({
          content: explanation,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed.';
        await vscode.window.showErrorMessage(message);
      }
    }),

    vscode.commands.registerCommand('mathnetica.cudaq.fixCurrentCell', async () => {
      const cellInfo = getActiveNotebookCellWithEditor();
      if (!cellInfo) {
        await vscode.window.showWarningMessage('No active notebook cell.');
        return;
      }

      if (!aiService.isEnabled()) {
        await vscode.window.showWarningMessage(
          'AI assistance is disabled. Enable it in Mathnetica Tools for CUDA-Q settings.',
        );
        return;
      }

      try {
        const fixed = await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Fixing cell...' },
          async () => aiService.fix(cellInfo.text),
        );

        const fixedCode = extractCodeBlock(fixed);

        const accept = await vscode.window.showInformationMessage(
          'Apply the suggested fix to the current cell?',
          'Accept Fix',
          'Dismiss',
        );

        if (accept === 'Accept Fix') {
          const edit = new vscode.WorkspaceEdit();
          edit.replace(cellInfo.document.uri, cellInfo.range, fixedCode);
          await vscode.workspace.applyEdit(edit);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed.';
        await vscode.window.showErrorMessage(message);
      }
    }),
  );
}

function getActiveNotebookCell(): { text: string } | undefined {
  const editor = vscode.window.activeNotebookEditor;
  if (!editor) {
    return undefined;
  }

  const cell = editor.notebook.cellAt(editor.selection.start);
  if (cell.kind !== vscode.NotebookCellKind.Code) {
    return undefined;
  }

  return { text: cell.document.getText() };
}

function getActiveNotebookCellWithEditor():
  | { text: string; document: vscode.TextDocument; range: vscode.Range }
  | undefined {
  const editor = vscode.window.activeNotebookEditor;
  if (!editor) {
    return undefined;
  }

  const cell = editor.notebook.cellAt(editor.selection.start);
  if (cell.kind !== vscode.NotebookCellKind.Code) {
    return undefined;
  }

  const doc = cell.document;
  return {
    text: doc.getText(),
    document: doc,
    range: new vscode.Range(0, 0, doc.lineCount, 0),
  };
}

function extractCodeBlock(text: string): string {
  const match = text.match(/```(?:python)?\n([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }
  return text.trim();
}
