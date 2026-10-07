import * as vscode from 'vscode';
import { AIService } from './service';
import { getSelectedCode } from './context';
import { findKernels } from '../cudaq/kernels';
import { showOutput, log } from '../ui/outputChannel';

export function registerAICommands(
  context: vscode.ExtensionContext,
  aiService: AIService,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mathnetica.cudaq.explainSelection', async () => {
      const code = getSelectedCode();
      if (!code) {
        await vscode.window.showWarningMessage('Select CUDA-Q code to explain.');
        return;
      }

      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Explaining CUDA-Q code...' },
          async () => {
            const explanation = await aiService.explain(code);
            showOutput();
            log('CUDA-Q Explanation');
            log('==================');
            log('');
            log(explanation);

            const doc = await vscode.workspace.openTextDocument({
              content: explanation,
              language: 'markdown',
            });
            await vscode.window.showTextDocument(doc, { preview: true });
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed.';
        await vscode.window.showErrorMessage(message);
      }
    }),

    vscode.commands.registerCommand(
      'mathnetica.cudaq.explainKernel',
      async (kernelName: string, documentUri: string) => {
        try {
          const uri = vscode.Uri.parse(documentUri);
          const doc = await vscode.workspace.openTextDocument(uri);
          const kernels = findKernels(doc.getText());
          const kernel = kernels.find((k) => k.name === kernelName);
          if (!kernel) {
            await vscode.window.showWarningMessage(`Kernel "${kernelName}" not found.`);
            return;
          }

          const lines = doc.getText().split('\n');
          const kernelEnd = findKernelEndLine(lines, kernel.line);
          const kernelCode = lines.slice(kernel.line, kernelEnd + 1).join('\n');

          await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: 'Explaining kernel...' },
            async () => {
              const explanation = await aiService.explain(kernelCode);
              showOutput();
              log(`CUDA-Q Kernel Explanation: ${kernelName}`);
              log('================================');
              log('');
              log(explanation);

              const resultDoc = await vscode.workspace.openTextDocument({
                content: explanation,
                language: 'markdown',
              });
              await vscode.window.showTextDocument(resultDoc, { preview: true });
            },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : 'AI request failed.';
          await vscode.window.showErrorMessage(message);
        }
      },
    ),

    vscode.commands.registerCommand('mathnetica.cudaq.fixSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      const code = getSelectedCode();
      if (!editor || !code) {
        await vscode.window.showWarningMessage('Select CUDA-Q code to fix.');
        return;
      }

      try {
        const fixed = await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Fixing CUDA-Q code...' },
          async () => aiService.fix(code),
        );

        const fixedCode = extractCodeBlock(fixed);
        const originalUri = editor.document.uri;
        const fixedDoc = await vscode.workspace.openTextDocument({
          content: fixedCode,
          language: 'python',
        });

        await vscode.commands.executeCommand(
          'vscode.diff',
          originalUri,
          fixedDoc.uri,
          'CUDA-Q Fix Suggestion',
        );

        const accept = await vscode.window.showInformationMessage(
          'Review the suggested fix in the diff editor.',
          'Accept Fix',
          'Dismiss',
        );

        if (accept === 'Accept Fix') {
          await editor.edit((editBuilder) => {
            editBuilder.replace(editor.selection, fixedCode);
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed.';
        await vscode.window.showErrorMessage(message);
      }
    }),

    vscode.commands.registerCommand('mathnetica.cudaq.generateCode', async () => {
      const description = await vscode.window.showInputBox({
        prompt: 'Describe the CUDA-Q code to generate',
        placeHolder: 'Create a Bell state and sample it 1000 times.',
      });

      if (!description) {
        return;
      }

      try {
        const generated = await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Generating CUDA-Q code...' },
          async () => aiService.generate(description),
        );

        const code = extractCodeBlock(generated);
        const doc = await vscode.workspace.openTextDocument({
          content: code,
          language: 'python',
        });
        await vscode.window.showTextDocument(doc);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed.';
        await vscode.window.showErrorMessage(message);
      }
    }),

    vscode.commands.registerCommand('mathnetica.cudaq.setMistralApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Mistral API key',
        password: true,
        ignoreFocusOut: true,
      });

      if (key) {
        await aiService.mistralProvider.setApiKey(key);
        await vscode.window.showInformationMessage('Mistral API key saved securely.');
      }
    }),

    vscode.commands.registerCommand('mathnetica.cudaq.removeMistralApiKey', async () => {
      await aiService.mistralProvider.removeApiKey();
      await vscode.window.showInformationMessage('Mistral API key removed.');
    }),
  );
}

function extractCodeBlock(text: string): string {
  const match = text.match(/```(?:python)?\n([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }
  return text.trim();
}

function findKernelEndLine(lines: string[], startLine: number): number {
  const startLineContent = lines[startLine] ?? '';
  const baseIndent = (startLineContent.match(/^(\s*)/)?.[1] ?? '').length;

  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      continue;
    }
    const indent = (line.match(/^(\s*)/)?.[1] ?? '').length;
    if (indent <= baseIndent) {
      return i - 1;
    }
  }

  return lines.length - 1;
}
