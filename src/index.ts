import 'dotenv/config'
// import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import MCPClient from './client.js'
async function main() {
    const client = new MCPClient()
    // await client.createCompletion('hello', [])
    await client.createCompletion('给 client.ts 加一个 provider 的属性', [])
}


main()