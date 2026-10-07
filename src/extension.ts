import * as vscode from 'vscode';
import { detectCudaQInDocument } from './cudaq/detection';
import { CudaQCodeLensProvider } from './cudaq/codelens';
import { getSelectedTarget } from './cudaq/targets';
import { StatusBarManager } from './ui/statusBar';
import { runFileCommand } from './commands/runFile';
import { runKernelCommand } from './commands/runKernel';
import { selectTargetCommand } from './commands/selectTarget';
import { showEnvironmentCommand } from './commands/showEnvironment';
import { openDocumentationCommand } from './commands/openDocumentation';
import { AIService } from './ai/service';
import { registerAICommands } from './ai/commands';
import { registerNotebookCommands } from './notebook/commands';
import { notebookHasCudaQ } from './notebook/detection';

const CONTEXT_ACTIVE = 'mathnetica.cudaq.active';
const CONTEXT_AI_ENABLED = 'mathnetica.cudaq.aiEnabled';

let statusBar: StatusBarManager;
let codeLensProvider: CudaQCodeLensProvider;

export function activate(context: vscode.ExtensionContext): void {
  statusBar = new StatusBarManager();
  codeLensProvider = new CudaQCodeLensProvider();
  const aiService = new AIService(context);

  context.subscriptions.push(statusBar);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ language: 'python' }, codeLensProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mathnetica.cudaq.runFile', runFileCommand),
    vscode.commands.registerCommand('mathnetica.cudaq.runKernel', runKernelCommand),
    vscode.commands.registerCommand('mathnetica.cudaq.selectTarget', async () => {
      const target = await selectTargetCommand();
      if (target) {
        statusBar.updateTarget(target);
      }
    }),
    vscode.commands.registerCommand('mathnetica.cudaq.showEnvironment', showEnvironmentCommand),
    vscode.commands.registerCommand('mathnetica.cudaq.openDocumentation', openDocumentationCommand),
  );

  registerAICommands(context, aiService);
  registerNotebookCommands(context, aiService);

  const updateActiveState = (editor?: vscode.TextEditor): void => {
    if (!editor) {
      void vscode.commands.executeCommand('setContext', CONTEXT_ACTIVE, false);
      statusBar.hide();
      return;
    }

    const isActive = detectCudaQInDocument(editor.document.getText());
    void vscode.commands.executeCommand('setContext', CONTEXT_ACTIVE, isActive);

    if (isActive) {
      const target = getSelectedTarget() || 'unknown';
      statusBar.show(target);
    } else {
      statusBar.hide();
    }

    codeLensProvider.refresh();
  };

  const updateNotebookState = (): void => {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
      return;
    }

    const cells = notebookEditor.notebook
      .getCells()
      .filter((c) => c.kind === vscode.NotebookCellKind.Code)
      .map((c) => ({ kind: 2, value: c.document.getText() }));

    const isActive = notebookHasCudaQ(cells);
    void vscode.commands.executeCommand('setContext', CONTEXT_ACTIVE, isActive);

    if (isActive) {
      const target = getSelectedTarget() || 'unknown';
      statusBar.show(target);
    }
  };

  const updateAiContext = (): void => {
    void vscode.commands.executeCommand('setContext', CONTEXT_AI_ENABLED, aiService.isEnabled());
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      updateActiveState(editor);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (vscode.window.activeTextEditor?.document === event.document) {
        updateActiveState(vscode.window.activeTextEditor);
      }
      if (event.document.languageId === 'python') {
        codeLensProvider.refresh();
      }
    }),
    vscode.window.onDidChangeActiveNotebookEditor(() => {
      updateNotebookState();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('mathnetica.cudaq')) {
        updateAiContext();
        if (event.affectsConfiguration('mathnetica.cudaq.target')) {
          const target = getSelectedTarget() || 'unknown';
          statusBar.updateTarget(target);
        }
      }
    }),
  );

  updateActiveState(vscode.window.activeTextEditor);
  updateAiContext();
}

export function deactivate(): void {
  statusBar?.dispose();
}
