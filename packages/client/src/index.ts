import 'dotenv/config'
import MCPClient from './client.js'
import inquirer from 'inquirer'
import ora from 'ora'
import { program } from 'commander'
import fs from 'fs/promises'
import path from 'path'
import store from './store.js'
// 封装spinner逻辑为高阶函数
const withSpinner = async <T>(message: string, task: () => Promise<T>): Promise<T> => {
    const spinner = ora(message).start()
    try {
        const result = await task()
        spinner.stop()
        return result
    } catch (error) {
        spinner.fail()
        throw error
    }
}

// 处理单次对话
async function handleConversation(client: MCPClient, input: string): Promise<void> {
    try {
        const response = await withSpinner('思考中...', () => client.createCompletion('',input))
        console.log('\n' + response + '\n')
    } catch (error) {
        console.error('对话出错:', error instanceof Error ? error.message : String(error))
    }
}

// 初始化客户端
async function initializeClient(): Promise<MCPClient> {
    const apiKey = process.env.API_KEY
    if (!apiKey) {
        throw new Error('API_KEY environment variable is required')
    }

    const client = new MCPClient({
        provider: 'anthropic',
        apiKey,
        baseURL: process.env.BASE_URL,
        model: 'claude-3-5-sonnet-20241022'
    })
    const servers = store.get('servers') as string[]
    const serverConfig = await fs.readFile(path.join(process.cwd(), 'src/serverConfig.json'), 'utf-8')
    const config = JSON.parse(serverConfig)
    const mcpConfig = config.mcpServers
    for (const serverName of servers) {
        await withSpinner('连接服务器...', () => {
            client.deleteConnection(serverName)
            return client.connectToServer(serverName, mcpConfig[serverName])
        })
    }
    // const serverPath = process.env.SERVER_PATH || './server/index.ts'
    // await withSpinner('连接服务器...', () => client.connectToServer(serverPath))
    return client
}

async function configureServer() {
    try {
        // 读取某个路径下的 config.json
        const serverConfig = await fs.readFile(path.join(process.cwd(), 'src/serverConfig.json'), 'utf-8')
        const config = JSON.parse(serverConfig)
        const servers = Object.keys(config.mcpServers)
        // 多选框，支持用户选择多个 server
        const answers = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'servers',
                message: '请选择要连接的服务器:',
                choices: servers
            }
        ])
        // 保存用户选择的配置到 store
        store.set('servers', answers.servers)
        console.log('配置已保存')
    } catch (error) {
        console.error('配置失败:', error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}

async function startChat() {
    try {
        const client = await initializeClient()
        
        console.log('欢迎使用 MCP Chat！')
        console.log('- 输入 "exit" 退出程序')
        console.log('- 直接输入内容与 AI 对话')
        console.log('----------------------------------------')

        let isRunning = true
        while (isRunning) {
            const { input } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'input',
                    message: '>'
                }
            ])

            if (input.toLowerCase() === 'exit') {
                console.log('再见！')
                isRunning = false
                client.cleanup()
                process.exit()
            }

            await handleConversation(client, input)
        }
    } catch (error) {
        console.error('程序异常:', error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}

// 设置命令行程序
program
    .name('mcp-chat')
    .description('MCP Chat CLI 工具')
    .version('1.0.0')

program
    .command('config')
    .description('配置 MCP 服务器')
    .action(configureServer)

program
    .command('chat')
    .description('启动聊天')
    .action(startChat)

program.parse()
