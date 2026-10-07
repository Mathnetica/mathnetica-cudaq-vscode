import * as vscode from 'vscode';
import { AIProvider, AIMessage } from './provider';
import { OllamaProvider } from './ollamaProvider';
import { MistralProvider } from './mistralProvider';
import {
  CUDAQ_SYSTEM_PROMPT,
  EXPLAIN_PROMPT,
  FIX_PROMPT,
  GENERATE_PROMPT,
} from './prompts';
import { buildEnvironmentContext } from './context';
import { getCudaQConfig } from '../utils/config';

export class AIService {
  private readonly ollama: OllamaProvider;
  private readonly mistral: MistralProvider;
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.ollama = new OllamaProvider(context);
    this.mistral = new MistralProvider(context);
  }

  isEnabled(): boolean {
    return getCudaQConfig('ai').get<boolean>('enabled', false);
  }

  getProvider(): AIProvider {
    const providerName = getCudaQConfig('ai').get<string>('provider', 'ollama');
    return providerName === 'mistral' ? this.mistral : this.ollama;
  }

  get mistralProvider(): MistralProvider {
    return this.mistral;
  }

  async ensureAvailable(): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('AI assistance is disabled. Enable it in Mathnetica Tools for CUDA-Q settings.');
    }

    const provider = this.getProvider();
    const available = await provider.isAvailable();
    if (!available) {
      if (provider.name === 'ollama') {
        throw new Error(
          'Ollama is not available. Ensure Ollama is running at the configured URL.',
        );
      }
      throw new Error(
        'Mistral API key is not configured. Use "Mathnetica: Set Mistral API Key".',
      );
    }
  }

  private async showPrivacyNotice(): Promise<void> {
    const provider = this.getProvider();
    if (provider.name === 'ollama') {
      // Do not await — showInformationMessage without buttons blocks until dismissed,
      // which made "Explaining..." appear stuck.
      const seenKey = 'mathnetica.cudaq.ollamaNoticeSeen';
      if (!this.context.globalState.get(seenKey)) {
        void vscode.window.showInformationMessage(
          'Using local Ollama inference. Your code stays on this machine. First reply may take ~20–40s while the model loads.',
        );
        void this.context.globalState.update(seenKey, true);
      }
      return;
    }

    const proceed = await vscode.window.showWarningMessage(
      'Selected code will be sent to Mistral API for processing. Continue?',
      'Continue',
      'Cancel',
    );
    if (proceed !== 'Continue') {
      throw new Error('AI request cancelled by user.');
    }
  }

  async explain(code: string): Promise<string> {
    await this.ensureAvailable();
    await this.showPrivacyNotice();

    const envContext = await buildEnvironmentContext();
    const messages: AIMessage[] = [
      { role: 'system', content: CUDAQ_SYSTEM_PROMPT },
      { role: 'user', content: `${EXPLAIN_PROMPT}\n\n${envContext}\n\n\`\`\`python\n${code}\n\`\`\`` },
    ];

    const response = await this.getProvider().chat({ messages });
    return response.content;
  }

  async fix(code: string): Promise<string> {
    await this.ensureAvailable();
    await this.showPrivacyNotice();

    const envContext = await buildEnvironmentContext();
    const messages: AIMessage[] = [
      { role: 'system', content: CUDAQ_SYSTEM_PROMPT },
      { role: 'user', content: `${FIX_PROMPT}\n\n${envContext}\n\n\`\`\`python\n${code}\n\`\`\`` },
    ];

    const response = await this.getProvider().chat({ messages });
    return response.content;
  }

  async generate(description: string): Promise<string> {
    await this.ensureAvailable();
    await this.showPrivacyNotice();

    const envContext = await buildEnvironmentContext();
    const messages: AIMessage[] = [
      { role: 'system', content: CUDAQ_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${GENERATE_PROMPT}\n\n${envContext}\n\nDescription: ${description}`,
      },
    ];

    const response = await this.getProvider().chat({ messages });
    return response.content;
  }
}
