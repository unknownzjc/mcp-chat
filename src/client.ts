import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
export default class MCPClient {
    client: any
    constructor() {
        const baseURL = process.env.ANTHROPIC_API_BASE_URL || 'https://aihubmix.com'
        const apiKey = process.env.ANTHROPIC_API_KEY

        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required')
        }
        const client = new Anthropic({
            baseURL,
            apiKey
        })
        this.client = client
        
    }
    async createCompletion(prompt: string, tools: any[]) {
        const message = await this.client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
            tools
        })
        console.log(message.content)
    }
}