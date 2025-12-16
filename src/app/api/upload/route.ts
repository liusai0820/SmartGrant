// ===========================================
// 文件上传 API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { processUploadedFile } from '@/lib/file-parser';
import { supabaseAdmin } from '@/lib/supabase/server';

export const config = {
  api: {
    bodyParser: false, // 禁用默认解析，使用 formData
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string;
    const type = formData.get('type') as 'material' | 'guideline';

    if (!file || !projectId || !type) {
      return NextResponse.json(
        { error: '缺少必要参数: file, projectId, type' },
        { status: 400 }
      );
    }

    // 检查文件大小 (限制 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.endsWith('.txt') && 
        !file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: '不支持的文件格式，请上传 PDF、DOCX、TXT 或 MD 文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 处理文件：解析 + 上传 R2
    const parsed = await processUploadedFile(
      buffer,
      file.name,
      file.type,
      projectId
    );

    // 保存到数据库
    const { data, error } = await supabaseAdmin
      .from('project_materials')
      .insert({
        project_id: projectId,
        type,
        file_type: 'file',
        content: parsed.textContent,
        mime_type: parsed.mimeType,
        file_name: parsed.fileName,
        r2_key: parsed.r2Key,
        r2_url: parsed.r2Url,
      })
      .select()
      .single();

    if (error) {
      console.error('数据库保存失败:', error);
      return NextResponse.json(
        { error: '文件保存失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        id: data.id,
        fileName: parsed.fileName,
        textContent: parsed.textContent.slice(0, 500) + '...', // 预览
        r2Url: parsed.r2Url,
      },
    });
  } catch (error: any) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { error: error.message || '文件处理失败' },
      { status: 500 }
    );
  }
}
