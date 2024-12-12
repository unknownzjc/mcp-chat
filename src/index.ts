import 'dotenv/config'
// import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import MCPClient from './client.js'
import { readFile, readFileSchema } from './tools/index.js'
async function main() {
    const client = new MCPClient()
    // await client.createCompletion('hello', [])
    let tools = [
        {
            name: 'readFile',
            description: '读取文件',
            input_schema: {
                type: 'object',
                properties: {
                    path: { type: 'string' },
                    encoding: { type: 'string' }
                },
                required: ['path', 'encoding']
            }
        }
    ]

    await client.createCompletion('获取 src/tools/index.ts 文件内容', tools)
}


main()