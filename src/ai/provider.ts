export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
}

export interface AIResponse {
  content: string;
}

export interface AIProvider {
  readonly name: string;
  chat(request: AIRequest): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

export interface KnowledgeProvider {
  getContext(query: string): Promise<string>;
}

// Placeholder for future RAG integration (v0.2)
export class CudaQKnowledgeProvider implements KnowledgeProvider {
  async getContext(_query: string): Promise<string> {
    return '';
  }
}
