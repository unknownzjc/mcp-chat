import { tool } from 'ai'
import { z } from 'zod'
import fs from 'fs/promises'

// 定义输入模式
export const readFileSchema = z.object({
    path: z.string().min(1),
    encoding: z.enum(["utf-8", "ascii", "utf16le"]).optional().default("utf-8")
  });
const readFile = tool({
    description: '读取文件',
    parameters: readFileSchema,
    execute: async ({ path, encoding }) => {
        try {
            const file = await fs.readFile(path, { encoding: encoding as BufferEncoding })
            return {
                success: true,
                data: file
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
})

export { readFile }