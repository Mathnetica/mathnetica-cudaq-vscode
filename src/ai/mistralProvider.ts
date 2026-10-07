import * as vscode from 'vscode';
import { AIProvider, AIRequest, AIResponse } from './provider';
import { getCudaQConfig } from '../utils/config';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const SECRET_KEY = 'mathnetica.cudaq.mistralApiKey';
const DEFAULT_MODEL = 'mistral-small-latest';
const DEFAULT_TIMEOUT_MS = 60000;

export class MistralProvider implements AIProvider {
  readonly name = 'mistral';

  constructor(private readonly context: vscode.ExtensionContext) {}

  private getModel(request: AIRequest): string {
    if (request.model) {
      return request.model;
    }
    const configured = getCudaQConfig('ai').get<string>('model', '');
    return configured || DEFAULT_MODEL;
  }

  async getApiKey(): Promise<string | undefined> {
    return this.context.secrets.get(SECRET_KEY);
  }

  async setApiKey(key: string): Promise<void> {
    await this.context.secrets.store(SECRET_KEY, key);
  }

  async removeApiKey(): Promise<void> {
    await this.context.secrets.delete(SECRET_KEY);
  }

  async isAvailable(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Mistral API key not configured. Use "Mathnetica: Set Mistral API Key".');
    }

    const model = this.getModel(request);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Mistral request failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return { content: data.choices?.[0]?.message?.content ?? '' };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Mistral request timed out.');
      }
      throw err;
    }
  }
}

export { SECRET_KEY as MISTRAL_SECRET_KEY };
