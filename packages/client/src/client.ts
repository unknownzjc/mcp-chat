import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { FileSystemResult } from '@mcpchat/server'
import ora from 'ora'
export default class MCPClient {
    provider: any
    client: Client
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
        this.provider = client
        // this.tools = tools
    }
    async createCompletion(prompt: string) {
        const messages = [{ role: 'user', content: prompt }]
        const tools = await this.getTools()
        const response = await this.provider.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages,
            tools
        })
        let finalContent: string[] = []
        for(const content of response.content) {
            if(content.type === 'text') {
                finalContent.push(content.text)
            } else if(content.type === 'tool_use') {
                const tool = tools.find(tool => tool.name === content.name)
                if(tool) {
                    const result = await this.client.callTool({
                        name: tool.name,
                        arguments: content.input
                    }, CallToolResultSchema) as FileSystemResult
                    if(content.text) {
                        messages.push({
                            role: 'assistant',
                            content: content.text
                        })
                    }
                    // result.content as 
                    if(!result.isError) {
                        messages.push({
                            role: 'user',
                            content: result.content[0].text
                        })
                        const response = await this.provider.messages.create({
                            model: "claude-3-5-sonnet-20241022",
                            max_tokens: 1024,
                            messages
                        })
                        finalContent.push(response.content[0].text)
                    }
                }
            }
        }
        return finalContent.join('\n')
    }
    async connectToSever(serverPath: string) {
        const spinner = ora('正在连接服务器...').start()
        try {
            this.client = new Client({
                name: 'mcp-client',
                version: '0.0.1',
            }, {
                capabilities: {
                    tools: {}
                }
            })
            await this.client.connect(new StdioClientTransport({
                command: 'node',
                args: ["/Users/unknownzjc/Documents/Code/mcp-chat/packages/server/dist/index.js"],
            }))
            spinner.succeed('连接成功')
        } catch (error) {
            spinner.fail(`连接失败: ${error.message}`)
            throw error // 重新抛出错误，让上层调用者知道发生了错误
        }
    }
    async getTools() {
        const { tools } = await this.client.listTools()
        return tools.map(tool => {
            return {
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema
            }
        })
    }
}