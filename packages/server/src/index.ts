import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import fs from 'fs/promises'
import { join} from 'node:path'
const root = '/Users/unknownzjc/Documents/Code/mcp-chat'
// Schema definitions
const ReadFileArgsSchema = z.object({
    path: z.string(),
  });

export const ResultSchema = z
  .object({
    /**
     * This result property is reserved by the protocol to allow clients and servers to attach additional metadata to their responses.
     */
    _meta: z.optional(z.object({}).passthrough()),
    isError: z.optional(z.boolean())
  })
  .passthrough();
export const FileSystemResultSchema = ResultSchema.extend({
    content: z.array(z.object({ type: z.literal('text'), text: z.string() })),
})

export type FileSystemResult = z.infer<typeof FileSystemResultSchema>
// type ToolInput = {
//     type: string;
//     properties?: Record<string, any>;
// };

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const server = new Server({
    name: 'mcp-server',
    version: '0.0.1',
}, {
    capabilities: {
        tools: {}
    }
})
server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
        tools: [
            {
                name: "read_file",
                description:
                    "Read the complete contents of a file from the file system. " +
                    "Handles various text encodings and provides detailed error messages " +
                    "if the file cannot be read. Use this tool when you need to examine " +
                    "the contents of a single file. Only works within allowed directories.",
                inputSchema: zodToJsonSchema(ReadFileArgsSchema) as ToolInput,
            }
        ]
    }
})
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params
        switch(name) {
            case 'read_file': {
                const parsed = ReadFileArgsSchema.safeParse(args);
                if(!parsed.success) {
                    throw new Error(`Invalid arguments for read_file: ${parsed.error}`);
                }
                const { path} = parsed.data
                const filePath = join(root, path)
                // server.sendLoggingMessage({
                //     level: 'info',
                //     data: `文件路径为：${filePath}`
                // })
                const file = await fs.readFile(filePath, { encoding: 'utf-8'})
                return {
                    content: [{ type: "text", text: file }],
                }
            }
            default:
        throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
})
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Secure MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error('服务器启动失败:', error)
})