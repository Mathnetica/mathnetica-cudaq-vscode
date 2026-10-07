import * as vscode from 'vscode';
import { AIProvider, AIRequest, AIResponse } from './provider';
import { getCudaQConfig } from '../utils/config';

const DEFAULT_MODEL = 'llama3.2';
// Cold-start model load on Apple Silicon often takes 20–40s.
const DEFAULT_TIMEOUT_MS = 180000;

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';

  constructor(_context: vscode.ExtensionContext) {}

  private getUrl(): string {
    return getCudaQConfig('ollama').get<string>('url', 'http://localhost:11434');
  }

  private getModel(request: AIRequest): string {
    if (request.model) {
      return request.model;
    }
    const configured = getCudaQConfig('ai').get<string>('model', '');
    return configured || DEFAULT_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const url = this.getUrl();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${url}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const url = this.getUrl();
    const model = this.getModel(request);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: request.messages,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { message?: { content?: string } };
      return { content: data.message?.content ?? '' };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Ollama request timed out.');
      }
      throw err;
    }
  }
}
