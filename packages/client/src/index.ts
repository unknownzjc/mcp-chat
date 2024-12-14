import 'dotenv/config'
import MCPClient from './client.js'
import inquirer from 'inquirer'
import ora from 'ora'

const tools = []

async function main() {
    const client = new MCPClient()
    console.log('欢迎使用 MCP Chat！')
    console.log('- 输入 "exit" 退出程序')
    console.log('- 直接输入内容与 AI 对话')
    console.log('----------------------------------------')
    await client.connectToSever('./server/index.ts')
    while (true) {
        const { input } = await inquirer.prompt([
            {
                type: 'input',
                name: 'input',
                message: '>'
            }
        ])

        if (input.toLowerCase() === 'exit') {
            console.log('再见！')
            // break
        }

        const spinner = ora('思考中...').start()
        try {
            
            const response = await client.createCompletion(input)
            spinner.stop()
            console.log('\n' + response + '\n')
        } catch (error) {
            spinner.stop()
            console.error('发生错误:', error)
        }
    }
}

main().catch(console.error)