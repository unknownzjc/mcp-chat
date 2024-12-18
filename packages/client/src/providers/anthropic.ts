import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, ProviderConfig, ProviderMessage } from './base';

export class AnthropicProvider implements AIProvider {
    private client: Anthropic;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.client = new Anthropic({
            baseURL: config.baseURL,
            apiKey: config.apiKey
        });
        this.config = config;
    }

    async createCompletion(messages: ProviderMessage[], tools?: any[]) {
        return await this.client.messages.create({
            model: this.config.model,
            max_tokens: this.config.maxTokens || 1024,
            messages,
            tools
        });
    }
}