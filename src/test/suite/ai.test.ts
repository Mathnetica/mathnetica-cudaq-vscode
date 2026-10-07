import * as assert from 'assert';
import { AIProvider, AIRequest, AIResponse } from '../../ai/provider';

class MockOllamaProvider implements AIProvider {
  readonly name = 'ollama';
  private available = true;
  private shouldTimeout = false;
  private response = 'Mock explanation of CUDA-Q code.';

  setAvailable(value: boolean): void {
    this.available = value;
  }

  setTimeout(value: boolean): void {
    this.shouldTimeout = value;
  }

  setResponse(value: string): void {
    this.response = value;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async chat(_request: AIRequest): Promise<AIResponse> {
    if (this.shouldTimeout) {
      throw new Error('Ollama request timed out.');
    }
    if (!this.available) {
      throw new Error('Ollama is not available.');
    }
    return { content: this.response };
  }
}

class MockMistralProvider implements AIProvider {
  readonly name = 'mistral';
  private hasKey = true;
  private shouldFail = false;

  setHasKey(value: boolean): void {
    this.hasKey = value;
  }

  setShouldFail(value: boolean): void {
    this.shouldFail = value;
  }

  async isAvailable(): Promise<boolean> {
    return this.hasKey;
  }

  async chat(_request: AIRequest): Promise<AIResponse> {
    if (!this.hasKey) {
      throw new Error('Mistral API key not configured.');
    }
    if (this.shouldFail) {
      throw new Error('Mistral request failed with status 401');
    }
    return { content: 'Fixed CUDA-Q code here.' };
  }
}

suite('AI Providers', () => {
  test('Ollama success', async () => {
    const provider = new MockOllamaProvider();
    assert.strictEqual(await provider.isAvailable(), true);
    const response = await provider.chat({ messages: [{ role: 'user', content: 'test' }] });
    assert.ok(response.content.length > 0);
  });

  test('Ollama unavailable', async () => {
    const provider = new MockOllamaProvider();
    provider.setAvailable(false);
    assert.strictEqual(await provider.isAvailable(), false);
    await assert.rejects(() => provider.chat({ messages: [] }));
  });

  test('Ollama timeout', async () => {
    const provider = new MockOllamaProvider();
    provider.setTimeout(true);
    await assert.rejects(
      () => provider.chat({ messages: [] }),
      /timed out/,
    );
  });

  test('Mistral success', async () => {
    const provider = new MockMistralProvider();
    assert.strictEqual(await provider.isAvailable(), true);
    const response = await provider.chat({ messages: [{ role: 'user', content: 'test' }] });
    assert.ok(response.content.length > 0);
  });

  test('Mistral missing API key', async () => {
    const provider = new MockMistralProvider();
    provider.setHasKey(false);
    assert.strictEqual(await provider.isAvailable(), false);
    await assert.rejects(
      () => provider.chat({ messages: [] }),
      /API key not configured/,
    );
  });

  test('Mistral invalid key', async () => {
    const provider = new MockMistralProvider();
    provider.setShouldFail(true);
    await assert.rejects(
      () => provider.chat({ messages: [] }),
      /failed with status 401/,
    );
  });
});
