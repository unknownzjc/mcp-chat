import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport, StdioServerParameters} from '@modelcontextprotocol/sdk/client/stdio.js'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { ToolCallResponse } from './types'
import ora from 'ora'
import { ProviderFactory, ProviderType } from './providers/factory';
import { AIProvider, ProviderConfig, ProviderMessage } from './providers/base';
export interface MCPClientConfig {
    provider: ProviderType;
    apiKey: string;        // 改为必需
    model: string;         // 改为必需
    baseURL?: string;      // 保持可选
    maxTokens?: number;    // 保持可选
}
interface MCPClientConnection {
    client: Client,
    transport: StdioClientTransport,
    status: 'connecting' | 'connected' | 'disconnected',
    config: string
}

export default class MCPClient {
    private clients: Map<string, MCPClientConnection> = new Map()
    provider: AIProvider
    constructor(config: MCPClientConfig) {
        const providerConfig: ProviderConfig = {
            apiKey: config.apiKey,
            model: config.model,
            baseURL: config.baseURL,
            maxTokens: config.maxTokens
        }

        this.provider = ProviderFactory.createProvider(config.provider, providerConfig)
    }
    async createCompletion(serverName: string, prompt: string) {
        const messages: ProviderMessage[] = [{ role: 'user', content: prompt }]
        const tools = await this.getTools(serverName)
        const response = await this.provider.createCompletion(messages, tools)
        let finalContent: string[] = []
        for(const content of response.content) {
            if(content.type === 'text') {
                finalContent.push(content.text)
            } else if(content.type === 'tool_use') {
                const tool = tools.find(tool => tool.name === content.name)
                if(tool) {
                    const client = this.getClient(serverName)
                    const result = await client.callTool({
                        name: tool.name,
                        arguments: content.input
                    }, CallToolResultSchema) as ToolCallResponse
                    if(content.text) {
                        messages.push({
                            role: 'assistant',
                            content: content.text
                        })
                    }
                    // result.content as 
                    if(!result.isError&& result.content[0].type === 'text') {
                        messages.push({
                            role: 'user',
                            content: result.content[0].text
                        })
                        const response = await this.provider.createCompletion(messages)
                        finalContent.push(response.content[0].text)
                    }
                }
            }
        }
        return finalContent.join('\n')
    }
    async connectToServer(serverName: string,serverConfig: StdioServerParameters) {
        const spinner = ora(`正在连接服务器 ${serverName}...`).start()
        try {
            if (this.clients.has(serverName)) {
                spinner.info(`服务器 ${serverName} 已连接`)
                return
            }

            const client = new Client({
                name: `mcp-client`,
                version: '0.0.1',
                timeout: 120000
            }, {
                capabilities: { }
            })
            const transport = new StdioClientTransport({
                command: serverConfig.command,
                args: serverConfig.args,
                env: {
                    ...serverConfig.env,
                    ...process.env.PATH ? {PATH: process.env.PATH} : {}
                },
                stderr: 'pipe'
            })
            transport.onerror = async (error) => {
                console.error(`Transport error for ${serverName}`, error)
                const connection = this.clients.get(serverName)
                if(connection) {
                    connection.status = 'disconnected'
                }
            }
            transport.onclose = async () => {
                const connection = this.clients.get(serverName)
                if(connection) {
                    connection.status = 'disconnected'
                }
            }
            await transport.start()
            const stderrStream = transport.stderr
            if(stderrStream) {
                stderrStream.on('data', (data: Buffer) => {
                    console.error(`${serverName} stderr: ${data.toString()}`)
                })
            } else {
                console.error(`No stderr stream for ${serverName}`)
            }
            const connection: MCPClientConnection = {
                client,
                transport,
                status: 'connecting',
                config: JSON.stringify(serverConfig)
            }
            transport.start = async () => {}
            await client.connect(transport)
            connection.status = 'connected'
            this.clients.set(serverName, connection)
            spinner.succeed(`${serverName} server 连接成功`)
        } catch (error) {
            spinner.fail(`连接 ${serverName} 失败: ${error.message}`)
            const connection = this.clients.get(serverName)
            if(connection) {
                connection.status = 'disconnected'
            }
            throw error
        }
    }
    async deleteConnection(serverName: string) {
        const connection = this.clients.get(serverName)
        if(connection) {
            try {
                await connection.client.close()
                await connection.transport.close()
            } catch (error) {
                console.error(`关闭连接 ${serverName} 失败: ${error.message}`)
            }
            this.clients.delete(serverName)
        }
    }
    private getClient(serverName: string): Client {
        const conection = this.clients.get(serverName)
        if (!conection) {
            throw new Error(`服务器 ${serverName} 未连接`)
        }
        return conection.client
    }
    async getTools(serverName: string) {
        const client = this.getClient(serverName)
        const { tools } = await client.listTools()
        return tools.map(tool => {
            return {
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema
            }
        })
    }
    getConnectedServers(): string[] {
        return Array.from(this.clients.keys())
    }
    cleanup() {
        for(const connection of this.clients.keys()) {
            this.deleteConnection(connection)
        }
    }
}