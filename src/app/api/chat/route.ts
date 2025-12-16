// ===========================================
// 聊天 API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { runChatSession } from '@/lib/openrouter';
import { supabaseAdmin } from '@/lib/supabase/server';
import { FileInput, ChatMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, message, history, materials, guidelines, finalReport } = body as {
      projectId: string;
      message: string;
      history: ChatMessage[];
      materials: FileInput[];
      guidelines: FileInput[];
      finalReport: string;
    };

    if (!projectId || !message) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 保存用户消息到数据库
    await supabaseAdmin
      .from('chat_history')
      .insert({
        project_id: projectId,
        role: 'user',
        text: message,
      });

    // 调用 AI
    const response = await runChatSession(
      message,
      history,
      materials,
      guidelines,
      finalReport
    );

    // 保存 AI 回复到数据库
    await supabaseAdmin
      .from('chat_history')
      .insert({
        project_id: projectId,
        role: 'model',
        text: response,
      });

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
