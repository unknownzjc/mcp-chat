import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import Anthropic from '@anthropic-ai/sdk'
async function main() {
    const client = new Anthropic({
        baseURL: 'https://aihubmix.com',
        apiKey: 'sk-NM84YzNi6OjARyVJBaE1532679684b059bC030B4Ec6d2987'
    })
    const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hello, Claude' }]
    })
    console.log(message.content)
}

main()