import { AIProvider, ProviderConfig } from './base';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

export type ProviderType = 'anthropic' | 'openai';

export class ProviderFactory {
    static createProvider(type: ProviderType, config: ProviderConfig): AIProvider {
        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
}