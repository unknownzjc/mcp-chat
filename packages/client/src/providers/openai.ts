import OpenAI from 'openai';
import { AIProvider, ProviderConfig, ProviderMessage } from './base';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.client = new OpenAI({
            baseURL: config.baseURL,
            apiKey: config.apiKey
        });
        this.config = config;
    }

    async createCompletion(messages: ProviderMessage[], tools?: any[]) {
        return await this.client.chat.completions.create({
            model: this.config.model,
            messages,
            max_tokens: this.config.maxTokens,
            tools
        });
    }
}