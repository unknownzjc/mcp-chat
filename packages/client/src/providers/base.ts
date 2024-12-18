export interface ProviderMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ProviderConfig {
    apiKey: string;
    baseURL?: string;
    model: string;  // 添加 model 配置
    maxTokens?: number;  // 添加可选的 maxTokens 配置
}

export interface AIProvider {
    createCompletion(messages: ProviderMessage[], tools?: any[]): Promise<any>;
}