/**
 * @file file-parser.ts
 * @input Buffer (文件二进制), fileName, mimeType, Cloudflare R2 配置
 * @output parseFile (解析文本), uploadToR2 (存储), processUploadedFile (完整流程)
 * @pos 文件处理层 - 负责 PDF/DOCX/TXT 解析与云存储，是数据输入的第一道门
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

// ===========================================
// 文件解析服务 (PDF/DOCX/TXT)
// ===========================================

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 客户端配置 (兼容 S3 API)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'smartgrant-files';

export interface ParsedFile {
  fileName: string;
  mimeType: string;
  textContent: string;  // 解析后的纯文本
  r2Key?: string;       // R2 存储的 key
  r2Url?: string;       // R2 公开访问 URL
}

/**
 * 上传文件到 Cloudflare R2
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  projectId: string
): Promise<{ key: string; url: string }> {
  const key = `projects/${projectId}/${Date.now()}-${fileName}`;

  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));

  const url = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { key, url };
}

/**
 * 从 R2 下载文件
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const response = await r2Client.send(new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  }));

  const chunks: Uint8Array[] = [];
  // @ts-ignore - Body is a readable stream
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * 解析 PDF 文件
 * 使用 pdf-parse 库
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // 动态导入 pdf-parse (避免 SSR 问题)
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF 解析失败:', error);
    throw new Error('PDF 文件解析失败，请确保文件格式正确');
  }
}

/**
 * 解析 DOCX 文件
 * 使用 mammoth 库
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    // 动态导入 mammoth
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX 解析失败:', error);
    throw new Error('DOCX 文件解析失败，请确保文件格式正确');
  }
}

/**
 * 根据文件类型解析内容
 */
export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  // PDF
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return parsePDF(buffer);
  }

  // DOCX
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return parseDOCX(buffer);
  }

  // DOC (旧版 Word) - 建议用户转换为 DOCX
  if (mimeType === 'application/msword' || fileName.endsWith('.doc')) {
    throw new Error('暂不支持 .doc 格式，请将文件另存为 .docx 格式后重新上传');
  }

  // 纯文本 (TXT/MD)
  if (
    mimeType.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md')
  ) {
    return buffer.toString('utf-8');
  }

  throw new Error(`不支持的文件格式: ${mimeType}`);
}


/**
 * 完整的文件处理流程：
 * 1. 解析文件内容
 * 2. 上传原始文件到 R2
 * 3. 返回解析结果
 */
export async function processUploadedFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  projectId: string
): Promise<ParsedFile> {
  // 1. 解析文件内容
  const textContent = await parseFile(fileBuffer, fileName, mimeType);

  // 2. 上传原始文件到 R2 (可选，用于备份和下载)
  let r2Key: string | undefined;
  let r2Url: string | undefined;

  try {
    const uploadResult = await uploadToR2(fileBuffer, fileName, mimeType, projectId);
    r2Key = uploadResult.key;
    r2Url = uploadResult.url;
  } catch (error) {
    console.warn('R2 上传失败，继续处理:', error);
    // R2 上传失败不影响主流程
  }

  return {
    fileName,
    mimeType,
    textContent,
    r2Key,
    r2Url,
  };
}

/**
 * 文件存储策略说明：
 * 
 * 1. 原始文件 -> Cloudflare R2
 *    - 优点：成本低、全球 CDN、兼容 S3 API
 *    - 用途：备份原始文件、支持用户下载
 * 
 * 2. 解析后的文本 -> Supabase PostgreSQL
 *    - 优点：便于搜索、与项目数据关联
 *    - 用途：AI 评审时直接读取
 * 
 * 3. 文件元数据 -> Supabase project_materials 表
 *    - 存储：file_name, mime_type, r2_key, r2_url
 *    - 关联：project_id
 * 
 * 这种架构的好处：
 * - 大文件不占用数据库空间
 * - 文本内容可以直接用于 AI 处理
 * - 原始文件可以随时下载
 * - R2 成本极低 (免费额度 10GB/月)
 */
